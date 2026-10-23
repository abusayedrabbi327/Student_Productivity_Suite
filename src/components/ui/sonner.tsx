"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  
  // Check if we're in mobile view and use the mobile portal container
  const mobileContainer = typeof document !== 'undefined' 
    ? document.getElementById('mobile-screen-container') 
    : null;

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        style: {
          maxWidth: mobileContainer ? '340px' : undefined,
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...(mobileContainer ? { richColors: true } : {})}
      {...props}
    />
  );
};

export { Toaster };