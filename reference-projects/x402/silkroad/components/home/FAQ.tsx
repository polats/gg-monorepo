/**
 * FAQ Component
 * 
 * Frequently asked questions to help new users
 */

'use client';

import { useState } from 'react';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Do I need a USDC account to use SilkRoadx402?',
      answer: (
        <>
          <p className="mb-3">
            <strong>Yes</strong> - You need a Solana wallet with a USDC token account to:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li><strong>Buyers:</strong> Already set up automatically when you receive USDC</li>
            <li><strong>Sellers:</strong> Must have an initialized USDC account before creating listings</li>
          </ul>
          <p className="mb-3">
            <strong>How to get a USDC account:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Use Phantom Wallet (USDC accounts created automatically)</li>
            <li>Or send yourself a tiny amount of USDC from an exchange (initializes account)</li>
            <li>Or use{' '}
              <a 
                href="https://www.sollet.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Sollet.io
              </a>
              {' '}to manually create token accounts
            </li>
          </ol>
        </>
      ),
    },
    {
      question: 'What is the $SRx402 token and why is it required?',
      answer: (
        <>
          <p className="mb-3">
            $SRx402 is our platform token used for <strong>token gating</strong>. You need to hold <strong>50,000+ $SRx402</strong> in your wallet to access the marketplace.
          </p>
          <p className="mb-3">
            <strong>Why token gating?</strong>
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Reduces spam and malicious activity</li>
            <li>Creates a trusted community of stakeholders</li>
            <li>Holders have "skin in the game"</li>
          </ul>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3">
            Note: Transactions are paid in USDC, not $SRx402. The token is only for access.
          </p>
        </>
      ),
    },
    {
      question: 'How do payments work?',
      answer: (
        <>
          <p className="mb-3">
            We use the <strong>x402 micropayment protocol</strong> for peer-to-peer payments:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Payments go <strong>directly</strong> from buyer to seller (no escrow)</li>
            <li>Instant delivery after payment confirmation</li>
            <li>All transactions are in USDC on Solana</li>
            <li>Transaction fees are ~$0.00025 per tx</li>
          </ul>
          <p className="mt-3 text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950 p-3 rounded">
            ⚠️ <strong>Important:</strong> No refunds or chargebacks. Do your research before purchasing!
          </p>
        </>
      ),
    },
    {
      question: 'Is this safe? How do I protect myself?',
      answer: (
        <>
          <p className="mb-3">
            <strong>Security Tips:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li><strong>✓ Check vendor wallets:</strong> Search for vendors by their wallet address</li>
            <li><strong>✓ Read reviews:</strong> Only verified buyers can leave reviews</li>
            <li><strong>✓ Start small:</strong> Test with low-cost items first</li>
            <li><strong>✓ Report suspicious listings:</strong> Use the flag 🚩 button</li>
            <li><strong>✗ Never share wallet keys</strong></li>
          </ul>
          <p className="text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950 p-3 rounded">
            ⚠️ This is an <strong>anonymous marketplace</strong>. Exercise extreme caution and only transact with trusted vendors.
          </p>
        </>
      ),
    },
    {
      question: 'How do I create a listing?',
      answer: (
        <>
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Connect your wallet</strong> and hold 50k+ $SRx402</li>
            <li><strong>Ensure you have a USDC account</strong> to receive payments</li>
            <li>Go to "New Listing" and fill out the form</li>
            <li>Upload product image (max 5MB)</li>
            <li>Set price in USDC and add delivery URL (private)</li>
            <li>Optionally add demo video, whitepaper, GitHub (public)</li>
            <li>Submit for admin review (approval required)</li>
          </ol>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            <strong>Limits:</strong> Max 3 active listings per wallet. Listings auto-pulled after 3 failed purchases.
          </p>
        </>
      ),
    },
    {
      question: 'What happens after I purchase?',
      answer: (
        <>
          <ol className="list-decimal list-inside space-y-2">
            <li>Your wallet is charged in USDC</li>
            <li>Payment goes directly to the seller</li>
            <li><strong>Delivery URL is shown immediately</strong> (save it!)</li>
            <li>URL is also emailed to you (if email provided)</li>
            <li>Transaction is recorded on your profile</li>
            <li>You can leave a review after purchase</li>
          </ol>
          <p className="mt-3 text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950 p-3 rounded">
            ⚠️ <strong>Save the delivery URL immediately!</strong> We don't store unencrypted URLs for your privacy.
          </p>
        </>
      ),
    },
    {
      question: 'What wallets are supported?',
      answer: (
        <>
          <p className="mb-3">Currently supported Solana wallets:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Phantom</strong> - Recommended (USDC auto-setup)</li>
            <li><strong>Solflare</strong> - Full USDC support</li>
          </ul>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            More wallets coming soon! Make sure your wallet supports Solana SPL tokens.
          </p>
        </>
      ),
    },
    {
      question: 'How do I report a bad listing?',
      answer: (
        <>
          <ol className="list-decimal list-inside space-y-2 mb-3">
            <li>Go to the listing detail page</li>
            <li>Click the grey flag icon 🚩 in the top-right</li>
            <li>Optionally add a reason (max 100 characters)</li>
            <li>Submit the report</li>
          </ol>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Reports are reviewed by admins. Listings with multiple reports may be automatically pulled.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        ❓ Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {faq.question}
              </span>
              <span className="text-2xl text-zinc-500 dark:text-zinc-400">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className="p-4 pt-0 text-sm text-zinc-700 dark:text-zinc-300">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

