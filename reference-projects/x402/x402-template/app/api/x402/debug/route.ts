import { NextRequest, NextResponse } from 'next/server'

/**
 * X402 Debug Endpoint
 * 
 * Returns all x402-related data stored in cookies for debugging purposes.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('x402_session_token')?.value
    const paymentDataStr = request.cookies.get('x402_payment_data')?.value
    const sessionId = request.cookies.get('sessionId')?.value
    
    let paymentData = null
    if (paymentDataStr) {
      try {
        paymentData = JSON.parse(paymentDataStr)
      } catch (e) {
        console.error('[X402 Debug] Error parsing payment data:', e)
      }
    }
    
    const debugInfo = {
      x402SessionToken: sessionToken || null,
      x402PaymentData: paymentData,
      appSessionId: sessionId || null,
      allCookies: Object.fromEntries(
        Array.from(request.cookies.getAll()).map(cookie => [cookie.name, cookie.value])
      ),
      timestamp: new Date().toISOString()
    }
    
    console.log('[X402 Debug] Debug info requested:', JSON.stringify(debugInfo, null, 2))
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('[X402 Debug] Error retrieving debug info:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
