import { useEffect } from "react";

export const usePreloadImage = (src: string) => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    link.type = "image/svg+xml";
    document.head.appendChild(link);
  }, [src]);
};
