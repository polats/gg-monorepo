import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ChatMessage } from '@/models/ChatMessage';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateChatMessage } from '@/lib/validation/chatFilter';
import { createLog, getIpFromRequest } from '@/lib/logger';

/**
 * GET /api/chat
 * 
 * Fetch recent chat messages (public)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log('🧪 MOCK: Fetching chat messages');
      return NextResponse.json({
        success: true,
        messages: [],
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const messagesWithReplies = messages.filter((m: any) => m.replyTo);
    if (messagesWithReplies.length > 0) {
      console.log(`📬 Found ${messagesWithReplies.length} messages with replyTo field before enrichment`);
    }

    // Enrich with listing data and reply data if attached
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        // Convert reactions Map to plain object (handle both Map and POJO)
        let reactions = {};
        if (msg.reactions) {
          if (msg.reactions instanceof Map) {
            reactions = Object.fromEntries(msg.reactions);
          } else if (typeof msg.reactions === 'object') {
            // Already a plain object from MongoDB
            reactions = msg.reactions;
          }
        }
        
        const enriched: any = {
          ...msg,
          reactions,
        };
        
        // Attach listing/fundraiser data if present
        if (msg.listingId) {
          // Try listing first
          let listing = await Listing.findById(msg.listingId).lean() as { _id: any; title: string; price: number; imageUrl: string } | null;
          
          // If not found, try fundraiser
          if (!listing) {
            listing = await Fundraiser.findById(msg.listingId).lean() as { _id: any; title: string; price: number; imageUrl: string } | null;
          }
          
          enriched.listing = listing ? {
              _id: listing._id.toString(),
              title: listing.title,
              price: listing.price,
              imageUrl: listing.imageUrl,
            type: listing ? (await Listing.findById(msg.listingId) ? 'listing' : 'fundraiser') : undefined,
          } : null;
        }
        
        // Attach reply data if present
        if (msg.replyTo) {
          const repliedMsg = await ChatMessage.findById(msg.replyTo).lean() as { _id: any; wallet: string; message: string } | null;
          console.log(`📧 Message ${msg._id} replies to ${msg.replyTo}, found:`, repliedMsg ? 'YES' : 'NO');
          enriched.replyTo = repliedMsg ? {
            _id: repliedMsg._id.toString(),
            wallet: repliedMsg.wallet,
            message: repliedMsg.message,
          } : null;
        }
        
        return enriched;
      })
    );

    // Reverse to show oldest first (chat order)
    const finalMessages = enrichedMessages.reverse();
    const enrichedWithReplies = finalMessages.filter((m: any) => m.replyTo);
    if (enrichedWithReplies.length > 0) {
      console.log(`✨ Returning ${enrichedWithReplies.length} messages with enriched reply data`);
    }
    
    return NextResponse.json({
      success: true,
      messages: finalMessages,
    });
  } catch (error: any) {
    console.error('❌ Fetch chat messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat
 * 
 * Send a chat message (requires token gating + rate limiting)
 */
export async function POST(req: NextRequest) {
  try {
    const { wallet, message, listingId, replyTo } = await req.json();

    console.log('📨 POST /api/chat received:', { wallet: wallet?.slice(0, 8), message, listingId, replyTo });

    if (!wallet || !message) {
      return NextResponse.json(
        { error: 'Wallet and message are required' },
        { status: 400 }
      );
    }

    // Validate and filter message
    const validation = validateChatMessage(message);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check rate limit (1 message per 60 seconds)
    const rateLimit = await checkRateLimit(wallet, {
      windowMs: 60000, // 60 seconds
      maxRequests: 1,
      keyPrefix: 'chat',
    });

    if (!rateLimit.allowed) {
      const resetIn = Math.max(0, rateLimit.resetAt.getTime() - Date.now());
      const timeLeft = Math.ceil(resetIn / 1000);
      return NextResponse.json(
        { 
          error: `Please wait ${timeLeft}s before sending another message`,
          resetIn: resetIn,
        },
        { status: 429 }
      );
    }

    // Auto-detect message type from content
    const lowerMsg = validation.message.toLowerCase();
    let messageType: 'selling' | 'buying' | 'general' = 'general';
    
    if (lowerMsg.includes('selling') || lowerMsg.includes('wts') || lowerMsg.includes('sell')) {
      messageType = 'selling';
    } else if (lowerMsg.includes('buying') || lowerMsg.includes('wtb') || lowerMsg.includes('buy')) {
      messageType = 'buying';
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Chat message from ${wallet.slice(0, 8)}: ${validation.message}`);
      
      return NextResponse.json({
        success: true,
        message: {
          _id: 'mock-chat-id',
          wallet,
          message: validation.message,
          messageType,
          listingId: listingId || null,
          createdAt: new Date(),
        },
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // If listing/fundraiser attached, verify it exists and belongs to user
    if (listingId) {
      let item = await Listing.findById(listingId);
      
      // If not a listing, try fundraiser
      if (!item) {
        item = await Fundraiser.findById(listingId);
      }
      
      if (!item) {
        return NextResponse.json(
          { error: 'Listing/Fundraiser not found' },
          { status: 404 }
        );
      }
      if (item.wallet !== wallet) {
        return NextResponse.json(
          { error: 'You can only attach your own listings/fundraisers' },
          { status: 403 }
        );
      }
    }

    // Create chat message
    const chatMessageData = {
      wallet,
      message: validation.message,
      messageType,
      listingId: listingId || undefined,
      replyTo: replyTo || undefined,
    };
    
    console.log(`💬 Creating chat message with data:`, chatMessageData);

    const chatMessage = await ChatMessage.create(chatMessageData);
    
    console.log(`✅ Chat message created with ID: ${chatMessage._id}, replyTo: ${chatMessage.replyTo || 'none'}`);

    // Log chat activity
    await createLog(
      'info',
      `Chat: ${wallet.slice(0, 8)}... posted${listingId ? ' with listing' : ''}`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      message: chatMessage,
    });
  } catch (error: any) {
    console.error('❌ Chat message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

