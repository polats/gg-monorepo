import { useEffect, useRef, ForwardedRef } from 'react';

/**
 * Hook to normalize a forwarded ref into a consistent ref object
 */
export function useForwardedRef<T>(forwardedRef: ForwardedRef<T>) {
  const innerRef = useRef<T>(null);

  useEffect(() => {
    if (!forwardedRef) return;
    if (typeof forwardedRef === 'function') {
      forwardedRef(innerRef.current);
    } else {
      forwardedRef.current = innerRef.current;
    }
  });

  return innerRef;
}
