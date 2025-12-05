import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentTestForm } from '@/features/payments/components/payment-test-form'

export default async function PaymentTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Stripe Payment Test</h1>
          <p className="text-muted-foreground">
            Test the Stripe integration by creating a checkout session
          </p>
        </div>

        <PaymentTestForm />

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h3 className="font-medium">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click the button to create a checkout session</li>
            <li>You'll be redirected to Stripe's hosted checkout page</li>
            <li>Use test card: 4242 4242 4242 4242</li>
            <li>Use any future expiry date and any 3-digit CVC</li>
            <li>Complete the test payment</li>
            <li>You'll be redirected to the success page</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
