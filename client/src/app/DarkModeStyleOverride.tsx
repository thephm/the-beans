"use client";
import React from "react";

export default function DarkModeStyleOverride() {
  React.useEffect(() => {
    // Dynamically inject style only on client
    const style = document.createElement("style");
    style.innerHTML = `
      html.dark body, body.dark, html.dark body.dark {
        background-image: none !important;
        background-color: #030712 !important;
        color: #f3f4f6 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  return null;
}
