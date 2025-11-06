"use client";

import { ReactNode } from "react";
import { LoadingButton } from "./LoadingStates";

/**
 * Error severity levels
 */
export type ErrorSeverity = "error" | "warning" | "info";

/**
 * Error types for better categorization
 */
export type ErrorType =
  | "connection"
  | "authentication"
  | "network"
  | "balance"
  | "transaction"
  | "validation"
  | "timeout"
  | "unknown";

/**
 * Error action configuration
 */
export interface ErrorAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

/**
 * Base error message props
 */
interface BaseErrorMessageProps {
  title?: string;
  message: string;
  severity?: ErrorSeverity;
  type?: ErrorType;
  actions?: ErrorAction[];
  onDismiss?: () => void;
  dismissible?: boolean;
  icon?: ReactNode;
  className?: string;
}

/**
 * Get appropriate icon for error type and severity
 */
const getErrorIcon = (type: ErrorType, severity: ErrorSeverity): string => {
  if (severity === "info") return "ℹ️";
  if (severity === "warning") return "⚠️";

  switch (type) {
    case "connection":
      return "🔌";
    case "authentication":
      return "🔐";
    case "network":
      return "🌐";
    case "balance":
      return "💰";
    case "transaction":
      return "📄";
    case "validation":
      return "❌";
    case "timeout":
      return "⏱️";
    default:
      return "⚠️";
  }
};

/**
 * Get CSS classes for error severity
 */
const getSeverityClasses = (severity: ErrorSeverity) => {
  switch (severity) {
    case "error":
      return {
        container: "bg-red-50 border-red-200 text-red-900",
        title: "text-red-800",
        message: "text-red-700",
        icon: "text-red-500"
      };
    case "warning":
      return {
        container: "bg-yellow-50 border-yellow-200 text-yellow-900",
        title: "text-yellow-800",
        message: "text-yellow-700",
        icon: "text-yellow-500"
      };
    case "info":
      return {
        container: "bg-blue-50 border-blue-200 text-blue-900",
        title: "text-blue-800",
        message: "text-blue-700",
        icon: "text-blue-500"
      };
  }
};

/**
 * Base error message component
 */
export const ErrorMessage = ({
  title,
  message,
  severity = "error",
  type = "unknown",
  actions = [],
  onDismiss,
  dismissible = false,
  icon,
  className = ""
}: BaseErrorMessageProps) => {
  const classes = getSeverityClasses(severity);
  const defaultIcon = getErrorIcon(type, severity);

  return (
    <div
      className={`
        border rounded-lg p-4
        ${classes.container}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${classes.icon}`}>
          {icon || <span className="text-lg">{defaultIcon}</span>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-medium mb-1 ${classes.title}`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${classes.message}`}>
            {message}
          </p>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <LoadingButton
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || "secondary"}
                  size="sm"
                  isLoading={action.isLoading}
                  className={
                    severity === "error"
                      ? "bg-red-100 hover:bg-red-200 text-red-800 focus:ring-red-500"
                      : severity === "warning"
                      ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-800 focus:ring-yellow-500"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-800 focus:ring-blue-500"
                  }
                >
                  {action.label}
                </LoadingButton>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${classes.icon} hover:opacity-70 focus:outline-none focus:opacity-70`}
            aria-label="Dismiss error"
          >
            <span className="text-lg">×</span>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Compact error message for inline display
 */
interface CompactErrorMessageProps {
  message: string;
  severity?: ErrorSeverity;
  type?: ErrorType;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
  className?: string;
}

export const CompactErrorMessage = ({
  message,
  severity = "error",
  type = "unknown",
  onRetry,
  isRetrying = false,
  className = ""
}: CompactErrorMessageProps) => {
  const classes = getSeverityClasses(severity);
  const icon = getErrorIcon(type, severity);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={`text-sm ${classes.icon}`}>{icon}</span>
      <span className={`text-xs ${classes.message} flex-1 min-w-0 truncate`}>
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className={`text-xs underline ${classes.message} hover:opacity-70 focus:outline-none focus:opacity-70 disabled:opacity-50`}
          aria-label="Retry operation"
        >
          {isRetrying ? "..." : "Retry"}
        </button>
      )}
    </div>
  );
};

/**
 * Connection error component with specific messaging
 */
interface ConnectionErrorProps {
  error: string;
  onRetry?: () => void | Promise<void>;
  onTroubleshoot?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const ConnectionError = ({
  error,
  onRetry,
  onTroubleshoot,
  isRetrying = false,
  className = ""
}: ConnectionErrorProps) => {
  const actions: ErrorAction[] = [];

  if (onRetry) {
    actions.push({
      label: "Retry Connection",
      onClick: onRetry,
      variant: "primary",
      isLoading: isRetrying
    });
  }

  if (onTroubleshoot) {
    actions.push({
      label: "Troubleshoot",
      onClick: onTroubleshoot,
      variant: "secondary"
    });
  }

  return (
    <ErrorMessage
      title="Connection Failed"
      message={error}
      severity="error"
      type="connection"
      actions={actions}
      className={className}
    />
  );
};

/**
 * Balance error component
 */
interface BalanceErrorProps {
  error: string;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  className?: string;
}

export const BalanceError = ({
  error,
  onRefresh,
  isRefreshing = false,
  className = ""
}: BalanceErrorProps) => {
  const actions: ErrorAction[] = [];

  if (onRefresh) {
    actions.push({
      label: "Refresh Balance",
      onClick: onRefresh,
      variant: "primary",
      isLoading: isRefreshing
    });
  }

  return (
    <ErrorMessage
      title="Balance Error"
      message={error}
      severity="warning"
      type="balance"
      actions={actions}
      className={className}
    />
  );
};

/**
 * Network error component
 */
interface NetworkErrorProps {
  error: string;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
  showOfflineMessage?: boolean;
  className?: string;
}

export const NetworkError = ({
  error,
  onRetry,
  isRetrying = false,
  showOfflineMessage = false,
  className = ""
}: NetworkErrorProps) => {
  const message = showOfflineMessage
    ? "You appear to be offline. Please check your internet connection."
    : error;

  const actions: ErrorAction[] = [];

  if (onRetry) {
    actions.push({
      label: "Try Again",
      onClick: onRetry,
      variant: "primary",
      isLoading: isRetrying
    });
  }

  return (
    <ErrorMessage
      title="Network Error"
      message={message}
      severity="error"
      type="network"
      actions={actions}
      className={className}
    />
  );
};

/**
 * Authentication error component
 */
interface AuthenticationErrorProps {
  error: string;
  onReconnect?: () => void | Promise<void>;
  onSignOut?: () => void;
  isReconnecting?: boolean;
  className?: string;
}

export const AuthenticationError = ({
  error,
  onReconnect,
  onSignOut,
  isReconnecting = false,
  className = ""
}: AuthenticationErrorProps) => {
  const actions: ErrorAction[] = [];

  if (onReconnect) {
    actions.push({
      label: "Reconnect",
      onClick: onReconnect,
      variant: "primary",
      isLoading: isReconnecting
    });
  }

  if (onSignOut) {
    actions.push({
      label: "Sign Out",
      onClick: onSignOut,
      variant: "secondary"
    });
  }

  return (
    <ErrorMessage
      title="Authentication Error"
      message={error}
      severity="error"
      type="authentication"
      actions={actions}
      className={className}
    />
  );
};

/**
 * Validation error component
 */
interface ValidationErrorProps {
  errors: string[];
  title?: string;
  onFix?: () => void;
  className?: string;
}

export const ValidationError = ({
  errors,
  title = "Validation Error",
  onFix,
  className = ""
}: ValidationErrorProps) => {
  const message = errors.length === 1
    ? errors[0]
    : `Multiple issues found:\n${errors.map(error => `• ${error}`).join('\n')}`;

  const actions: ErrorAction[] = [];

  if (onFix) {
    actions.push({
      label: "Fix Issues",
      onClick: onFix,
      variant: "primary"
    });
  }

  return (
    <ErrorMessage
      title={title}
      message={message}
      severity="warning"
      type="validation"
      actions={actions}
      className={className}
    />
  );
};

/**
 * Info message component (not an error, but uses similar styling)
 */
interface InfoMessageProps {
  title?: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

export const InfoMessage = ({
  title,
  message,
  onAction,
  actionLabel = "OK",
  onDismiss,
  dismissible = false,
  className = ""
}: InfoMessageProps) => {
  const actions: ErrorAction[] = [];

  if (onAction) {
    actions.push({
      label: actionLabel,
      onClick: onAction,
      variant: "primary"
    });
  }

  return (
    <ErrorMessage
      title={title}
      message={message}
      severity="info"
      type="unknown"
      actions={actions}
      onDismiss={onDismiss}
      dismissible={dismissible}
      className={className}
    />
  );
};