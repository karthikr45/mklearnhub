-- CreateEnum
CREATE TYPE "SsoProvider" AS ENUM ('SAML', 'AZURE_AD', 'OKTA', 'GOOGLE_WORKSPACE', 'LDAP');

-- CreateEnum
CREATE TYPE "HrmsProvider" AS ENUM ('SAP_SUCCESS_FACTORS', 'ORACLE_HCM', 'WORKDAY', 'DARWINBOX', 'ZOHO_PEOPLE', 'CUSTOM_WEBHOOK', 'CSV_SFTP');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ScormVersion" AS ENUM ('SCORM_12', 'SCORM_2004', 'XAPI', 'CMI5');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "InstanceStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'SUSPENDED', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "BulkImportType" AS ENUM ('USERS', 'ENROLLMENTS', 'GRADES', 'ATTENDANCE');

-- CreateEnum
CREATE TYPE "BulkJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED');

-- CreateEnum
CREATE TYPE "DsrType" AS ENUM ('EXPORT', 'DELETE', 'RECTIFY');

-- CreateEnum
CREATE TYPE "DsrStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "sso_configurations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "SsoProvider" NOT NULL,
    "metadataUrl" TEXT,
    "metadataXml" TEXT,
    "entityId" TEXT,
    "ssoUrl" TEXT,
    "x509Certificate" TEXT,
    "attributeMap" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "testEmail" TEXT,
    "lastTestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_syncs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "HrmsProvider" NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "totalSynced" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fieldMapping" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_sync_logs" (
    "id" TEXT NOT NULL,
    "hrmsSyncId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scorm_packages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" "ScormVersion" NOT NULL DEFAULT 'SCORM_2004',
    "s3Key" TEXT NOT NULL,
    "manifestPath" TEXT NOT NULL,
    "entryPoint" TEXT NOT NULL,
    "scoList" JSONB NOT NULL DEFAULT '[]',
    "durationMins" INTEGER,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scorm_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_scorms" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "scormPackageId" TEXT NOT NULL,

    CONSTRAINT "lesson_scorms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scorm_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scormPackageId" TEXT NOT NULL,
    "scoId" TEXT NOT NULL,
    "completionStatus" TEXT NOT NULL DEFAULT 'unknown',
    "successStatus" TEXT NOT NULL DEFAULT 'unknown',
    "score" DECIMAL(5,2),
    "maxScore" DECIMAL(5,2),
    "totalTime" TEXT,
    "suspendData" TEXT,
    "location" TEXT,
    "sessionTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scorm_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xapi_statements" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "verb" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "result" JSONB,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "stored" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawStatement" JSONB NOT NULL,

    CONSTRAINT "xapi_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "ratePeriod" TEXT NOT NULL DEFAULT 'hour',
    "allowedIps" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_usage" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branding_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "appName" TEXT,
    "faviconUrl" TEXT,
    "logoUrl" TEXT,
    "logoDarkUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6366F1',
    "secondaryColor" TEXT NOT NULL DEFAULT '#0EA5E9',
    "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "customCss" TEXT,
    "customDomain" TEXT,
    "sslCertStatus" TEXT,
    "loginBgUrl" TEXT,
    "loginBgColor" TEXT,
    "footerText" TEXT,
    "supportEmail" TEXT,
    "hideLearnhubBranding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dedicated_instances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "dbUrl" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "s3Prefix" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'ap-south-1',
    "status" "InstanceStatus" NOT NULL DEFAULT 'PROVISIONING',
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "provisionedAt" TIMESTAMP(3),
    "lastHealthAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dedicated_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_import_jobs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "BulkImportType" NOT NULL,
    "filename" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "status" "BulkJobStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_subject_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DsrType" NOT NULL,
    "status" "DsrStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "exportUrl" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sso_configurations_organizationId_key" ON "sso_configurations"("organizationId");

-- CreateIndex
CREATE INDEX "hrms_sync_logs_hrmsSyncId_idx" ON "hrms_sync_logs"("hrmsSyncId");

-- CreateIndex
CREATE INDEX "scorm_packages_organizationId_idx" ON "scorm_packages"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_scorms_lessonId_key" ON "lesson_scorms"("lessonId");

-- CreateIndex
CREATE INDEX "scorm_tracking_userId_idx" ON "scorm_tracking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "scorm_tracking_userId_scormPackageId_scoId_key" ON "scorm_tracking"("userId", "scormPackageId", "scoId");

-- CreateIndex
CREATE UNIQUE INDEX "xapi_statements_statementId_key" ON "xapi_statements"("statementId");

-- CreateIndex
CREATE INDEX "xapi_statements_organizationId_idx" ON "xapi_statements"("organizationId");

-- CreateIndex
CREATE INDEX "xapi_statements_actorEmail_idx" ON "xapi_statements"("actorEmail");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_organizationId_idx" ON "api_keys"("organizationId");

-- CreateIndex
CREATE INDEX "api_key_usage_apiKeyId_createdAt_idx" ON "api_key_usage"("apiKeyId", "createdAt");

-- CreateIndex
CREATE INDEX "webhooks_organizationId_idx" ON "webhooks"("organizationId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_idx" ON "webhook_deliveries"("webhookId");

-- CreateIndex
CREATE UNIQUE INDEX "branding_configs_organizationId_key" ON "branding_configs"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "branding_configs_customDomain_key" ON "branding_configs"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "dedicated_instances_organizationId_key" ON "dedicated_instances"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "dedicated_instances_subdomain_key" ON "dedicated_instances"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "dedicated_instances_customDomain_key" ON "dedicated_instances"("customDomain");

-- CreateIndex
CREATE INDEX "bulk_import_jobs_organizationId_idx" ON "bulk_import_jobs"("organizationId");

-- CreateIndex
CREATE INDEX "data_subject_requests_organizationId_idx" ON "data_subject_requests"("organizationId");

-- AddForeignKey
ALTER TABLE "sso_configurations" ADD CONSTRAINT "sso_configurations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_syncs" ADD CONSTRAINT "hrms_syncs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_sync_logs" ADD CONSTRAINT "hrms_sync_logs_hrmsSyncId_fkey" FOREIGN KEY ("hrmsSyncId") REFERENCES "hrms_syncs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorm_packages" ADD CONSTRAINT "scorm_packages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_scorms" ADD CONSTRAINT "lesson_scorms_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_scorms" ADD CONSTRAINT "lesson_scorms_scormPackageId_fkey" FOREIGN KEY ("scormPackageId") REFERENCES "scorm_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorm_tracking" ADD CONSTRAINT "scorm_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorm_tracking" ADD CONSTRAINT "scorm_tracking_scormPackageId_fkey" FOREIGN KEY ("scormPackageId") REFERENCES "scorm_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding_configs" ADD CONSTRAINT "branding_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dedicated_instances" ADD CONSTRAINT "dedicated_instances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
