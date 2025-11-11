import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

interface SessionData {
  id: string;
  createdAt: number;
  lastAccessedAt: number;
  data: Record<string, unknown>;
}

/**
 * GET /api/session/get
 * Retrieves current session data and refreshes TTL
 */
export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Retrieve session from storage
    const sessionJson = await storage.get(`session:${sessionId}`);

    if (!sessionJson) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Parse session data
    const sessionData: SessionData = JSON.parse(sessionJson);

    // Update last accessed time
    sessionData.lastAccessedAt = Date.now();

    // Store updated session and refresh TTL
    await storage.set(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      SESSION_TTL
    );

    return NextResponse.json({
      success: true,
      session: sessionData,
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
