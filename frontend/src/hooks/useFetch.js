import { useState, useEffect, useCallback, useRef } from 'react';

export const useFetch = (fetchFunction, params = null, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (currentParams) => {
    // Annuler la requête précédente si elle est en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = currentParams
        ? await fetchFunction(currentParams, { signal: controller.signal })
        : await fetchFunction({ signal: controller.signal });
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  const refetch = useCallback(() => {
    execute(params);
  }, [execute, params]);

  useEffect(() => {
    execute(params);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  return { data, loading, error, refetch };
};