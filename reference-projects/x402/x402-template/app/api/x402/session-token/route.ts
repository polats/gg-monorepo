import { NextRequest, NextResponse } from 'next/server'

/**
 * X402 Session Token Endpoint
 * 
 * This endpoint is called by the x402 payment middleware after a successful payment.
 * It receives the session token and payment data from the x402 gateway.
 * 
 * The session token can be used to verify the payment and associate it with the user's session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log all data received from x402 gateway for debugging
    console.log('='.repeat(80))
    console.log('[X402 Session Token] Payment completed!')
    console.log('='.repeat(80))
    console.log('[X402 Session Token] Full request body:', JSON.stringify(body, null, 2))
    console.log('[X402 Session Token] Session Token:', body.sessionToken)
    console.log('[X402 Session Token] Payment Data:', body.paymentData)
    console.log('[X402 Session Token] Timestamp:', new Date().toISOString())
    console.log('[X402 Session Token] Request URL:', request.url)
    console.log('[X402 Session Token] Request Headers:', Object.fromEntries(request.headers.entries()))
    console.log('='.repeat(80))
    
    // Store the session token in a cookie for debugging purposes
    const response = NextResponse.json({ 
      success: true,
      received: {
        sessionToken: body.sessionToken,
        paymentData: body.paymentData,
        timestamp: new Date().toISOString()
      }
    })
    
    // Set a debug cookie with the session token
    if (body.sessionToken) {
      response.cookies.set('x402_session_token', body.sessionToken, {
        httpOnly: false, // Allow client-side access for debugging
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      })
    }
    
    // Store payment data in a debug cookie
    if (body.paymentData) {
      response.cookies.set('x402_payment_data', JSON.stringify(body.paymentData), {
        httpOnly: false, // Allow client-side access for debugging
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      })
    }
    
    return response
  } catch (error) {
    console.error('[X402 Session Token] Error processing session token:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
