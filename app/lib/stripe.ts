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

// Enhanced pricing configuration for EzEdit
export const PRICING_PLANS = {
  FREE: {
    name: 'Starter',
    price: 0,
    priceId: null,
    yearlyPriceId: null,
    features: [
      '1 website connection',
      '50 AI requests/month',
      'Basic AI assistance',
      '7-day history',
      '10MB max file size',
      'Community support'
    ],
    limits: {
      websites: 1,
      aiRequests: 50,
      fileSizeMB: 10,
      historyDays: 7
    }
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 29,
    priceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
    yearlyPrice: 290,
    features: [
      '3 website connections',
      '500 AI requests/month',
      'Advanced AI assistance',
      'Unlimited history',
      '100MB max file size',
      'Priority email support (24hr)',
      'Batch file operations',
      'Code templates library'
    ],
    limits: {
      websites: 3,
      aiRequests: 500,
      fileSizeMB: 100,
      historyDays: -1 // unlimited
    }
  },
  AGENCY: {
    name: 'Agency',
    price: 99,
    priceId: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
    yearlyPrice: 990,
    features: [
      '15 website connections',
      '2,000 AI requests/month',
      'Advanced AI assistance',
      'Unlimited history',
      '500MB max file size',
      'Priority support (12hr response)',
      'Team collaboration (up to 5 members)',
      'Client site management',
      'Custom branding',
      'API access'
    ],
    limits: {
      websites: 15,
      aiRequests: 2000,
      fileSizeMB: 500,
      historyDays: -1
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'custom',
    yearlyPriceId: null, // Custom pricing
    yearlyPrice: null,
    features: [
      'Unlimited website connections',
      'Unlimited AI requests',
      'Premium AI assistance',
      'Unlimited history',
      'No file size limits',
      'Dedicated account manager',
      '24/7 phone support',
      'Unlimited team members',
      'SSO/SAML integration',
      'Custom integrations',
      'SLA guarantees'
    ],
    limits: {
      websites: -1, // unlimited
      aiRequests: -1,
      fileSizeMB: -1,
      historyDays: -1
    }
  }
}