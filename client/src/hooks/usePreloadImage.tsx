import { useEffect } from "react";

export const usePreloadImage = (src: string, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    link.type = "image/svg+xml";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [src, enabled]);
};