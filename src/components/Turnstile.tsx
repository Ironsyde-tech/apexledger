import { useEffect, useRef, useCallback, useState } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

type TurnstileProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
};

// Declare Turnstile on window
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadScript() {
  if (scriptLoaded) {
    loadCallbacks.forEach((cb) => cb());
    loadCallbacks.length = 0;
    return;
  }
  if (scriptLoading) return;
  scriptLoading = true;

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
  script.async = true;
  script.defer = true;

  window.onTurnstileLoad = () => {
    scriptLoaded = true;
    loadCallbacks.forEach((cb) => cb());
    loadCallbacks.length = 0;
  };

  document.head.appendChild(script);
}

export function Turnstile({ onVerify, onExpire, theme = "auto" }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return;
    if (widgetId.current) {
      window.turnstile.remove(widgetId.current);
    }
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onVerify,
      "expired-callback": onExpire,
      theme,
      size: "flexible",
    });
  }, [onVerify, onExpire, theme]);

  useEffect(() => {
    if (!SITE_KEY) return; // No key = skip captcha (dev mode)

    if (scriptLoaded) {
      renderWidget();
    } else {
      loadCallbacks.push(renderWidget);
      loadScript();
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [renderWidget]);

  // If no site key, don't render anything (dev mode bypass)
  if (!SITE_KEY) return null;

  return (
    <div ref={containerRef} className="flex justify-center" />
  );
}

// Hook for easy integration
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const isEnabled = !!SITE_KEY;

  const handleVerify = useCallback((t: string) => {
    setToken(t);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
  }, []);

  return {
    token,
    isVerified: !isEnabled || !!token, // If no key configured, always verified
    isEnabled,
    handleVerify,
    handleExpire,
  };
}
