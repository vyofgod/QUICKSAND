"use client";

import { useEffect } from "react";

export function ScrollToTop() {
  useEffect(() => {
    // Sayfa yüklendiğinde en üste scroll yap
    window.scrollTo(0, 0);
  }, []);

  return null;
}
