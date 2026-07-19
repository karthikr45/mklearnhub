-- Razorpay billing fields on subscriptions
ALTER TABLE "subscriptions" ADD COLUMN "razorpayCustomerId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "razorpaySubId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "provider" TEXT;
CREATE UNIQUE INDEX "subscriptions_razorpaySubId_key" ON "subscriptions"("razorpaySubId");
