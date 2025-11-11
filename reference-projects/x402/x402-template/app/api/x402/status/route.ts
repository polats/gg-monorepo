import { NextResponse } from 'next/server'

export async function GET() {
  const x402Enabled = process.env.X402_GATEWAY === 'true'
  
  return NextResponse.json({
    enabled: x402Enabled,
    mode: x402Enabled ? 'production' : 'debug'
  })
}
