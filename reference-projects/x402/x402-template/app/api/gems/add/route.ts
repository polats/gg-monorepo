import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getSession } from '@/lib/session';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const RATE_LIMIT_MAX_REQUESTS = 100;

/**
 * Check rate limit for a session
 */
async function checkRateLimit(sessionId: string): Promise<boolean> {
  const rateLimitKey = `ratelimit:gems:${sessionId}`;
  const currentCount = await storage.get(rateLimitKey);

  if (!currentCount) {
    // First request in window
    await storage.set(rateLimitKey, '1', RATE_LIMIT_WINDOW);
    return true;
  }

  const count = parseInt(currentCount, 10);

  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment counter
  await storage.set(rateLimitKey, (count + 1).toString(), RATE_LIMIT_WINDOW);
  return true;
}

/**
 * Log transaction to storage for audit purposes
 */
async function logTransaction(
  sessionId: string,
  type: 'purchase' | 'spend',
  amount: number,
  description: string
): Promise<void> {
  const transaction = {
    type,
    amount,
    timestamp: Date.now(),
    description
  };

  const transactionKey = `transactions:${sessionId}`;
  const transactionsJson = await storage.get(transactionKey);

  let transactions = [];
  if (transactionsJson) {
    transactions = JSON.parse(transactionsJson);
  }

  transactions.push(transaction);

  // Keep only last 100 transactions per session
  const recentTransactions = transactions.slice(-100);

  // Store with 7 day TTL (same as session)
  await storage.set(
    transactionKey,
    JSON.stringify(recentTransactions),
    7 * 24 * 60 * 60
  );
}

/**
 * POST /api/gems/add
 * Credit gems after successful purchase with transaction logging
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from request
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(session.id);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded - Maximum 100 requests per minute' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { amount, description = 'Gem purchase' } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount - Must be a positive integer' },
        { status: 400 }
      );
    }

    // Fetch current balance
    const balanceKey = `gems:${session.id}`;
    const balanceJson = await storage.get(balanceKey);

    let balance = {
      current: 0,
      lifetime: 0,
      spent: 0
    };

    if (balanceJson) {
      balance = JSON.parse(balanceJson);
    }

    // Add gems
    balance.current += amount;
    balance.lifetime += amount;

    // Save updated balance with 7 day TTL (same as session)
    await storage.set(
      balanceKey,
      JSON.stringify(balance),
      7 * 24 * 60 * 60
    );

    // Log transaction
    await logTransaction(session.id, 'purchase', amount, description);

    return NextResponse.json({
      success: true,
      balance: balance.current,
      lifetime: balance.lifetime,
      spent: balance.spent,
      added: amount
    });
  } catch (error) {
    console.error('Error adding gems:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
