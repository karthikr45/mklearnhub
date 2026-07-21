'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, FileDown, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

type Plan = 'FREE' | 'TEAMS' | 'INSTITUTE' | 'ENTERPRISE'

interface PlanEntry {
  plan: Plan
  name: string
  priceInr: number | null
  interval: 'month'
  maxUsers: number
  maxCourses: number
  features: string[]
}

interface PlansResponse {
  plans: PlanEntry[]
  currentPlan: Plan
  razorpayConfigured: boolean
}

interface Subscription {
  id: string
  plan: Plan
  status: string
  provider: string | null
  currentPeriodEnd: string
}

interface RazorpayOrder {
  orderId: string
  amount: number
  currency: 'INR'
  keyId: string
}

interface CheckoutResponse {
  mode: 'dev' | 'razorpay'
  plan: Plan
  order?: RazorpayOrder
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${RAZORPAY_SRC}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = RAZORPAY_SRC
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })
}

function formatPrice(priceInr: number | null): string {
  if (priceInr == null) return 'Custom'
  if (priceInr === 0) return 'Free'
  return `₹${priceInr.toLocaleString('en-IN')}`
}

export default function BillingPage() {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<Plan | null>(null)
  const user = useAuthStore((s) => s.user)

  const plansQuery = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const { data } = await api.get<PlansResponse>('/billing/plans')
      return data
    },
  })

  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const { data } = await api.get<Subscription | null>(
        '/billing/subscription',
      )
      return data
    },
  })

  const refetch = () => {
    void queryClient.invalidateQueries({ queryKey: ['billing'] })
  }

  async function downloadReceipt(
    plan: Plan,
    paymentId: string,
    amountPaise: number,
  ) {
    try {
      const planName =
        plansQuery.data?.plans.find((p) => p.plan === plan)?.name ?? plan
      const [{ generateReceiptBlob }, { downloadBlob }] = await Promise.all([
        import('@/lib/pdf/receipt'),
        import('@/lib/pdf/download'),
      ])
      const receiptNo = `LH-${paymentId.replace(/^pay_/, '').slice(-8).toUpperCase()}`
      const blob = await generateReceiptBlob({
        receiptNo,
        paymentId,
        planName,
        amountInr: Math.round(amountPaise / 100),
        paidAt: new Date().toISOString(),
        billedTo: user?.name ?? 'Customer',
        ...(user?.email ? { billedEmail: user.email } : {}),
      })
      downloadBlob(blob, `receipt-${receiptNo}.pdf`)
    } catch {
      toast.error('Could not generate the receipt')
    }
  }

  async function verifyPayment(
    plan: Plan,
    resp: RazorpayHandlerResponse,
    amountPaise: number,
  ) {
    try {
      await api.post('/billing/verify', {
        plan,
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_signature: resp.razorpay_signature,
      })
      toast.success('Plan activated — downloading your receipt')
      refetch()
      void downloadReceipt(plan, resp.razorpay_payment_id, amountPaise)
    } catch {
      toast.error('Payment verification failed')
    }
  }

  async function choosePlan(plan: Plan) {
    setPending(plan)
    try {
      const { data } = await api.post<CheckoutResponse>('/billing/checkout', {
        plan,
      })

      if (data.mode === 'dev') {
        toast.success('Plan activated')
        refetch()
        return
      }

      const order = data.order
      if (!order) {
        toast.error('Could not start checkout')
        return
      }

      await loadRazorpayScript()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayCtor = (window as any).Razorpay
      const rzp = new RazorpayCtor({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'LearnHub',
        handler: (resp: RazorpayHandlerResponse) => {
          void verifyPayment(plan, resp, order.amount)
        },
      })
      rzp.open()
    } catch {
      toast.error('Could not start checkout')
    } finally {
      setPending(null)
    }
  }

  async function cancelSubscription() {
    setPending('FREE')
    try {
      await api.post('/billing/cancel')
      toast.success('Subscription canceled')
      refetch()
    } catch {
      toast.error('Could not cancel subscription')
    } finally {
      setPending(null)
    }
  }

  const data = plansQuery.data
  const currentPlan = data?.currentPlan ?? 'FREE'
  const subscription = subscriptionQuery.data

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your subscription and plan."
      />

      {plansQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-lg font-semibold">
                {data?.plans.find((p) => p.plan === currentPlan)?.name ??
                  currentPlan}
              </p>
              {subscription?.currentPeriodEnd ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Renews{' '}
                  {new Date(
                    subscription.currentPeriodEnd,
                  ).toLocaleDateString('en-IN')}
                </p>
              ) : null}
            </div>
            {currentPlan !== 'FREE' ? (
              <div className="flex items-center gap-2">
                {(() => {
                  const price =
                    data?.plans.find((p) => p.plan === currentPlan)?.priceInr ??
                    0
                  return price > 0 ? (
                    <button
                      onClick={() =>
                        void downloadReceipt(
                          currentPlan,
                          subscription?.id ?? 'current',
                          price * 100,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <FileDown className="h-4 w-4" /> Receipt
                    </button>
                  ) : null
                })()}
                <button
                  onClick={() => void cancelSubscription()}
                  disabled={pending !== null}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  {pending === 'FREE' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Cancel subscription
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data?.plans.map((entry) => {
              const isCurrent = entry.plan === currentPlan
              const isEnterprise = entry.plan === 'ENTERPRISE'
              const isPending = pending === entry.plan

              return (
                <div
                  key={entry.plan}
                  className={`flex flex-col rounded-lg border p-5 ${
                    isCurrent ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                >
                  <h3 className="font-semibold">{entry.name}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">
                      {formatPrice(entry.priceInr)}
                    </span>
                    {entry.priceInr != null && entry.priceInr > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {entry.maxUsers.toLocaleString('en-IN')} members ·{' '}
                    {entry.maxCourses.toLocaleString('en-IN')} courses
                  </p>

                  <ul className="mt-4 flex-1 space-y-2 text-sm">
                    {entry.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground"
                      >
                        Current plan
                      </button>
                    ) : isEnterprise ? (
                      <a
                        href="mailto:sales@learnhub.com?subject=Enterprise%20plan"
                        className="block w-full rounded-md border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
                      >
                        Contact sales
                      </a>
                    ) : (
                      <button
                        onClick={() => void choosePlan(entry.plan)}
                        disabled={pending !== null}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Choose {entry.name}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {data && !data.razorpayConfigured ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Razorpay is not configured — plan changes activate immediately in
              dev mode.
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
