import { useCallback, useEffect, useRef } from 'react';

const DOUBLE_TAP_MS = 260;

/**
 * Distinguishes single from double taps. The single-tap handler is delayed
 * slightly so a double tap doesn't also trigger it.
 */
export function useDoubleTap(onDouble: () => void, onSingle?: () => void) {
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      lastTap.current = 0;
      onDouble();
      return;
    }
    lastTap.current = now;
    if (onSingle) {
      timer.current = setTimeout(() => {
        timer.current = null;
        onSingle();
      }, DOUBLE_TAP_MS);
    }
  }, [onDouble, onSingle]);
}
