import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSession } from '@/lib/session';

/**
 * GET /api/gems/balance
 * Fetch current gem balance for the authenticated session
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from request
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Fetch gem balance from storage
    const balanceJson = await storage.get(`gems:${session.id}`);

    if (!balanceJson) {
      // No balance found, return default
      return NextResponse.json({
        balance: 0,
        lifetime: 0,
        spent: 0
      });
    }

    const balance = JSON.parse(balanceJson);

    return NextResponse.json({
      balance: balance.current || 0,
      lifetime: balance.lifetime || 0,
      spent: balance.spent || 0
    });
  } catch (error) {
    console.error('Error fetching gem balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
