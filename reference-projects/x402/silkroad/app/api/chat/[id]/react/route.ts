import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ChatMessage } from '@/models/ChatMessage';
import { CONFIG } from '@/config/constants';

const ALLOWED_REACTIONS = ['❤️', '👍', '👎', '👀', '🦃'];

/**
 * POST /api/chat/[id]/react
 * 
 * Add or remove a reaction to a chat message
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { wallet, emoji } = await req.json();

    if (!wallet || !emoji) {
      return NextResponse.json(
        { error: 'Wallet and emoji are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_REACTIONS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Invalid reaction. Allowed: ❤️, 👍, 👎, 👀, 🦃' },
        { status: 400 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: ${wallet.slice(0, 8)} reacted ${emoji} to message ${id}`);
      return NextResponse.json({
        success: true,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const message = await ChatMessage.findById(id);
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Get reactions map
    const reactions = message.reactions || new Map();
    const reactors = reactions.get(emoji) || [];

    // Toggle: if user already reacted, remove it; otherwise, add it
    const userIndex = reactors.indexOf(wallet);
    if (userIndex > -1) {
      // User already reacted - remove reaction
      reactors.splice(userIndex, 1);
      if (reactors.length === 0) {
        reactions.delete(emoji);
      } else {
        reactions.set(emoji, reactors);
      }
    } else {
      // Add reaction
      reactors.push(wallet);
      reactions.set(emoji, reactors);
    }

    message.reactions = reactions;
    await message.save();

    console.log(`💬 ${wallet.slice(0, 8)} reacted ${emoji} to message ${id}`);

    return NextResponse.json({
      success: true,
      reactions: Object.fromEntries(reactions),
    });
  } catch (error: any) {
    console.error('❌ React to message error:', error);
    return NextResponse.json(
      { error: 'Failed to react to message' },
      { status: 500 }
    );
  }
}

