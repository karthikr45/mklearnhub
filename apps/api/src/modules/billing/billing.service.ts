import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Plan, SubscriptionStatus } from '@learnhub/db'
import type StripeType from 'stripe'

import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { getPlan, PLAN_CATALOG } from './plans'
import { RazorpayService } from './razorpay.service'

interface VerifyPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

@Injectable()
export class BillingService {
  private stripe: StripeType | null = null

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly audit: AuditService,
  ) {}

  // ─── Razorpay / plan catalog ───────────────────────────────

  async getPlans(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    })
    return {
      plans: PLAN_CATALOG,
      currentPlan: org?.plan ?? Plan.FREE,
      razorpayConfigured: this.razorpay.isConfigured(),
    }
  }

  /** Applies a plan to the org and upserts its subscription row. */
  private async activate(orgId: string, plan: Plan) {
    const entry = getPlan(plan)
    if (!entry) throw new BadRequestException('Unknown plan')

    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const provider = this.razorpay.isConfigured() ? 'razorpay' : 'dev'

    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: entry.plan,
        maxUsers: entry.maxUsers,
        maxCourses: entry.maxCourses,
      },
    })

    const existing = await this.prisma.subscription.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })

    if (existing) {
      await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan: entry.plan,
          status: SubscriptionStatus.ACTIVE,
          provider,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      })
    } else {
      await this.prisma.subscription.create({
        data: {
          organizationId: orgId,
          plan: entry.plan,
          status: SubscriptionStatus.ACTIVE,
          provider,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      })
    }

    await this.audit.log({
      organizationId: orgId,
      action: 'billing.plan_changed',
      resource: 'Organization',
      resourceId: orgId,
      newValues: { plan: entry.plan },
    })

    return { plan: entry.plan, activated: true as const }
  }

  /**
   * Starts a plan change. FREE/ENTERPRISE (never billed through Razorpay) and
   * the unconfigured-local case activate directly (dev mode); a configured,
   * paid plan returns a Razorpay order to complete in the browser.
   */
  async checkout(orgId: string, plan: Plan) {
    const entry = getPlan(plan)
    if (!entry) throw new BadRequestException('Unknown plan')

    const needsPayment =
      entry.plan !== Plan.FREE &&
      entry.plan !== Plan.ENTERPRISE &&
      entry.priceInr != null &&
      entry.priceInr > 0

    if (!needsPayment || !this.razorpay.isConfigured()) {
      const result = await this.activate(orgId, entry.plan)
      return { mode: 'dev' as const, ...result }
    }

    const order = await this.razorpay.createOrder(
      entry.priceInr as number,
      `org_${orgId}_${entry.plan}`,
    )
    return { mode: 'razorpay' as const, plan: entry.plan, order }
  }

  async verifyAndActivate(orgId: string, plan: Plan, payload: VerifyPayload) {
    const valid = this.razorpay.verifyPaymentSignature(
      payload.razorpay_order_id,
      payload.razorpay_payment_id,
      payload.razorpay_signature,
    )
    if (!valid) throw new BadRequestException('Invalid payment signature')
    return this.activate(orgId, plan)
  }

  async handleRazorpayWebhook(rawBody: string, signature: string) {
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature')
    }
    // Activation happens synchronously via /billing/verify; the webhook is kept
    // minimal and simply acknowledges receipt.
    return { received: true }
  }

  async cancel(orgId: string) {
    const free = getPlan(Plan.FREE)
    await this.prisma.organization.update({
      where: { id: orgId },
      data: {
        plan: Plan.FREE,
        ...(free
          ? { maxUsers: free.maxUsers, maxCourses: free.maxCourses }
          : {}),
      },
    })
    await this.prisma.subscription.updateMany({
      where: { organizationId: orgId },
      data: { status: SubscriptionStatus.CANCELED, cancelAtPeriodEnd: true },
    })
    await this.audit.log({
      organizationId: orgId,
      action: 'billing.canceled',
      resource: 'Organization',
      resourceId: orgId,
      newValues: { plan: Plan.FREE },
    })
    return { canceled: true as const }
  }

  // ─── Stripe (existing) ─────────────────────────────────────

  /** Lazily builds the Stripe client; only imported when a key is present. */
  private async getStripe(): Promise<StripeType> {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')
    if (!key) {
      throw new ServiceUnavailableException('Billing not configured')
    }
    if (!this.stripe) {
      const { default: Stripe } = await import('stripe')
      this.stripe = new Stripe(key)
    }
    return this.stripe
  }

  async createCheckoutSession(orgId: string, plan: Plan, returnUrl: string) {
    const stripe = await this.getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: returnUrl,
      cancel_url: returnUrl,
      metadata: { organizationId: orgId, plan },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: { name: `${plan} plan` },
            unit_amount: 1000,
            recurring: { interval: 'month' },
          },
        },
      ],
    })
    return { id: session.id, url: session.url }
  }

  async handleWebhook(payload: string | Buffer, sig: string) {
    const stripe = await this.getStripe()
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')
    if (!secret) {
      throw new ServiceUnavailableException('Webhook secret not configured')
    }
    const event = stripe.webhooks.constructEvent(payload, sig, secret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as StripeType.Checkout.Session
      const organizationId = session.metadata?.['organizationId']
      const plan = session.metadata?.['plan'] as Plan | undefined
      if (organizationId && plan) {
        await this.prisma.subscription.create({
          data: {
            organizationId,
            plan,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            ...(session.customer
              ? { stripeCustomerId: String(session.customer) }
              : {}),
            ...(session.subscription
              ? { stripeSubId: String(session.subscription) }
              : {}),
          },
        })
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as StripeType.Subscription
      await this.prisma.subscription.updateMany({
        where: { stripeSubId: sub.id },
        data: { status: 'CANCELED' },
      })
    }

    return { received: true, type: event.type }
  }

  async cancelSubscription(orgId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })
    if (!subscription) {
      throw new ServiceUnavailableException('No subscription found')
    }
    if (subscription.stripeSubId) {
      const stripe = await this.getStripe()
      await stripe.subscriptions.update(subscription.stripeSubId, {
        cancel_at_period_end: true,
      })
    }
    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    })
  }

  async getSubscription(orgId: string) {
    // Reads straight from Prisma so it works even without Stripe configured.
    return this.prisma.subscription.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
