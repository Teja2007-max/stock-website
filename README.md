# StockEdge — AI Stock Market Predictor

A full-stack stock market prediction web app with a modern dark trading UI inspired by Groww and Angel One.

## Tech Stack
- **Frontend**: React + Vite, Lightweight Charts, Lucide Icons
- **Backend**: Node.js + Express
- **Database**: MongoDB (via `mongodb-memory-server` for zero-config local dev)
- **Charts**: TradingView Lightweight Charts (candlestick + Bollinger Bands + predictions)
- **Data**: Yahoo Finance API (`yahoo-finance2`)
- **Auth**: JWT + bcrypt
## Features
- 🔐 Secure Auth (regi  ster/login, hashed passwords, JWT sessions)
- 📍 Location-aware market detection (India → NSE/BSE, US → NASDAQ, UK → LSE)
- 📈 Real-time stock data via Yahoo Finance
- 🕯️ Pro candlestick charts with Bollinger Bands overlay
- 🤖 AI signal generation (BUY/SELL/HOLD) using Linear Regression + RSI + BB
- 📊 5-day price forecast
- 🕐 Live market open/closed status by timezone
- 🕓 Search history stored per user
## Running Locally
### Backend
```bash
cd backend
npm start
```
### Frontend
```
bash
cd frontend
npm run dev
```

Open http://localhost:5173
