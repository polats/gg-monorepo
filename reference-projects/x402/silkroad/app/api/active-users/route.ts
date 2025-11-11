import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ActiveSession } from '@/models/ActiveSession';
import crypto from 'crypto';

/**
 * GET - Returns count of active users (sessions active within last 5 minutes)
 */
export async function GET() {
  try {
    await connectDB();

    // Count all active sessions (MongoDB TTL automatically removes expired ones)
    const count = await ActiveSession.countDocuments();
    console.log(`📊 Active users count: ${count}`);

    return NextResponse.json({
      success: true,
      activeUsers: count,
    });
  } catch (error: any) {
    console.error('Active users count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get active users' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update/create session activity
 * Expects: { sessionId: string, page?: string }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    let { sessionId, page } = body;

    // If no sessionId provided, generate one from IP + user agent
    if (!sessionId) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      sessionId = crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');
    }

    // Update or create session with current timestamp
    const session = await ActiveSession.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        lastSeen: new Date(),
        page: page || '/',
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Get current count for debugging
    const count = await ActiveSession.countDocuments();
    console.log(`✅ Session updated: ${sessionId.substring(0, 8)}... | Total active: ${count}`);

    return NextResponse.json({
      success: true,
      sessionId,
      activeUsers: count,
    });
  } catch (error: any) {
    console.error('Active users update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

