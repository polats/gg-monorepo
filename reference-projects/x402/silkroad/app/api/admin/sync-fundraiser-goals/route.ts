import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';

/**
 * ONE-TIME ADMIN ENDPOINT
 * Syncs goalAmount to match price for all fundraisers where they don't match
 * 
 * Usage: POST /api/admin/sync-fundraiser-goals
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Find all fundraisers where goalAmount doesn't match price
    const fundraisers = await Fundraiser.find({
      $expr: { $ne: ['$goalAmount', '$price'] }
    });

    console.log(`Found ${fundraisers.length} fundraisers to update`);

    const updates = [];
    for (const fundraiser of fundraisers) {
      console.log(`Updating "${fundraiser.title}" - goalAmount: ${fundraiser.goalAmount} -> ${fundraiser.price}`);
      
      await Fundraiser.findByIdAndUpdate(fundraiser._id, {
        goalAmount: fundraiser.price
      });
      
      updates.push({
        id: fundraiser._id,
        title: fundraiser.title,
        oldGoal: fundraiser.goalAmount,
        newGoal: fundraiser.price,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} fundraisers`,
      updates,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync goals', details: error.message },
      { status: 500 }
    );
  }
}

