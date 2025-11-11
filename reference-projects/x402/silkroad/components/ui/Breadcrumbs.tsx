'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname);
  
  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              
              {isLast || !crumb.href ? (
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];
  
  let currentPath = '';
  
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Handle dynamic routes
    if (segment.match(/^[a-f0-9]{24}$/i)) {
      // MongoDB ObjectId pattern - skip
      return;
    }
    
    // Format the label
    let label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Custom labels for known routes
    const customLabels: Record<string, string> = {
      'my': 'My Listings',
      'new': 'Create New',
      'faq': 'FAQ',
      'tos': 'Terms of Service',
    };
    
    label = customLabels[segment] || label;
    
    breadcrumbs.push({
      label,
      href: index === paths.length - 1 ? undefined : currentPath,
    });
  });
  
  return breadcrumbs;
}

