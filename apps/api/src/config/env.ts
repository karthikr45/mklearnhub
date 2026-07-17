import { plainToInstance } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator'

/**
 * Environment schema. Only DATABASE_URL and the JWT secrets are required to
 * boot locally; everything else is optional so the API runs without Redis,
 * Elasticsearch, S3, Stripe, etc. configured.
 */
export class EnvConfig {
  @IsString()
  @IsOptional()
  NODE_ENV: string = 'development'

  @IsInt()
  PORT = 3001

  @IsString()
  DATABASE_URL!: string

  @IsString()
  JWT_SECRET = 'dev-access-secret-change-me'

  @IsString()
  JWT_REFRESH_SECRET = 'dev-refresh-secret-change-me'

  @IsString()
  JWT_EXPIRES_IN = '15m'

  @IsString()
  JWT_REFRESH_EXPIRES_IN = '7d'

  @IsString()
  @IsOptional()
  REDIS_URL?: string

  @IsString()
  @IsOptional()
  ELASTICSEARCH_URL?: string

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string

  @IsString()
  @IsOptional()
  AWS_BUCKET_NAME?: string

  @IsString()
  @IsOptional()
  AWS_REGION?: string

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY?: string

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string

  @IsString()
  @IsOptional()
  RAZORPAY_KEY_ID?: string

  @IsString()
  @IsOptional()
  RAZORPAY_KEY_SECRET?: string

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string

  @IsString()
  FRONTEND_URL = 'http://localhost:3000'

  @IsString()
  APP_URL = 'http://localhost:3001'

  @IsBoolean()
  @IsOptional()
  ENABLE_QUEUES = false

  @IsBoolean()
  @IsOptional()
  ENABLE_SEARCH = false
}

function toBool(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  // Env vars arrive as strings; coerce the typed ones before validation.
  const raw: Record<string, unknown> = { ...config }
  if (raw.PORT !== undefined) raw.PORT = Number(raw.PORT)
  if (raw.ENABLE_QUEUES !== undefined) raw.ENABLE_QUEUES = toBool(raw.ENABLE_QUEUES)
  if (raw.ENABLE_SEARCH !== undefined) raw.ENABLE_SEARCH = toBool(raw.ENABLE_SEARCH)

  const validated = plainToInstance(EnvConfig, raw, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validated, { skipMissingProperties: false })
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors
        .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('\n')}`,
    )
  }
  return validated
}
