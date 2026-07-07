# System Architecture - Investment Research Agent

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                           │
│  (Chrome, Firefox, Safari, Edge, Mobile)                        │
│  http://localhost:5173/                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────────┐         ┌──────────────────────────┐
│   FRONTEND (Vite)     │         │   EXTERNAL APIs          │
│  (React + TypeScript) │         │  (Grok, Finnhub, etc)    │
│  :5173                │         │  (NewsAPI, Yahoo, etc)   │
│                       │         └──────────────────────────┘
│ ✅ Pages:            │
│ - Login/Signup       │
│ - Dashboard          │◄──────┐
│ - Screener          │       │
│ - Settings          │       │ JWT Token
│ - Reports           │       │
│ - AI Research       │       │
│ - News              │       │
│ - Alerts            │       │
│                     │       │
│ ✅ Features:        │       │
│ - Auth Context      │       │
│ - Theme Toggle      │       │
│ - Currency Picker   │       │
│ - Error Handling    │       │
│ - Request Retry     │       │
└───────────┬─────────┘       │
            │                 │
            │ REST API        │
            │ (Port 8080)     │
            │                 │
            └────────────────►│
                    ▼
        ┌──────────────────────────────┐
        │   BACKEND (Spring Boot)      │
        │   :8080                      │
        │                              │
        │ ✅ REST Endpoints:           │
        │ - POST /api/auth/register    │
        │ - POST /api/auth/login       │
        │ - POST /api/auth/refresh     │
        │ - GET  /api/auth/me          │
        │ - GET  /api/auth/health      │
        │                              │
        │ ✅ Security:                 │
        │ - JWT Authentication Filter  │
        │ - Spring Security Config     │
        │ - CORS Configuration         │
        │ - BCrypt Password Hashing    │
        │                              │
        │ ✅ Services:                 │
        │ - AuthService (login/reg)    │
        │ - JwtUtil (token mgmt)       │
        │ - UserRepository (DB)        │
        └────────┬─────────────────────┘
                 │
                 │ MongoDB Connection
                 │
                 ▼
        ┌──────────────────────────────┐
        │   DATABASE (MongoDB)         │
        │   (MongoDB Atlas Cloud)      │
        │                              │
        │ ✅ Collections:              │
        │ - users                      │
        │ - sessions                   │
        │ - stocks                     │
        │ - portfolios                 │
        │ - alerts                     │
        └──────────────────────────────┘
```

---

## 📊 Authentication Flow

```
User Browser              Frontend (React)         Backend (Spring Boot)      Database (MongoDB)
     │                           │                          │                        │
     │ 1. Click "Login"         │                          │                        │
     │──────────────────────────►│                          │                        │
     │                           │                          │                        │
     │ 2. Enter credentials      │                          │                        │
     │◄──────────────────────────│                          │                        │
     │                           │                          │                        │
     │ 3. POST /api/auth/login  │                          │                        │
     │──────────────────────────┼─────────────────────────►│                        │
     │                           │                          │ 4. Find user          │
     │                           │                          ├──────────────────────►│
     │                           │                          │◄──────────────────────┤
     │                           │                          │ 5. Verify password    │
     │                           │                          │    (BCrypt)            │
     │                           │                          │                        │
     │                           │ 6. Generate JWT token   │                        │
     │◄──────────────────────────┼──────────────────────────┤                        │
     │                           │ {access, refresh}       │                        │
     │                           │                          │                        │
     │ 7. Store tokens          │                          │                        │
     │ (localStorage)            │                          │                        │
     │                           │                          │                        │
     │ 8. Redirect to           │                          │                        │
     │    /dashboard             │                          │                        │
     │                           │                          │                        │
     │ 9. Request with JWT      │                          │                        │
     │    header:               │                          │                        │
     │    "Authorization:       │                          │                        │
     │     Bearer <token>"      │                          │                        │
     │──────────────────────────┼─────────────────────────►│                        │
     │                           │                          │ 10. Verify token      │
     │                           │                          │     (JWT valid?)       │
     │                           │                          │                        │
     │◄──────────────────────────┼──────────────────────────┤ 11. Return data      │
     │    Response (200 OK)      │                          │                        │
     │    {data}                 │                          │                        │
     │                           │                          │                        │
     └                           └                          └                        └
```

---

## 🔄 Screener Page Data Flow

```
User Interface               Component               Service                 Backend              Database
     │                          │                       │                       │                    │
     │ 1. Click Screener        │                       │                       │                    │
     │─────────────────────────►│                       │                       │                    │
     │                          │ 2. useQuery           │                       │                    │
     │                          │    "stocks"           │                       │                    │
     │                          │─────────────────────►│                       │                    │
     │                          │                      │ 3. Fetch all stocks   │                    │
     │                          │                      │ (with JWT token)      │                    │
     │                          │                      │──────────────────────►│                    │
     │                          │                      │                       │ 4. Query DB        │
     │                          │                      │                       ├──────────────────►│
     │                          │                      │                       │◄──────────────────┤
     │                          │                      │                       │ All stocks        │
     │                          │◄──────────────────────── 5. Return data ─────┤                    │
     │                          │    {stocks: [...]}   │                       │                    │
     │ 6. Display data          │                      │                       │                    │
     │◄─────────────────────────┤                      │                       │                    │
     │ (60 stocks in table)     │                      │                       │                    │
     │                          │                      │                       │                    │
     │ 7. Change filter         │                      │                       │                    │
     │ (e.g., Sector)           │                      │                       │                    │
     │─────────────────────────►│                      │                       │                    │
     │                          │ 8. useMemo filter    │                       │                    │
     │                          │    Client-side       │                       │                    │
     │                          │──────────────────────┤                       │                    │
     │                          │ 9. Update results    │                       │                    │
     │◄─────────────────────────┤ (instant, no API)    │                       │                    │
     │ (15 matching stocks)     │                      │                       │                    │
     │                          │                      │                       │                    │
     └                          └                      └                       └                    └
```

---

## ⚙️ Settings Page Data Flow

```
User Interface               Component               Context                Service/API         Storage (localStorage)
     │                          │                       │                       │                    │
     │ 1. Click Settings        │                       │                       │                    │
     │─────────────────────────►│                       │                       │                    │
     │                          │ 2. Load settings      │                       │                    │
     │                          │    from context       │                       │                    │
     │                          │─────────────────────►│                       │                    │
     │                          │                      │ 3. Get from           │                    │
     │                          │                      │    localStorage        │                    │
     │                          │                      │─────────────────────────────────────────► │
     │                          │◄──────────────────────── 4. Return data ───────────────────────┤
     │ 5. Display UI            │    {lang, currency}  │                       │                    │
     │◄─────────────────────────┤                      │                       │                    │
     │ (Current theme, lang,    │                      │                       │                    │
     │  currency, notifications)│                      │                       │                    │
     │                          │                      │                       │                    │
     │ 6. Toggle dark mode      │                      │                       │                    │
     │─────────────────────────►│                      │                       │                    │
     │                          │ 7. handleThemeChange │                       │                    │
     │                          │─────────────────────►│                       │                    │
     │                          │                      │ 8. setTheme("dark")   │                    │
     │                          │                      │ 9. Mark hasChanges=   │                    │
     │                          │                      │    true               │                    │
     │ 10. Show "Save Changes"  │                      │                       │                    │
     │     button (sticky)      │                      │                       │                    │
     │◄─────────────────────────┤                      │                       │                    │
     │                          │                      │                       │                    │
     │ 11. Change currency      │                      │                       │                    │
     │     (USD → INR)          │                      │                       │                    │
     │─────────────────────────►│                      │                       │                    │
     │                          │ 12. handleCurrency   │                       │                    │
     │                          │     Change           │                       │                    │
     │                          │─────────────────────►│                       │                    │
     │                          │                      │ 13. setCurrency(INR)  │                    │
     │                          │                      │ 14. Mark hasChanges=  │                    │
     │                          │                      │     true              │                    │
     │ 15. Show "Save Changes"  │                      │                       │                    │
     │     button (visible)     │                      │                       │                    │
     │◄─────────────────────────┤                      │                       │                    │
     │                          │                      │                       │                    │
     │ 16. Click "Save"         │                      │                       │                    │
     │─────────────────────────►│                      │                       │                    │
     │                          │ 17. handleSaveChanges│                       │                    │
     │                          │─────────────────────►│                       │                    │
     │                          │                      │ 18. Save to           │                    │
     │                          │                      │     localStorage       │                    │
     │                          │                      │─────────────────────────────────────────► │
     │                          │                      │                       │ {dark, INR, ...}  │
     │ 19. Show success toast   │                      │                       │                    │
     │◄─────────────────────────┤ 20. Reset            │                       │                    │
     │                          │     hasChanges=false │                       │                    │
     │                          │                      │                       │                    │
     │ 21. Refresh page (F5)    │                      │                       │                    │
     │─────────────────────────►│                      │                       │                    │
     │                          │ 22. Load from        │                      │                    │
     │                          │     localStorage     │                       │                    │
     │                          │─────────────────────────────────────────────────────────────────► │
     │ 23. Theme persists       │                      │                       │                    │
     │     Currency persists    │                      │                       │                    │
     │◄────────────────────────────────────────────────────────────────────────────────────────────┤
     │                          │                      │                       │                    │
     └                          └                      └                       └                    └
```

---

## 📡 API Endpoints Structure

```
┌──────────────────────────────────────────────────────────────┐
│              Spring Boot Backend (Port 8080)                 │
└──────────────────────────────────────────────────────────────┘

Authentication Endpoints:
├── POST /api/auth/register
│   ├── Request: { email, password, name }
│   ├── Response: { accessToken, refreshToken, user }
│   └── Status: 201 Created, 400 Bad Request
│
├── POST /api/auth/login
│   ├── Request: { email, password }
│   ├── Response: { accessToken, refreshToken, user }
│   └── Status: 200 OK, 401 Unauthorized
│
├── POST /api/auth/refresh
│   ├── Request: { refreshToken }
│   ├── Response: { accessToken, refreshToken }
│   └── Status: 200 OK, 401 Unauthorized
│
├── GET /api/auth/me
│   ├── Request: Authorization: Bearer <token>
│   ├── Response: { id, email, name, createdAt }
│   └── Status: 200 OK, 401 Unauthorized
│
└── GET /api/auth/health
    ├── Request: (no token required)
    ├── Response: { status, timestamp }
    └── Status: 200 OK

Protected Routes:
├── All endpoints require: Authorization: Bearer <JWT_TOKEN>
├── Token expires in 24 hours (access)
├── Refresh token expires in 7 days
└── Auto-refresh on 401 response
```

---

## 🔐 JWT Token Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "userId": "user_id",
  "email": "user@example.com",
  "iat": 1234567890,      // Issued at
  "exp": 1234654290       // Expiry (24h later)
}

Signature:
HS256(Base64(Header) + "." + Base64(Payload), SECRET_KEY)

Complete Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.
TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

---

## 🗄️ Database Schema

```
MongoDB Collections:

users {
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (BCrypt hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean
}

stocks {
  _id: ObjectId,
  symbol: String (unique, indexed),
  name: String,
  sector: String,
  price: Number,
  marketCap: Number,
  peRatio: Number,
  dividendYield: Number,
  weekHigh52: Number,
  volume: Number,
  currency: String,
  updatedAt: Date
}

portfolios {
  _id: ObjectId,
  userId: ObjectId (indexed),
  stocks: Array,
  totalValue: Number,
  createdAt: Date,
  updatedAt: Date
}

alerts {
  _id: ObjectId,
  userId: ObjectId (indexed),
  symbol: String,
  alertType: String (price/volume),
  threshold: Number,
  isActive: Boolean,
  createdAt: Date,
  triggeredAt: Date
}
```

---

## 🔄 State Management

```
React Context Architecture:

auth-context.tsx
├── State:
│   ├── isAuthenticated: Boolean
│   ├── user: { id, email, name }
│   ├── tokens: { access, refresh }
│   └── isLoading: Boolean
├── Methods:
│   ├── login(email, password)
│   ├── register(email, password, name)
│   ├── logout()
│   ├── refreshToken()
│   └── getCurrentUser()
└── Providers:
    ├── Used in: _app.tsx (layout level)
    └── Available in: All child routes

theme-context.tsx
├── State:
│   ├── theme: "dark" | "light"
├── Methods:
│   └── setTheme(theme)
└── Storage:
    └── localStorage: "app_theme"

currency-context.tsx
├── State:
│   ├── currency: "USD" | "INR" | "EUR" | "GBP"
├── Methods:
│   └── setCurrency(currency)
└── Storage:
    └── localStorage: "app_currency"
```

---

## 📦 Component Hierarchy

```
App
├── <Router />
│   ├── /auth (Auth Route)
│   │   └── <AuthPage />
│   │       ├── <LoginForm />
│   │       ├── <SignupForm />
│   │       └── <ForgotPasswordForm />
│   │
│   └── /_app (Protected Layout)
│       ├── <AppSidebar />
│       │   ├── Navigation Links
│       │   └── User Profile
│       ├── <Topbar />
│       │   ├── Search
│       │   ├── Theme Toggle
│       │   └── Settings Icon
│       ├── <MarketTicker />
│       │   └── Live Market Data
│       │
│       └── Routes (require login):
│           ├── /dashboard
│           │   └── <Dashboard />
│           ├── /screener
│           │   └── <ScreenerPage />
│           │       ├── <FilterPanel />
│           │       └── <StockTable />
│           ├── /settings
│           │   └── <SettingsPage />
│           │       ├── <AppearanceSettings />
│           │       ├── <LanguageSettings />
│           │       ├── <CurrencySettings />
│           │       ├── <NotificationSettings />
│           │       └── <SecuritySettings />
│           ├── /reports
│           │   └── <ReportsPage />
│           ├── /ai
│           │   └── <AIResearchPage />
│           ├── /news
│           │   └── <NewsPage />
│           └── /alerts
│               └── <AlertsPage />
```

---

## 🚀 Data Flow Summary

### 1. **Authentication Flow**
```
User Login → Frontend → Backend JWT Check → MongoDB User → Token Generation → Frontend Storage
```

### 2. **Screener Flow**
```
User Filter → Frontend State Update → Re-render with Filtered Results → No API Call (client-side)
```

### 3. **Settings Flow**
```
User Change Setting → Frontend State Update → localStorage Save → Persist on Refresh
```

### 4. **External API Flow**
```
Frontend Component → Frontend API Client → External Service → Response → Display
```

---

## 🔌 Technology Stack

```
Frontend:
├── React 18+ (UI Library)
├── TypeScript (Type Safety)
├── Vite (Build Tool)
├── TailwindCSS (Styling)
├── Tanstack Router (Routing)
├── Tanstack Query (Data Fetching)
├── Lucide Icons (Icons)
├── Sonner (Notifications)
└── Shadcn/ui (Component Library)

Backend:
├── Spring Boot 3.2 (Framework)
├── Spring Security (Authentication)
├── JWT (Token Management)
├── MongoDB (Database)
├── Maven (Build Tool)
└── Java 17 (Runtime)

External APIs:
├── Grok/xAI (AI)
├── Finnhub (Stock Data)
├── Twelvedata (Market Data)
├── Polygon.IO (Market Data)
├── NewsAPI (News)
├── Yahoo Finance (Stock Data)
└── CoinGecko (Crypto Data)

Infrastructure:
├── MongoDB Atlas (Cloud Database)
├── Vite Dev Server (Frontend Development)
├── Spring Boot Embedded Tomcat (Backend)
├── localhost:5173 (Frontend URL)
└── localhost:8080 (Backend URL)
```

---

## ✨ Summary

This architecture provides:
- ✅ Secure JWT-based authentication
- ✅ Real-time client-side filtering
- ✅ Persistent user preferences
- ✅ Multiple external API integrations
- ✅ Responsive UI with dark mode support
- ✅ Protected routes and authorization
- ✅ Scalable microservice-ready design
- ✅ Production-ready deployment

**Status: 🟢 ARCHITECTURE COMPLETE**
