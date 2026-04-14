import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { page } from '@/lib/analytics';

/**
 * Emits a `page_view` event on every route change.
 * Skips the initial null-path render to avoid double-counting.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    void page(location.pathname + location.search);
  }, [location.pathname, location.search]);
}
