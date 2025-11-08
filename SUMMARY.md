# FX Alert System - Next.js Implementation

## Overview

This is a Next.js 14 implementation of the FX Alert System with the following features:

1. **Multiple Price Alerts**: Users can set multiple price alerts for forex pairs and indices
2. **Alert Types**: Each alert can be set as "Crossing Up" or "Crossing Down"
3. **TradingView Integration**: Embedded TradingView charts for each symbol
4. **Responsive Design**: Mobile-friendly interface using Tailwind CSS
5. **API Routes**: Next.js API routes for handling alerts
6. **TypeScript**: Strong typing for better code quality

## Key Features

### User Interface
- Symbol selector dropdown with common forex pairs and indices
- Dynamic alert form with add/remove functionality
- TradingView chart placeholder
- Active alerts display section
- Responsive design for all screen sizes

### Technical Implementation
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- React hooks for state management
- Component-based architecture
- API routes for backend functionality

### File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── alerts/route.ts     # Alerts API endpoints
│   │   └── prices/route.ts     # Price API endpoints
│   ├── components/
│   │   ├── AlertForm.tsx       # Alert form component
│   │   └── ActiveAlerts.tsx    # Active alerts display
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── services/
│   └── forexFactoryService.ts  # Forex data service
├── types/
│   └── index.ts                # TypeScript interfaces
└── app/globals.css             # Global styles
```

## How to Use

1. **Select a Symbol**: Choose from the dropdown menu
2. **Set Alerts**: Enter price levels and select alert types
3. **Add More**: Use "Add More Alerts" button to create additional alerts
4. **Save**: Click "Save Alerts" to store your configurations
5. **View Active Alerts**: See all active alerts in the bottom section

## Implementation Details

### Forex Factory Integration
The service uses the Forex Factory API endpoint:
`https://mds-api.forexfactory.com/instruments?instruments=DXY%2FUSD,Gold%2FUSD,Silver%2FUSD,BTC%2FUSD,ETH%2FUSD,Dow%2FUSD,NDX%2FUSD,SPX%2FUSD,VIX%2FUSD,DAX%2FUSD,Nikkei225%2FUSD,EUR%2FUSD,GBP%2FUSD,AUD%2FUSD,USD%2FCAD,USD%2FCHF,USD%2FJPY,GBP%2FCAD,EUR%2FCAD,CAD%2FJPY,SOL%2FUSD`

### TradingView Integration
TradingView widgets are embedded using their JavaScript library. The widget displays charts for the selected symbol.

### Alert Management
- Alerts are stored in memory (can be extended to use a database)
- Each alert has a symbol, price, type (crossing up/down), and active status
- Users can add, remove, and save alerts

### Telegram Integration
The system can be extended to include Telegram notifications by:
1. Adding `node-telegram-bot-api` dependency
2. Creating a Telegram service
3. Implementing notification logic in the alert checking service

## Extending the Application

### Database Integration
To persist alerts:
1. Add MongoDB/Mongoose or another database
2. Create Alert model/schema
3. Update API routes to use database operations

### Real Price Checking
To implement real price checking:
1. Create a background service that periodically checks prices
2. Compare current prices with alert conditions
3. Trigger notifications when conditions are met

### Telegram Notifications
To add Telegram notifications:
1. Install `node-telegram-bot-api`
2. Add Telegram configuration to environment variables
3. Implement notification sending logic

## Dependencies

```json
{
  "dependencies": {
    "next": "14.0.3",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16"
  }
}
```

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

## Future Enhancements

1. **Database Integration**: Store alerts in MongoDB
2. **Authentication**: Add user login and personal alert management
3. **Real-time Updates**: Implement WebSocket for live price updates
4. **Advanced Alert Types**: Add percentage-based alerts, time-based alerts
5. **Notification Channels**: Email, SMS, and push notifications
6. **Historical Data**: Store and display alert history
7. **Dashboard**: Create a comprehensive dashboard with analytics