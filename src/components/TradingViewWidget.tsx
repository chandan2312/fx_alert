'use client'

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  alerts?: Array<{ price: number; type: string }>;
  onFullscreen?: () => void;
  darkMode?: boolean;
  currentPrice?: number;
  interval?: string;
}

function TradingViewWidget({ symbol, alerts = [], onFullscreen, darkMode = false, currentPrice, interval = '60' }: TradingViewWidgetProps) {
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
      interval: interval,
      timezone: "Asia/Kolkata",
      theme: darkMode ? "dark" : "light",
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      calendar: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: true,
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
      watchlist: [],
      // Hide symbol name and OHLC values
      hide_symbol: true,
      hide_ohlc: true,
      // Show drawing toolbar on side
      enabled_features: ["side_toolbar_in_fullscreen_mode", "header_in_fullscreen_mode"],
      disabled_features: [
        "header_symbol_search", 
        "symbol_info", 
        "header_interval_dialog_button",
        "legend_widget",
        "compare_symbol",
        "border_around_the_chart"
      ]
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
    <div className="tradingview-widget-container h-full w-full relative" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
      <style jsx>{`
        /* Scale down TradingView toolbars - 30% smaller on desktop */
        .tradingview-widget-container :global(iframe) {
          transform: scale(0.7);
          transform-origin: top left;
          width: 142.86% !important;
          height: 142.86% !important;
        }
        
        /* Scale down TradingView toolbars - 50% smaller on mobile */
        @media (max-width: 768px) {
          .tradingview-widget-container :global(iframe) {
            transform: scale(0.5);
            transform-origin: top left;
            width: 200% !important;
            height: 200% !important;
          }
        }
        
        /* Override TradingView toolbar sizes */
        .tradingview-widget-container :global(.chart-controls-bar),
        .tradingview-widget-container :global(.chart-page),
        .tradingview-widget-container :global([class*="toolbar"]) {
          font-size: 11px !important;
        }
      `}</style>
    </div>
  );
}

export default memo(TradingViewWidget);
