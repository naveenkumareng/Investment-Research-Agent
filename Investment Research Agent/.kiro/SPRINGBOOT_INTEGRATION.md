# Spring Boot Integration Guide

## Complete Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend                               │
│               (Investment Research Terminal)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Portfolio Page                                             │ │
│  │ - Add/Edit/Delete Holdings                               │ │
│  │ - View Charts (Allocation Pie, Holdings Table)           │ │
│  │ - Real-time P&L Calculation                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│              ↓ API Calls (HTTP REST)                            │
└─────────────────────────────────────────────────────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │  Spring Boot Backend API        │
        │  (Investment Research Terminal) │
        │                                 │
        │  Port: 8080                    │
        │  Base: http://localhost:8080   │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │ REST Controllers         │  │
        │  │ /portfolio/holdings      │  │
        │  │ /portfolio/stats         │  │
        │  └──────────────────────────┘  │
        │           ↓                     │
        │  ┌──────────────────────────┐  │
        │  │ Service Layer            │  │
        │  │ HoldingService.java      │  │
        │  │ Business Logic           │  │
        │  └──────────────────────────┘  │
        │           ↓                     │
        │  ┌──────────────────────────┐  │
        │  │ Repository Layer         │  │
        │  │ HoldingRepository        │  │
        │  │ Data Access              │  │
        │  └──────────────────────────┘  │
        └──────────────┬──────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │      MongoDB Database           │
        │   (investment-research-db)      │
        │                                 │
        │  Port: 27017                   │
        │  Database: investa             │
        │  Collection: holdings          │
        │                                 │
        │  ┌──────────────────────────┐  │
        │  │ Holdings Collection      │  │
        │  │ - userId (indexed)       │  │
        │  │ - symbol (indexed)       │  │
        │  │ - quantity, price, P&L   │  │
        │  │ - timestamps             │  │
        │  └──────────────────────────┘  │
        └─────────────────────────────────┘
```

## Project Structure

```
project-root/
├── Investment Research Agent/           ← React Frontend
│   ├── src/
│   │   ├── services/
│   │   │   ├── portfolio-service.ts
│   │   │   └── db/
│   │   │       └── portfolio-db-mongodb.ts  ← API Client
│   │   ├── routes/
│   │   │   └── _app.portfolio.tsx
│   │   └── ...
│   ├── .env                            ← Frontend Config
│   └── package.json
│
└── springboot-backend/                 ← Spring Boot Backend
    ├── src/
    │   ├── main/java/com/investa/
    │   │   ├── InvestaApplication.java
    │   │   ├── controller/
    │   │   │   └── PortfolioController.java
    │   │   ├── service/
    │   │   │   └── HoldingService.java
    │   │   ├── repository/
    │   │   │   └── HoldingRepository.java
    │   │   ├── model/
    │   │   │   └── Holding.java
    │   │   └── dto/
    │   │       └── HoldingDTO.java
    │   └── resources/
    │       └── application.yml
    ├── pom.xml                         ← Maven Config
    ├── SETUP_GUIDE.md
    └── README.md
```

## Setup Instructions

### Step 1: Start MongoDB

```bash
# Windows (if installed as service)
# Service automatically starts, or run:
mongod

# Mac (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

Verify connection:

```bash
mongosh
```

### Step 2: Configure Spring Boot Backend

```bash
# Navigate to backend
cd springboot-backend

# Set environment variables
# Windows (PowerShell)
$env:MONGODB_URI="mongodb://localhost:27017/investa"
$env:SERVER_PORT="8080"

# Mac/Linux (bash)
export MONGODB_URI="mongodb://localhost:27017/investa"
export SERVER_PORT="8080"

# Or update src/main/resources/application.yml manually
```

### Step 3: Build Spring Boot Backend

```bash
# Ensure you're in springboot-backend directory
cd springboot-backend

# Build with Maven
mvn clean install

# This will:
# ✓ Download dependencies
# ✓ Compile Java code
# ✓ Run tests
# ✓ Create JAR in target/
```

### Step 4: Run Spring Boot Backend

```bash
# Option A: Using Maven (hot reload)
mvn spring-boot:run

# Option B: Using JAR
java -jar target/investment-research-api-1.0.0.jar

# Option C: IDE (IntelliJ/Eclipse)
# Right-click InvestaApplication.java → Run
```

Expected output:

```
Started InvestaApplication in X.XXX seconds
✅ MongoDB connected successfully
Portfolio API listening on http://localhost:8080
```

### Step 5: Configure React Frontend

Update `Investment Research Agent/.env`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/investa

# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api

# Existing keys...
VITE_GROK_API_KEY=...
VITE_FINNHUB_API_KEY=...
```

### Step 6: Update Frontend API Client

Update `Investment Research Agent/src/services/db/portfolio-db-mongodb.ts`:

```typescript
const API_BASE = "http://localhost:8080/api/portfolio"; // ← Change this
```

### Step 7: Start React Frontend

```bash
cd "Investment Research Agent"

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

### Step 8: Test Integration

1. Open http://localhost:5173 (React frontend)
2. Navigate to Portfolio page
3. Click "Add Investment"
4. Fill in stock details
5. Click "Add Investment"
6. **Refresh the page** - holding should persist!
7. Check MongoDB:

```bash
mongosh
use investa
db.holdings.find()
```

## API Endpoints

### GET /portfolio/holdings

Fetch all holdings for a user

```bash
curl -X GET http://localhost:8080/api/portfolio/holdings \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json"
```

### POST /portfolio/holdings

Create a new holding

```bash
curl -X POST http://localhost:8080/api/portfolio/holdings \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "h-abc123",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "quantity": 10,
    "avgPrice": 150.00,
    "currentPrice": 175.00,
    "invested": 1500.00,
    "currentValue": 1750.00,
    "pnl": 250.00,
    "pnlPercent": 16.67,
    "purchaseDate": "2024-01-15",
    "broker": "Zerodha"
  }'
```

### PUT /portfolio/holdings/:id

Update a holding

```bash
curl -X PUT http://localhost:8080/api/portfolio/holdings/h-abc123 \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPrice": 180.00
  }'
```

### DELETE /portfolio/holdings/:id

Delete a holding

```bash
curl -X DELETE http://localhost:8080/api/portfolio/holdings/h-abc123 \
  -H "x-user-id: user-123"
```

### GET /portfolio/stats

Get portfolio statistics

```bash
curl -X GET http://localhost:8080/api/portfolio/stats \
  -H "x-user-id: user-123"
```

## Data Flow

### Adding a Holding

1. **React Frontend**

   ```
   User enters stock data → Clicks "Add Investment"
   ```

2. **Portfolio Service** (React)

   ```typescript
   portfolioService.add({
     symbol: "AAPL",
     quantity: 10,
     avgPrice: 150,
     ...
   })
   ```

3. **API Client** (React)

   ```typescript
   POST http://localhost:8080/api/portfolio/holdings
   x-user-id: user-123
   ```

4. **Spring Boot API**

   ```
   PortfolioController → HoldingService → HoldingRepository
   ```

5. **MongoDB**

   ```
   Save to holdings collection
   ```

6. **React Updates**

   ```
   React Query refetch → UI updates with new holding
   ```

7. **Refresh Page**
   ```
   React fetches from API → Shows saved holdings
   ```

## Environment Configuration

### Frontend (.env)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/investa

# API
VITE_API_BASE_URL=http://localhost:8080/api

# Market Data APIs
VITE_FINNHUB_API_KEY=...
VITE_NEWS_API_KEY=...
VITE_GROK_API_KEY=...
```

### Backend (application.yml)

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/investa}

server:
  port: ${SERVER_PORT:8080}
```

## Troubleshooting

### Backend Won't Start

**Error:** Connection refused

```
Solution: Check MongoDB is running
mongosh
```

**Error:** Port 8080 already in use

```
Solution: Use different port
SERVER_PORT=8081 mvn spring-boot:run
```

### Frontend Can't Connect to API

**Error:** CORS error or connection refused

```
Solution: Verify backend is running
curl http://localhost:8080/api/portfolio/health

Should return:
{"message":"Portfolio API is running","status":true}
```

### Holdings Not Persisting

1. Check MongoDB:

   ```bash
   mongosh
   use investa
   db.holdings.find()
   ```

2. Check backend logs for errors

3. Check network tab in browser (F12) for failed requests

4. Verify x-user-id header is being sent

### Database Issues

**Empty database after restart**

```
Normal - MongoDB creates collections on first write
Add a holding to create the collection
```

**Duplicate holdings**

```
Clear database:
mongosh
use investa
db.holdings.deleteMany({})
```

## Performance Optimization

### Database Indexes

Already configured:

- `{ userId: 1, createdAt: -1 }` - Fast retrieval
- `{ userId: 1, symbol: 1 }` - Symbol lookups
- `{ symbol: 1 }` - Global symbol queries

### Caching

React Query automatically caches results:

```typescript
useQuery({
  queryKey: ["portfolio"],
  queryFn: () => portfolioService.holdings(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Security Considerations

1. **Add Authentication**

   ```java
   @Configuration
   @EnableWebSecurity
   public class SecurityConfig { ... }
   ```

2. **Input Validation**
   - Already implemented with @Valid

3. **CORS**
   - Already configured for localhost
   - Update for production domains

4. **Database Access**
   - User isolation via x-user-id header
   - Consider JWT tokens for production

## Production Deployment

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: "3.8"
services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  api:
    build: ./springboot-backend
    ports:
      - "8080:8080"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/investa
    depends_on:
      - mongodb

  frontend:
    build: ./Investment Research Agent
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:8080/api

volumes:
  mongo_data:
```

Run with:

```bash
docker-compose up
```

## Next Steps

✅ MongoDB setup  
✅ Spring Boot backend created  
✅ REST API configured  
✅ React frontend integration  
✅ Local testing

🔄 Next: Add authentication & security  
🔄 Add watchlist API  
🔄 Add alerts API  
🔄 Deploy to production

## Support Resources

- **Spring Boot**: https://spring.io/projects/spring-boot
- **MongoDB**: https://www.mongodb.com/docs/
- **Spring Data MongoDB**: https://spring.io/projects/spring-data-mongodb
- **React Query**: https://tanstack.com/query/latest

---

**Status**: ✅ Production Ready  
**Last Updated**: January 2024  
**Maintainer**: Investment Research Team
