"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or retrieve session ID
    let sessionId = localStorage.getItem("silaa_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("silaa_session_id", sessionId);
    }

    const referrer = document.referrer;

    // Call the backend to log the page view
    // Since this is the storefront and might not have a token, we might need a public endpoint
    // We added this to the dashboard router, which is protected? 
    // Let me check if the dashboard router is protected by token.
    fetch("https://erp-api.silacollective.in/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: referrer,
        session_id: sessionId,
      })
    }).catch(err => console.error("Failed to track traffic:", err));
    
  }, [pathname]);

  return null;
}
