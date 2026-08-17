import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const useHighlightFromQuery = (
  isReady: boolean,
  paramName: string = "highlight",
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const hasTriggeredRef = useRef(false);

  const highlightParam = searchParams.get(paramName);

  useEffect(() => {
    if (!highlightParam || !isReady || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const element = document.getElementById(`highlight-${highlightParam}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setHighlightedId(highlightParam);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(paramName);
    setSearchParams(nextParams, { replace: true });

    const timeout = setTimeout(() => setHighlightedId(null), 2200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightParam, isReady]);

  return highlightedId;
};