import { Address } from 'viem'
import { paymentMiddleware, Resource, Network } from 'x402-next'
import { NextRequest, NextResponse } from 'next/server'

const address = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as Address
const network = process.env.NEXT_PUBLIC_NETWORK as Network
const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource
const cdpClientKey = process.env.NEXT_PUBLIC_CDP_CLIENT_KEY as string
const x402Enabled = process.env.X402_GATEWAY === 'true'

// Configure X402 payment middleware with gem purchase tiers
// Each tier represents a different gem package with varying value and bonuses
// When X402 is enabled, these routes require payment before access
// After payment verification, the page loads and credits gems
const x402PaymentMiddleware = paymentMiddleware(
  address,
  {
    // Starter Pack: 100 gems for $0.01 (no bonus)
    // Entry-level option for new players to try the gacha system
    '/purchase/starter': {
      price: '$0.01',
      config: {
        description: 'Starter Pack - 100 gems',
      },
      network,
    },
    // Value Pack: 550 gems for $0.02 (10% bonus)
    // Best value option with 50 bonus gems (500 base + 10% = 550)
    '/purchase/value': {
      price: '$0.02',
      config: {
        description: 'Value Pack - 550 gems (10% bonus)',
      },
      network,
    },
    // Premium Pack: 1200 gems for $0.03 (20% bonus)
    // Premium option with 200 bonus gems (1000 base + 20% = 1200)
    '/purchase/premium': {
      price: '$0.03',
      config: {
        description: 'Premium Pack - 1200 gems (20% bonus)',
      },
      network,
    },
  },
  {
    url: facilitatorUrl,
  },
  {
    cdpClientKey,
    appLogo: '/logos/x402-examples.png',
    appName: 'x402 Gacha Demo',
    sessionTokenEndpoint: '/api/x402/session-token',
  },
)

export const middleware = (req: NextRequest) => {
  // If X402_GATEWAY is not enabled, bypass the payment middleware
  if (!x402Enabled) {
    console.log('[Middleware] X402_GATEWAY disabled, bypassing payment middleware')
    return NextResponse.next()
  }

  const delegate = x402PaymentMiddleware as unknown as (
    request: NextRequest,
  ) => ReturnType<typeof x402PaymentMiddleware>
  return delegate(req)
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/', // Include the root path explicitly
  ],
}
