"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);

          // Listen for retry messages from service worker
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "RETRY_UPLOADS") {
              console.log("[SW] Retry uploads requested.");
              // Clients handle their own retry logic from queue state
            }
          });
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return null;
}
