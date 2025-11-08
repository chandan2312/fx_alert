'use client'

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  alerts?: Array<{ price: number; type: string }>;
  onFullscreen?: () => void;
  darkMode?: boolean;
}

function TradingViewWidget({ symbol, alerts = [], onFullscreen, darkMode = false }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget completely to prevent memory leaks
    if (scriptRef.current) {
      container.current.innerHTML = '';
      scriptRef.current = null;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "60",
      timezone: "Asia/Kolkata",
      theme: darkMode ? "dark" : "light",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      calendar: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: true,
      hotlist: false,
      details: false,
      save_image: false,
      backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
      gridColor: darkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(46, 46, 46, 0.06)",
      withdateranges: false,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      studies: [],
      compareSymbols: [],
      watchlist: []
    });
    
    scriptRef.current = script;
    container.current.appendChild(script);

    return () => {
      // Cleanup: remove script and clear container
      if (container.current) {
        container.current.innerHTML = '';
      }
      scriptRef.current = null;
    };
  }, [symbol, darkMode]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
