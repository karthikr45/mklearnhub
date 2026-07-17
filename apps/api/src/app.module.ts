import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { validateEnv } from './config/env'
import { HealthModule } from './health/health.module'
import { AnalyticsModule } from './modules/analytics/analytics.module'
import { AssessmentsModule } from './modules/assessments/assessments.module'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { CoursesModule } from './modules/courses/courses.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { OrganizationsModule } from './modules/organizations/organizations.module'
import { SchoolModule } from './modules/school/school.module'
import { SearchModule } from './modules/search/search.module'
import { SpacesModule } from './modules/spaces/spaces.module'
import { StorageModule } from './modules/storage/storage.module'
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
    HealthModule,
    AuthModule,
    OrganizationsModule,
    SpacesModule,
    CoursesModule,
    AssessmentsModule,
    SchoolModule,
    AnalyticsModule,
    StorageModule,
    VideoModule,
    NotificationsModule,
    BillingModule,
    SearchModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
