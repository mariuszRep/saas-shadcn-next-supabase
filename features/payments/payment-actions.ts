'use server'

import { redirect } from 'next/navigation'
import { createCheckoutSession } from '@/services/payment-service'

/**
 * Payment Actions - Next.js Server Actions
 * Thin wrappers around service layer that handle framework-specific concerns
 * (redirects, FormData parsing)
 */

/**
 * Create a Stripe Checkout Session and redirect to checkout
 */
export async function createTestCheckoutSession() {
  const result = await createCheckoutSession()

  if (result.error) {
    return { error: result.error }
  }

  if (result.url) {
    redirect(result.url)
  }

  return { error: 'No checkout URL returned' }
}
