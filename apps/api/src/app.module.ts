import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { validateEnv } from './config/env'
import { HealthModule } from './health/health.module'
import { AdminModule } from './modules/admin/admin.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { ApiGatewayModule } from './modules/api-gateway/api-gateway.module'
import { AssessmentsModule } from './modules/assessments/assessments.module'
import { AuditInterceptor } from './modules/audit/audit.interceptor'
import { AuditModule } from './modules/audit/audit.module'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { BrandingModule } from './modules/branding/branding.module'
import { CoursesModule } from './modules/courses/courses.module'
import { DirectoryModule } from './modules/directory/directory.module'
import { DoubtsModule } from './modules/doubts/doubts.module'
import { GamificationModule } from './modules/gamification/gamification.module'
import { HrmsModule } from './modules/hrms/hrms.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { PushModule } from './modules/push/push.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { PortalsModule } from './modules/portals/portals.module'
import { PublicApiModule } from './modules/public-api/public-api.module'
import { ScormModule } from './modules/scorm/scorm.module'
import { EnterpriseQueuesModule } from './queues/enterprise-queues.module'
import { SchoolModule } from './modules/school/school.module'
import { SearchModule } from './modules/search/search.module'
import { SpacesModule } from './modules/spaces/spaces.module'
import { SsoModule } from './modules/sso/sso.module'
import { StorageModule } from './modules/storage/storage.module'
import { StudyModule } from './modules/study/study.module'
import { StudyGroupsModule } from './modules/study-groups/study-groups.module'
import { VideoModule } from './modules/video/video.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    AdminModule,
    OrganizationsModule,
    SpacesModule,
    CoursesModule,
    AssessmentsModule,
    SchoolModule,
    DirectoryModule,
    StudyModule,
    StudyGroupsModule,
    DoubtsModule,
    GamificationModule,
    AnalyticsModule,
    StorageModule,
    VideoModule,
    NotificationsModule,
    PushModule,
    BillingModule,
    SearchModule,
    SsoModule,
    HrmsModule,
    ScormModule,
    BrandingModule,
    ApiGatewayModule,
    PublicApiModule,
    PortalsModule,
    EnterpriseQueuesModule.register(),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
