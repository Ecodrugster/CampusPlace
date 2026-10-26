import { useEffect, useRef } from 'react';

/**
 * Calls onLoadMore when the sentinel element enters the viewport.
 * rootMargin preloads a bit before the user hits the bottom.
 */
export default function useInfiniteScroll(onLoadMore, { enabled = true, rootMargin = '320px' } = {}) {
  const sentinelRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const enabledRef = useRef(enabled);

  onLoadMoreRef.current = onLoadMore;
  enabledRef.current = enabled;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && enabledRef.current) {
          onLoadMoreRef.current?.();
        }
      },
      { root: null, rootMargin, threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, enabled]);

  return sentinelRef;
}
