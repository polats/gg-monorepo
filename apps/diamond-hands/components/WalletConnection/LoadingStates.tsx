"use client";

import { ReactNode } from "react";

/**
 * Props for the Spinner component
 */
interface SpinnerProps {
  /** Size variant of the spinner */
  size?: "sm" | "md" | "lg";
  /** Color theme of the spinner */
  color?: "primary" | "secondary" | "white" | "muted";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Spinner component provides a customizable loading indicator with various sizes and colors.
 *
 * @param props - Spinner component props
 * @returns JSX element representing a spinning loading indicator
 *
 * @example
 * ```tsx
 * <Spinner size="lg" color="primary" />
 * <Spinner size="sm" color="white" className="mr-2" />
 * ```
 */
export const Spinner = ({
  size = "md",
  color = "primary",
  className = ""
}: SpinnerProps) => {
  const sizeClasses = {
    sm: "w-3 h-3 border-[1.5px]",
    md: "w-5 h-5 border-2",
    lg: "w-8 h-8 border-2"
  };

  const colorClasses = {
    primary: "border-gray-300 border-t-blue-600",
    secondary: "border-gray-300 border-t-gray-600",
    white: "border-gray-200 border-t-white",
    muted: "border-gray-200 border-t-gray-400"
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
};

/**
 * Props for the PulsingDot component
 */
interface PulsingDotProps {
  /** Color of the pulsing dot */
  color?: "green" | "yellow" | "red" | "gray";
  /** Size of the dot */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * PulsingDot component provides a pulsing status indicator typically used for connection states.
 *
 * @param props - PulsingDot component props
 * @returns JSX element representing a pulsing status dot
 *
 * @example
 * ```tsx
 * <PulsingDot color="green" size="md" />
 * <PulsingDot color="red" size="lg" />
 * ```
 */
export const PulsingDot = ({
  color = "green",
  size = "md",
  className = ""
}: PulsingDotProps) => {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3"
  };

  const colorClasses = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
    gray: "bg-gray-400"
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        rounded-full animate-pulse
        ${className}
      `}
      role="status"
      aria-label={`${color} status indicator`}
    />
  );
};

/**
 * Props for the LoadingButton component
 */
interface LoadingButtonProps {
  /** Button content */
  children: ReactNode;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Visual variant of the button */
  variant?: "primary" | "secondary";
  /** Size of the button */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingButton component provides a button with integrated loading state and spinner.
 *
 * @param props - LoadingButton component props
 * @returns JSX element representing a button with optional loading state
 *
 * @example
 * ```tsx
 * <LoadingButton isLoading={saving} onClick={handleSave}>
 *   Save Changes
 * </LoadingButton>
 * ```
 */
export const LoadingButton = ({
  children,
  isLoading = false,
  disabled = false,
  onClick,
  variant = "primary",
  size = "md",
  className = ""
}: LoadingButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:bg-blue-300",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      aria-disabled={isDisabled}
    >
      {isLoading && (
        <Spinner
          size="sm"
          color={variant === "primary" ? "white" : "secondary"}
          className="mr-2"
        />
      )}
      {children}
    </button>
  );
};

/**
 * Props for the SkeletonText component
 */
interface SkeletonTextProps {
  /** Number of skeleton lines to display */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonText component provides animated loading placeholders for text content.
 *
 * @param props - SkeletonText component props
 * @returns JSX element representing text loading placeholders
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * <SkeletonText lines={1} className="w-32" />
 * ```
 */
export const SkeletonText = ({ lines = 1, className = "" }: SkeletonTextProps) => {
  return (
    <div className={`animate-pulse ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`
            bg-gray-200 rounded h-4 mb-2 last:mb-0
            ${index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}
          `}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton loading placeholder for circular avatars
 */
interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SkeletonAvatar = ({ size = "md", className = "" }: SkeletonAvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gray-200 rounded-full animate-pulse
        ${className}
      `}
      role="status"
      aria-label="Loading avatar"
    />
  );
};

/**
 * Card skeleton for balance display
 */
interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard = ({ className = "" }: SkeletonCardProps) => {
  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse ${className}`}
      role="status"
      aria-label="Loading card content"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="bg-gray-200 rounded h-4 w-24" />
        <div className="bg-gray-200 rounded-full h-6 w-16" />
      </div>

      {/* Main content */}
      <div className="text-center mb-3">
        <div className="bg-gray-200 rounded h-8 w-32 mx-auto mb-2" />
        <div className="bg-gray-200 rounded h-4 w-20 mx-auto" />
      </div>

      {/* Footer */}
      <div className="bg-gray-200 rounded h-3 w-full mb-3" />
      <div className="bg-gray-200 rounded h-8 w-24 mx-auto" />
    </div>
  );
};

/**
 * Fade transition wrapper for smooth content changes
 */
interface FadeTransitionProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

export const FadeTransition = ({ children, show, className = "" }: FadeTransitionProps) => {
  return (
    <div
      className={`
        transition-opacity duration-300 ease-in-out
        ${show ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/**
 * Loading overlay for components
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: ReactNode;
  className?: string;
}

export const LoadingOverlay = ({
  isLoading,
  message = "Loading...",
  children,
  className = ""
}: LoadingOverlayProps) => {
  return (
    <div className={`relative ${className}`}>
      {children}

      {isLoading && (
        <div
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg"
          role="status"
          aria-label={message}
        >
          <div className="flex flex-col items-center space-y-2">
            <Spinner size="lg" color="primary" />
            <span className="text-sm text-gray-600 font-medium">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Progress bar for loading operations
 */
interface ProgressBarProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  color?: "blue" | "green" | "yellow" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProgressBar = ({
  progress,
  showPercentage = false,
  color = "blue",
  size = "md",
  className = ""
}: ProgressBarProps) => {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };

  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600"
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-600 text-center mt-1">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

/**
 * Pulse animation for updating content
 */
interface PulseWrapperProps {
  children: ReactNode;
  isPulsing?: boolean;
  className?: string;
}

export const PulseWrapper = ({
  children,
  isPulsing = false,
  className = ""
}: PulseWrapperProps) => {
  return (
    <div
      className={`
        transition-all duration-150
        ${isPulsing ? 'animate-pulse bg-blue-50 ring-2 ring-blue-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};