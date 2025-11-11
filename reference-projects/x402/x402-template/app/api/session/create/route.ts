import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { randomUUID } from 'crypto';

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

interface SessionData {
  id: string;
  createdAt: number;
  lastAccessedAt: number;
  data: Record<string, unknown>;
}

/**
 * POST /api/session/create
 * Creates a new session and returns session ID in httpOnly cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Generate unique session ID
    const sessionId = randomUUID();
    
    // Create session data
    const sessionData: SessionData = {
      id: sessionId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      data: {},
    };

    // Store session in storage layer with TTL
    await storage.set(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      SESSION_TTL
    );

    // Create response with session cookie
    const response = NextResponse.json(
      { success: true, sessionId },
      { status: 201 }
    );

    // Set httpOnly cookie for security
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
