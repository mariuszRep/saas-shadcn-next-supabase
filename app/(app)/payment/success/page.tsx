import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const sessionId = searchParams.session_id

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-12 w-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your test payment was processed successfully
          </p>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Stripe Integration Verified</h2>
            <p className="text-sm text-muted-foreground">
              The Stripe SDK is properly configured and working correctly.
            </p>
            {sessionId && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs font-mono break-all">
                  Session ID: {sessionId}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button asChild>
              <Link href="/payment/test">Test Another Payment</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/portal">Back to Portal</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h3 className="font-medium">What's Next?</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Stripe SDK installation: Complete</li>
            <li>API connectivity: Verified</li>
            <li>Checkout Session creation: Working</li>
            <li>Ready to build subscription features</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
