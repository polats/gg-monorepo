"use client";

import * as React from "react";
import { cn } from "./utils";

interface AccordionContextValue {
  type: 'single' | 'multiple';
  collapsible?: boolean;
  openItems: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

interface AccordionProps {
  type: 'single' | 'multiple';
  collapsible?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Accordion({ type, collapsible = false, children, className, ...props }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = React.useCallback((value: string) => {
    setOpenItems(prev => {
      if (type === 'single') {
        if (prev.includes(value)) {
          return collapsible ? [] : prev;
        }
        return [value];
      } else {
        if (prev.includes(value)) {
          return prev.filter(item => item !== value);
        }
        return [...prev, value];
      }
    });
  }, [type, collapsible]);

  return (
    <AccordionContext.Provider value={{ type, collapsible, openItems, toggleItem }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function AccordionItem({ value, children, className, ...props }: AccordionItemProps) {
  return (
    <div
      className={cn("border-b last:border-b-0", className)}
      data-value={value}
      {...props}
    >
      {children}
    </div>
  );
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className, ...props }: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);
  const parent = React.useContext(AccordionItemContext);

  if (!context) {
    throw new Error('AccordionTrigger must be used within an Accordion');
  }

  if (!parent) {
    throw new Error('AccordionTrigger must be used within an AccordionItem');
  }

  const isOpen = context.openItems.includes(parent.value);

  const handleClick = () => {
    context.toggleItem(parent.value);
  };

  return (
    <button
      className={cn(
        "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      onClick={handleClick}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <svg
        className={cn(
          "pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

const AccordionItemContext = React.createContext<{ value: string } | null>(null);

function AccordionContent({ children, className, ...props }: AccordionContentProps) {
  const context = React.useContext(AccordionContext);
  const parent = React.useContext(AccordionItemContext);

  if (!context) {
    throw new Error('AccordionContent must be used within an Accordion');
  }

  if (!parent) {
    throw new Error('AccordionContent must be used within an AccordionItem');
  }

  const isOpen = context.openItems.includes(parent.value);

  return (
    <div
      className={cn(
        "overflow-hidden text-sm transition-all duration-200 ease-in-out",
        isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
      )}
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>
        {children}
      </div>
    </div>
  );
}

// Enhanced AccordionItem that provides context
function EnhancedAccordionItem({ value, children, className, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <AccordionItem value={value} className={className} {...props}>
        {children}
      </AccordionItem>
    </AccordionItemContext.Provider>
  );
}

export {
  Accordion,
  EnhancedAccordionItem as AccordionItem,
  AccordionTrigger,
  AccordionContent
};