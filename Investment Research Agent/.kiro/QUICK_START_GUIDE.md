# 🚀 Investment Research Agent - Complete Quick Start Guide

## 📋 Current Status

✅ **Backend**: Spring Boot authentication system fully implemented and working  
✅ **Frontend**: Glassmorphic UI with all pages functional  
✅ **Database**: MongoDB connected and running  
✅ **API Keys**: All configured in `.env` file  
✅ **Build Status**: Zero errors, both frontend and backend compile successfully

---

## ⚡ Start Everything in 3 Easy Steps

### Step 1: Start Backend (Terminal 1)

```bash
cd springboot-backend
mvn spring-boot:run
```

**Wait for this message:**
```
Tomcat started on port(s): 8080
Started InvestaApplication in X.XXX seconds
```

### Step 2: Start Frontend (Terminal 2 - NEW TERMINAL)

```bash
cd "Investment Research Agent"
npm run dev
```

**Wait for this message:**
```
VITE v5.0.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Step 3: Open Browser & Login

1. **Go to**: `http://localhost:5173/`
2. **Login with demo credentials:**
   - Email: `demo@investa.io`
   - Password: `demo1234`

**Or create new account:**
- Click "Sign up"
- Fill in details
- Click "Create Account"

---

## ✅ Verify Everything Works

### After Login, You Should See:

- ✅ Dashboard with market overview
- ✅ Sidebar menu on left with navigation items
- ✅ "Screener" link in sidebar
- ✅ Settings icon (⚙️) in topbar

### Test Screener Page

1. Click **"Screener"** in sidebar (or visit `/screener`)
2. Should see:
   - Left panel with filters
   - Right panel with stock table
   - Columns: Symbol, Price, %, M-Cap, P/E, Div %, Volume
   - Results counter showing number of stocks

3. Try filters:
   - Change "Sector" dropdown
   - Enter price range (Min/Max)
   - Adjust other filters
   - See results update in real-time

### Test Settings Page

1. Click **Settings icon** (⚙️) in topbar (or visit `/settings`)
2. Should see sections:
   - Appearance (Dark/Light mode)
   - Language (5 language options)
   - Currency (USD, INR, EUR, GBP)
   - Notifications (Email, Push, Alerts)
   - Security (Password, 2FA)

3. Try changing:
   - Toggle dark/light mode
   - Select different currency
   - Toggle notification checkboxes
   - Click "Save Changes" button
   - See success toast notification

---

## 📊 API Keys Status

All API keys are **properly configured** in `.env`:

| Service | Key | Status |
|---------|-----|--------|
| **Grok/xAI** | VITE_GROK_API_KEY | ✅ Configured |
| **Finnhub** | VITE_FINNHUB_API_KEY | ✅ Configured |
| **Twelvedata** | VITE_TWELVEDATA_API_KEY | ✅ Configured |
| **Polygon.IO** | VITE_POLYGON_API_KEY | ✅ Configured |
| **NewsAPI** | VITE_NEWS_API_KEY | ✅ Configured |

**Note:** If API calls aren't working after starting the server, restart the frontend dev server (it will reload `.env` file):

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 🔍 Troubleshooting

### Issue: Stuck on "Loading terminal…"

**Cause:** Not logged in or authentication failed

**Solution:**
```bash
1. Check URL is http://localhost:5173/auth
2. Enter credentials: demo@investa.io / demo1234
3. If error, check backend is running (Terminal 1)
4. Check browser console (F12) for error messages
```

### Issue: Pages load but show empty/blank

**Cause:** Data not loaded yet or cache issue

**Solution:**
```bash
# Option 1: Hard refresh browser
Ctrl+Shift+R (Windows)
Cmd+Shift+R (Mac)

# Option 2: Clear browser cache
Press F12 → Application → Clear Site Data

# Option 3: Restart frontend dev server
Ctrl+C (in frontend terminal)
npm run dev
```

### Issue: Filters not working in Screener

**Cause:** Page not fully rendered

**Solution:**
```bash
1. Wait 2-3 seconds for page to load
2. Try entering a value in one filter
3. Check browser console (F12) for errors
4. Refresh page (F5) and try again
```

### Issue: Settings not saving

**Cause:** "Save Changes" button not clicked

**Solution:**
```bash
1. Make a change (e.g., toggle dark mode)
2. "Save Changes" button should appear at bottom
3. Click the button
4. Wait for success toast
5. Refresh page (F5) to verify persistence
```

### Issue: API keys not working

**Cause:** Dev server didn't load `.env` file

**Solution:**
```bash
# Restart frontend dev server:
1. Stop: Ctrl+C (in frontend terminal)
2. Restart: npm run dev
3. Try API calls again

# Verify keys loaded:
1. Open browser console (F12)
2. Type: console.log(import.meta.env.VITE_GROK_API_KEY)
3. Should show your API key (first 20 chars)
```

---

## 📁 Project Structure

```
Investment Research Agent/
├── src/
│   ├── routes/
│   │   ├── auth.tsx              ← Login/Signup/Forgot Password
│   │   ├── _app.tsx              ← Main layout (requires auth)
│   │   ├── _app.dashboard.tsx    ← Dashboard page
│   │   ├── _app.screener.tsx     ← Screener page ✅
│   │   ├── _app.settings.tsx     ← Settings page ✅
│   │   ├── _app.reports.tsx      ← Reports page
│   │   ├── _app.ai.tsx           ← AI Research page
│   │   ├── _app.news.tsx         ← News page
│   │   └── _app.alerts.tsx       ← Alerts page
│   ├── context/
│   │   ├── auth-context.tsx      ← Authentication state
│   │   ├── theme-context.tsx     ← Dark/Light mode
│   │   └── currency-context.tsx  ← Currency selection
│   ├── services/
│   │   ├── auth-service.ts       ← Login/Register calls
│   │   └── stocks-service.ts     ← Stock data
│   └── lib/
│       ├── api-client.ts         ← HTTP client with auto-refresh
│       └── external-apis.ts      ← External API clients
├── .env                          ← API keys (all configured ✅)
└── package.json
```

---

## 🎯 What's Implemented

### ✅ Authentication System
- JWT-based authentication
- Login/Register/Logout functionality
- Automatic token refresh (24h access, 7d refresh)
- Password hashing with BCrypt
- User profile management

### ✅ Frontend Pages
- **Login/Signup** - Glassmorphic design with animations
- **Dashboard** - Market overview and stats
- **Screener** - Stock filtering with 7 filters
- **Settings** - Theme, language, currency, notifications
- **Reports** - Portfolio analysis
- **AI Research** - AI-powered insights
- **News** - Market news with categories
- **Alerts** - Price/volume alerts

### ✅ API Integration
- Grok/xAI for AI research
- Finnhub for stock data
- Twelvedata for market data
- Polygon.IO for market data
- NewsAPI for news articles

---

## 🚀 Next Steps

### To run the full application:

```bash
# Terminal 1: Backend
cd springboot-backend
mvn spring-boot:run

# Terminal 2: Frontend
cd "Investment Research Agent"
npm run dev

# Then:
# 1. Open http://localhost:5173/
# 2. Login with demo@investa.io / demo1234
# 3. Explore all pages
# 4. Test Screener with filters
# 5. Try Settings and save changes
# 6. Verify API keys work in Network tab (F12)
```

### Build & Production Deployment:

```bash
# Frontend build
cd "Investment Research Agent"
npm run build

# Backend build
cd springboot-backend
mvn clean package

# Then deploy as needed
```

---

## 💡 Tips

- **Dark Mode**: Works instantly, persists across sessions
- **Currency**: Changes display globally, affects all prices
- **Language**: 5 options available (English, Hindi, Spanish, German)
- **Notifications**: Preferences saved to localStorage
- **Screener Filters**: All working, combine multiple filters
- **API Keys**: Auto-reload on dev server restart

---

## 📞 Need Help?

If something's not working:

1. **Check browser console**: Press `F12` → Console tab
2. **Check terminal logs**: Look for red error messages
3. **Verify both servers running**: Backend on :8080, Frontend on :5173
4. **Hard refresh browser**: `Ctrl+Shift+R`
5. **Restart dev server**: `Ctrl+C` then `npm run dev`
6. **Clear browser cache**: `F12` → Application → Clear Site Data

---

**Status: ✅ READY TO USE**

Everything is implemented and working. Just start the servers, login, and explore!
