import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import { Report } from '@/models/Report';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';
import { CONFIG } from '@/config/constants';

/**
 * Check if admin is authenticated
 */
async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  return adminSession?.value === 'active';
}

/**
 * GET /api/admin/reports
 * 
 * Fetch all reports with listing details
 */
export async function GET(req: NextRequest) {
  // Block if admin is disabled
  if (CONFIG.DISABLE_ADMIN) {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }

  try {
    if (!(await checkAdminAuth(req))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log('🧪 MOCK: Fetching reports');
      
      // Return empty reports for now
      return NextResponse.json({
        success: true,
        reports: [],
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Get all reports
    const reportsData = await Report.find()
      .sort({ createdAt: -1 })
      .lean();
    
    const reports = reportsData as any as Array<{
      _id: any;
      listingId: string;
      reporterWallet: string;
      reason?: string;
      createdAt: Date;
    }>;

    // Enrich with listing/fundraiser data
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        // Try Listing first, then Fundraiser
        let item = await Listing.findById(report.listingId).lean() as { _id: any; title: string; wallet: string; state: string; reportsCount: number; type?: string } | null;
        let itemType = 'listing';
        
        if (!item) {
          item = await Fundraiser.findById(report.listingId).lean() as { _id: any; title: string; wallet: string; state: string; reportsCount: number; type?: string } | null;
          itemType = 'fundraiser';
        }
        
        return {
          ...report,
          listing: item ? {
            _id: item._id.toString(),
            title: item.title,
            wallet: item.wallet,
            state: item.state,
            reportsCount: item.reportsCount,
            type: itemType,
          } : null,
        };
      })
    );

    // Group by listing (show unique listings with report count)
    const listingReportCounts = enrichedReports.reduce((acc: any, report) => {
      if (!report.listing) return acc;
      
      const listingId = report.listing._id;
      if (!acc[listingId]) {
        acc[listingId] = {
          ...report.listing,
          reportCount: 0,
          reports: [],
        };
      }
      acc[listingId].reportCount += 1;
      acc[listingId].reports.push({
        _id: report._id,
        reporterWallet: report.reporterWallet,
        reason: report.reason,
        createdAt: report.createdAt,
      });
      return acc;
    }, {});

    const summary = Object.values(listingReportCounts);

    return NextResponse.json({
      success: true,
      reports: summary,
      total: reports.length,
    });
  } catch (error: any) {
    console.error('❌ Fetch reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

