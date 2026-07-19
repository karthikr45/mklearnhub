import { createHmac, timingSafeEqual } from 'node:crypto'

import { Injectable, ServiceUnavailableException } from '@nestjs/common'

export interface RazorpayOrder {
  orderId: string
  amount: number
  currency: 'INR'
  keyId: string
}

@Injectable()
export class RazorpayService {
  /** True only when both Razorpay credentials are present in the environment. */
  isConfigured(): boolean {
    return Boolean(
      process.env['RAZORPAY_KEY_ID'] && process.env['RAZORPAY_KEY_SECRET'],
    )
  }

  /**
   * Creates a Razorpay order. The Razorpay SDK is imported lazily so that
   * merely importing this module never opens a network connection and the API
   * boots with Postgres only. Callers must guard with `isConfigured()`.
   */
  async createOrder(
    amountInInr: number,
    receipt: string,
  ): Promise<RazorpayOrder> {
    const keyId = process.env['RAZORPAY_KEY_ID']
    const keySecret = process.env['RAZORPAY_KEY_SECRET']
    if (!keyId || !keySecret) {
      throw new ServiceUnavailableException('Razorpay not configured')
    }

    const { default: Razorpay } = await import('razorpay')
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const amount = amountInInr * 100 // paise
    const order = await client.orders.create({
      amount,
      currency: 'INR',
      receipt,
    })

    return { orderId: order.id, amount, currency: 'INR', keyId }
  }

  /**
   * Verifies a Razorpay checkout payment: HMAC-SHA256 of
   * `${orderId}|${paymentId}` keyed with the API secret, compared to the
   * signature returned by the browser checkout.
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const keySecret = process.env['RAZORPAY_KEY_SECRET']
    if (!keySecret) return false
    const expected = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
    return this.safeEqualHex(expected, signature)
  }

  /**
   * Verifies a Razorpay webhook: HMAC-SHA256 of the raw request body keyed with
   * the webhook secret (falling back to the API secret when unset).
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret =
      process.env['RAZORPAY_WEBHOOK_SECRET'] ??
      process.env['RAZORPAY_KEY_SECRET']
    if (!secret) return false
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    return this.safeEqualHex(expected, signature)
  }

  /** Timing-safe hex comparison that never throws on length mismatch. */
  private safeEqualHex(expected: string, actual: string): boolean {
    if (!actual) return false
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(actual, 'hex')
    if (a.length !== b.length || a.length === 0) return false
    return timingSafeEqual(a, b)
  }
}
