/**
 * useCropSearch — real-time debounced search over the crop master catalogue.
 *
 * Strategy:
 *  - Debounce 400ms after last keystroke before firing API request
 *  - Pagination: page 1 on new query, loadMore() appends subsequent pages
 *  - Stale-response guard: ignores API responses that arrive out of order
 *  - User's own pending crops (approved: false) are merged at the top when
 *    browsing (no search query), so the submitter can immediately use them
 *  - No result caching — search results are always fresh from API
 *
 * Returns:
 *   query          string             - controlled search input value
 *   setQuery       (string) => void   - update search term
 *   results        object[]           - current result list
 *   loading        boolean            - first-page load in progress
 *   loadingMore    boolean            - subsequent page load in progress
 *   hasMore        boolean            - more pages available
 *   loadMore       () => void         - trigger next page load
 *   refresh        () => void         - re-run current query from page 1
 *   reset          () => void         - clear query + results
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { searchCropMasterApi, getUserAddedCropsApi } from '../api/cropApi';
import { useAuth } from '../context/AuthContext';

const DEBOUNCE_MS = 400;
const PAGE_SIZE   = 20;

export function useCropSearch() {
  const { user } = useAuth();

  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [page,        setPage]        = useState(1);

  // User's own submitted (possibly pending) crops — shown in browse mode
  const [userPendingCrops, setUserPendingCrops] = useState([]);

  const debounceRef  = useRef(null);
  // Stale-response guard: stamp = query + ':' + page
  const activeSearch = useRef('');

  // Fetch user's pending crops once on mount (or user change)
  useEffect(() => {
    if (!user?.id) return;
    getUserAddedCropsApi(user.id)
      .then(crops => setUserPendingCrops(crops.filter(c => !c.approved)))
      .catch(() => {});
  }, [user?.id]);

  const doSearch = useCallback(async (q, p) => {
    const stamp = `${q}:${p}`;
    activeSearch.current = stamp;

    if (p === 1) {
      setLoading(true);
      setResults([]);
    } else {
      setLoadingMore(true);
    }

    const { items, hasMore: more } = await searchCropMasterApi({
      query: q,
      page:  p,
      limit: PAGE_SIZE,
    });

    // Discard stale responses (user already typed something new)
    if (activeSearch.current !== stamp) return;

    if (p === 1) {
      // In browse mode (no query) prepend user's own pending crops
      let merged = items;
      if (!q.trim() && userPendingCrops.length > 0) {
        // Avoid duplicates in case a pending crop was just approved
        const approvedIds = new Set(items.map(c => c.cropId || c._id));
        const pending = userPendingCrops
          .filter(c => !approvedIds.has(c.cropId || c._id))
          .map(c => ({ ...c, _isPending: true }));
        merged = [...pending, ...items];
      }
      setResults(merged);
      setLoading(false);
    } else {
      setResults(prev => [...prev, ...items]);
      setLoadingMore(false);
    }

    setHasMore(more);
    setPage(p);
  }, [userPendingCrops]);

  // Debounce: fire search 400ms after last keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, 1), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      doSearch(query, page + 1);
    }
  }, [loading, loadingMore, hasMore, query, page, doSearch]);

  const refresh = useCallback(() => {
    doSearch(query, 1);
  }, [query, doSearch]);

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    activeSearch.current = '';
    setQuery('');
    setResults([]);
    setPage(1);
    setHasMore(false);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    reset,
  };
}
