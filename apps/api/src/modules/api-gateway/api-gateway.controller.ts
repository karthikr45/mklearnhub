import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { JwtPayload } from '@learnhub/types'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { ApiKeyService } from './api-key.service'
import { CreateApiKeyDto } from './dto/create-api-key.dto'
import { RegisterWebhookDto } from './dto/register-webhook.dto'
import {
  UpdateWebhookInput,
  WebhookService,
} from './webhook.service'

/** Resolve the caller's organization id or reject unscoped access. */
function orgId(user: JwtPayload): string {
  if (!user.orgId) throw new ForbiddenException('No organization context')
  return user.orgId
}

@ApiTags('api-gateway')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN', 'SUPER_ADMIN')
@Controller('api-gateway')
export class ApiGatewayController {
  constructor(
    private readonly apiKeys: ApiKeyService,
    private readonly webhooks: WebhookService,
  ) {}

  // ─── API keys ───────────────────────────────────────────

  @Post('api-keys')
  createApiKey(
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.apiKeys.createApiKey(orgId(user), user.sub, dto)
  }

  @Get('api-keys')
  listApiKeys(@CurrentUser() user: JwtPayload) {
    return this.apiKeys.listApiKeys(orgId(user))
  }

  @Put('api-keys/:id/rotate')
  rotateApiKey(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.apiKeys.rotateApiKey(id, orgId(user))
  }

  @Delete('api-keys/:id')
  revokeApiKey(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.apiKeys.revokeApiKey(id, orgId(user))
  }

  @Get('api-keys/:id/usage')
  getUsageStats(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.apiKeys.getUsageStats(id, orgId(user))
  }

  // ─── Webhooks ───────────────────────────────────────────

  @Post('webhooks')
  registerWebhook(
    @Body() dto: RegisterWebhookDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.webhooks.registerWebhook(orgId(user), dto)
  }

  @Get('webhooks')
  listWebhooks(@CurrentUser() user: JwtPayload) {
    return this.webhooks.listWebhooks(orgId(user))
  }

  @Put('webhooks/:id')
  updateWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.webhooks.updateWebhook(id, orgId(user), dto)
  }

  @Delete('webhooks/:id')
  deleteWebhook(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.webhooks.deleteWebhook(id, orgId(user))
  }

  @Post('webhooks/:id/ping')
  testWebhook(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.webhooks.testWebhook(id, orgId(user))
  }

  @Get('webhooks/:id/deliveries')
  getDeliveries(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.webhooks.getDeliveries(id, orgId(user), {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
  }
}
