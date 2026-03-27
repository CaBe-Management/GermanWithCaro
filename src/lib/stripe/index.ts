// Configured Stripe instance — use this in all server-side API routes
// NEVER import this in client components (it uses the secret key)
// Uses a lazy getter so it doesn't crash during build when env vars aren't available yet
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  }
  return _stripe
}
