import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Plan } from '@learnhub/db'
import type StripeType from 'stripe'

import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class BillingService {
  private stripe: StripeType | null = null

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

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
