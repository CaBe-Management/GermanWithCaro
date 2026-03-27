// Configured Stripe instance — use this in all server-side API routes
// NEVER import this in client components (it uses the secret key)
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})
