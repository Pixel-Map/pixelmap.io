import { useCallback, useEffect, useState } from 'react';

// The key and loader define request identity. Late responses from old routes or
// closed modals cannot overwrite the currently selected tile.
export default function useAssetData<T>(key: string | undefined, load: (key: string) => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(Boolean(key));
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    let active = true;
    setData(initial);
    setError('');
    setLoading(Boolean(key));
    if (key === undefined) return;
    async function request() {
      try {
        const result = await load(key!);
        if (active) setData(result);
      } catch {
        if (active) setError('Unable to load tile data. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void request();
    return () => { active = false; };
    // initial is a reset value, not request identity (callers may supply []).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load, attempt]);
  return { data, setData, loading, error, retry };
}
