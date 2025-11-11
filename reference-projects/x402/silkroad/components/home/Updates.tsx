/**
 * Platform Updates/Changelog Component
 * 
 * Manually maintained list of platform updates
 */

export function Updates() {
  const updates = [
    {
      date: 'November 8, 2025',
      version: 'v0.9.0',
      title: '✨ Major UX Overhaul - Professional Polish & Enhanced Browsing',
      items: [
        '🎊 Professional toast notification system replacing all browser alerts',
        '💬 Beautiful confirmation dialogs with backdrop blur replacing confirm() popups',
        '🧭 Breadcrumb navigation added to all major pages for better orientation',
        '💀 Content-aware loading skeletons replacing generic spinners (cards, tables, stats)',
        '🔍 Advanced browse filters: Sort by Recent/Price/Views + Price range filtering',
        '📊 Price range options: Under $10, $10-$50, $50-$100, Over $100',
        '🔗 External link icons added to transaction hashes with hover animations',
        '🎨 Toast variants: success (green), error (red), warning (yellow), info (blue)',
        '⚡ Real-time sorting and filtering without page reloads',
        '✅ Smooth zoom-in animations for confirmation dialogs',
        '🎯 Auto-dismiss toasts after 5 seconds with manual close option',
        '💎 Consistent design language across all user interactions',
        '🛠️ Reusable component architecture for future enhancements',
      ],
    },
    {
      date: 'November 4, 2025',
      version: 'v0.8.1',
      title: '📊 Fundraiser Progress Tracking & UX Improvements',
      items: [
        '📊 Fixed fundraiser progress bars now always visible on details page',
        '💰 Fixed goal amounts - now uses user input instead of hardcoded $500',
        '🎯 Real-time donation tracking - raised amounts calculated from actual transactions (source of truth)',
        '📈 Added progress bars to fundraiser list view with multiple indicators',
        '💝 List view shows: bottom progress bar, amount display ($X/$Y), and percentage badge',
        '🔗 Clickable organizer/seller wallets - filter fundraisers or listings by wallet',
        '📦 Seller wallets on market listings link to all items by that seller',
        '💝 Organizer wallets on fundraisers link to all fundraisers by that organizer',
        '📏 Fixed wallet text sizing - now smaller (6/4 chars) to fit properly in boxes',
        '🎨 Purple theme consistency for all fundraiser elements (hover states, progress bars)',
        '⚡ Removed manual database sync needs - API now calculates raised amounts dynamically',
        '🔧 Fixed TypeScript interface to properly support goalAmount and raisedAmount fields',
        '💎 Enhanced catalog page to show accurate progress bars with transaction data',
        '📱 Responsive progress indicators - different info shown at mobile/tablet/desktop',
      ],
    },
    {
      date: 'November 3, 2025',
      version: 'v0.8.0',
      title: '💝 Fundraisers Platform, Chat Replies & RuneScape Market',
      items: [
        '💝 NEW: Complete fundraiser platform alongside listings marketplace',
        '🎯 Anonymous fundraising with same x402 payment flow as purchases',
        '💰 Fundraiser categories: Medical, Education, Community, Emergency, Creative, Other',
        '🔒 Full seller management: Create, edit, deactivate fundraisers in "My Listings"',
        '👨‍💼 Admin support: Separate fundraiser tab with independent approval workflow',
        '🐛 Fixed fundraiser x402 donation protocol (proper payment verification)',
        '💬 Full threaded reply system in RuneScape Market chat',
        '📨 Reply messages display quoted context with green visual indicators',
        '🖱️ Click reply quotes to smoothly scroll to original message with highlight',
        '💚 Desktop: Click ↩ button to reply | Mobile: Swipe right on messages',
        '🔄 Backend enrichment system fetches original message data for replies',
        '🦃 Added turkey emoji (🦃) reaction to chat emoji picker',
        '🏪 Rebranded chat to "RuneScape Market" with shop icon and green theme',
        '🔒 Owner protection: Hide purchase/donate buttons on own items',
        '🎨 Fixed horizontal scrollbar in chat with overflow controls',
      ],
    },
    {
      date: 'November 3, 2025',
      version: 'v0.7.0',
      title: 'Marketplace Expansion & View Analytics',
      items: [
        '🌐 Rebranded from "Software Marketplace" to "Digital Marketplace"',
        '📦 Platform now supports any legal goods, not just software',
        '👁️ View counter feature - track listing popularity',
        '📊 View analytics displayed on all listing cards',
        '📈 Total views prominently shown on listing detail pages',
        '✨ Animated pulse effect on featured listing badges',
        '🎨 Fixed homepage spacing to account for navbar/footer offset',
        '📱 Improved page padding across all views',
        '🚀 Enhanced empty state with "Be the first to list" CTA button',
        '🏷️ Updated all labels from "software" to generic "product" terminology',
        'View counts persist across sessions and increment on each visit',
      ],
    },
    {
      date: 'November 1, 2025',
      version: 'v0.6.0',
      title: 'Edit Listings & New Category',
      items: [
        '✏️ Edit listing functionality - update title, description, price, category, and image',
        '🏷️ New "Jobs/Services" category for freelance and service listings',
        '🚨 Critical USDC account warning added to listing creation',
        '🔒 Delivery URL is now locked after creation (cannot be edited)',
        '✅ Edited listings require admin re-approval if previously live',
        '📝 Improved form validation and user feedback',
        'Optional URLs (demo video, whitepaper, GitHub) remain editable',
      ],
    },
    {
      date: 'October 31, 2025',
      version: 'v0.5.0',
      title: 'UI Refresh & Featured Listings',
      items: [
        '🎨 Complete color refresh - pump.fun green theme across the app',
        '📋 Grid and list view toggle for all listings pages',
        'Compact list view for efficient browsing (more listings visible)',
        '📌 Admin pin feature - promote up to 3 featured listings',
        'Pinned listings always appear first with "Featured" badge',
        '🔗 External links kept blue for standard web UX',
        'Chat message reactions (❤️, 👍, 👎, 👀)',
        '📱 Improved mobile navigation with hamburger menu',
      ],
    },
    {
      date: 'October 31, 2025',
      version: 'v0.4.0',
      title: 'Public Chat & Community Features',
      items: [
        '💬 RuneScape-style public chat for marketplace trading',
        'Optional listing attachments - shill your products in chat',
        'Advanced content filtering (URLs blocked, profanity filtered)',
        'Color-coded messages (🟢 selling, 🔵 buying, 🟡 general)',
        '60-second rate limiting with cooldown timer',
      ],
    },
    {
      date: 'October 31, 2025',
      version: 'v0.3.0',
      title: 'Reviews, Reports & Activity Logging',
      items: [
        'Verified buyer reviews system on all listings',
        'User reporting with greyed-out flag icon',
        'Comprehensive admin activity logging (all actions tracked)',
        'Auto-refresh admin dashboard with isolated components',
        'FAQ & Updates pages with footer navigation',
      ],
    },
    {
      date: 'October 30, 2025',
      version: 'v0.2.0',
      title: 'Anti-Spam & Enhanced Security',
      items: [
        'Maximum 3 active listings per wallet',
        'Rate limiting on all API endpoints',
        'Auto-pull listings after 3 failed purchases',
        'Enhanced seller USDC account validation',
        'Solflare wallet support added',
      ],
    },
    {
      date: 'October 29, 2025',
      version: 'v0.1.0',
      title: 'Initial Beta Launch',
      items: [
        'x402 micropayment protocol integration',
        'Anonymous P2P software marketplace',
        'Token gating (50k $SRx402 required)',
        'Solana USDC payments',
        'Admin approval system',
      ],
    },
  ];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        📋 Platform Updates
      </h2>
      <div className="space-y-6">
        {updates.map((update, index) => (
          <div
            key={index}
            className="border-l-4 border-green-600 pl-6 pb-6 last:pb-0"
          >
            <div className="mb-2 flex items-center space-x-3">
              <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
                {update.version}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {update.date}
              </span>
            </div>
            <h3 className="mb-3 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {update.title}
            </h3>
            <ul className="space-y-2">
              {update.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="flex items-start space-x-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <span className="mt-1 text-green-600">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

