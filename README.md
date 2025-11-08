# FX Alert System - Next.js Version

A modern web application for setting price alerts on forex pairs and indices with TradingView chart integration.

## Features

- Set multiple price alerts for forex pairs and indices
- Add/remove alert fields dynamically
- TradingView chart widget for each symbol
- Alerts stored in memory (can be extended to use MongoDB)
- Real-time price data from Forex Factory API

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Axios for API requests

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/             # API routes
│   ├── components/      # React components
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── services/            # Business logic
└── types/               # TypeScript types
```

## API Endpoints

- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts` - Update existing alert
- `DELETE /api/alerts?id={id}` - Delete alert

## Supported Symbols

- EUR/USD
- GBP/USD
- USD/JPY
- AUD/USD
- USD/CAD
- Gold (XAU/USD)
- Silver (XAG/USD)

## Extending the Application

To add database persistence:
1. Install MongoDB and Mongoose
2. Create a database connection
3. Replace the in-memory alerts with database operations

To add Telegram notifications:
1. Install `node-telegram-bot-api`
2. Add Telegram bot configuration
3. Implement notification logic in the alert checking service