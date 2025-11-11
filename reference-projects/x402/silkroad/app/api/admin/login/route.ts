import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';

/**
 * TEMPORARY Admin Login (MVP)
 * 
 * Uses simple code verification and returns success.
 * Frontend uses localStorage for session management.
 * 
 * TODO: Replace with proper JWT-based auth for production
 */
export async function POST(req: NextRequest) {
  // Block if admin is disabled
  if (CONFIG.DISABLE_ADMIN) {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Admin code is required' },
        { status: 400 }
      );
    }

    // Verify admin code
    if (code !== CONFIG.ADMIN_CODE) {
      console.log('❌ Invalid admin code attempt');
      return NextResponse.json(
        { error: 'Invalid admin code' },
        { status: 401 }
      );
    }

    console.log('✅ Admin authenticated successfully (TEMP localStorage mode)');

    // Simple success response
    // Frontend will set localStorage flag
    const response = NextResponse.json({
      success: true,
      isAdmin: true,
      _mock: CONFIG.MOCK_MODE,
      _temp: 'Using localStorage for admin session (MVP only)',
    });

    // Set simple cookie as backup
    response.cookies.set('admin_session', 'active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('❌ Admin login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

