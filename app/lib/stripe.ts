import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_APP_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

export const createOrRetrieveCustomer = async ({
  email,
  uuid
}: {
  email: string
  uuid: string
}) => {
  // Check if customer already exists in Stripe
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabaseUUID: uuid
    }
  })

  return customer.id
}

export const createCheckoutSession = async ({
  customerId,
  priceId,
  isYearly = false
}: {
  customerId: string
  priceId: string
  isYearly?: boolean
}) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    billing_address_collection: 'required',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
      metadata: {
        isYearly: isYearly.toString()
      }
    },
    success_url: `${getURL()}dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getURL()}pricing`,
    metadata: {
      customerId
    }
  })

  return session
}

export const createBillingPortalSession = async (customerId: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getURL()}dashboard`
  })

  return session
}

export const getSubscriptionPlans = async () => {
  const prices = await stripe.prices.list({
    active: true,
    expand: ['data.product']
  })

  return prices.data.map((price) => ({
    id: price.id,
    name: (price.product as Stripe.Product).name,
    description: (price.product as Stripe.Product).description,
    price: price.unit_amount! / 100,
    interval: price.recurring?.interval,
    currency: price.currency,
    metadata: (price.product as Stripe.Product).metadata
  }))
}

// Pricing configuration for EzEdit
export const PRICING_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '1 website connection',
      'Basic AI assistance',
      '7-day history'
    ]
  },
  SINGLE_SITE: {
    name: 'Single Site',
    price: 20,
    priceId: process.env.STRIPE_SINGLE_SITE_PRICE_ID,
    features: [
      '1 website connection',
      'Advanced AI assistance',
      'Unlimited history',
      'Priority support'
    ]
  },
  UNLIMITED: {
    name: 'Unlimited',
    price: 100,
    priceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
    features: [
      'Unlimited websites',
      'Advanced AI assistance',
      'Unlimited history',
      'Team collaboration',
      'Dedicated support'
    ]
  }
}