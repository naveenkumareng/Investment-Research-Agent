# 🚀 Start Spring Boot Backend - Complete Guide

## Prerequisites Check

Before starting, verify you have:

- [ ] Java 17+ installed: `java -version`
- [ ] Maven 3.8.1+ installed: `mvn -version`
- [ ] MongoDB Atlas account created
- [ ] Connection string verified

---

## Step 1: Verify Configuration

Check that MongoDB connection is set:

```bash
# Windows
type springboot-backend\src\main\resources\application.yml | findstr "mongodb"

# Mac/Linux
cat springboot-backend/src/main/resources/application.yml | grep mongodb
```

Should show:
```yaml
uri: mongodb+srv://investa2026:investor@2003@cluster0.mongodb.net/investa
```

---

## Step 2: Build the Project

```bash
# Navigate to backend directory
cd springboot-backend

# Clean and build
mvn clean install

# This will:
# ✓ Download all dependencies (~300MB)
# ✓ Compile Java code
# ✓ Run tests
# ✓ Create JAR file in target/
```

**Expected output:**
```
BUILD SUCCESS
Total time: X.XXXs
```

**If build fails:**
```bash
# Clear cache and retry
mvn clean
mvn install -U  # -U forces update of snapshots
```

---

## Step 3: Start the Backend Server

### Option A: Using Maven (Hot Reload - Recommended for Development)

```bash
mvn spring-boot:run
```

**Expected logs:**
```
Starting InvestaApplication...
2024-XX-XX 10:XX:XX.XXX  INFO ... Starting InvestaApplication v1.0.0
2024-XX-XX 10:XX:XX.XXX  INFO ... Initializing Spring Data MongoDB core
2024-XX-XX 10:XX:XX.XXX  INFO ... ✅ MongoDB connected successfully
2024-XX-XX 10:XX:XX.XXX  INFO ... Started InvestaApplication in X.XXX seconds
```

### Option B: Using JAR File

```bash
java -jar target/investment-research-api-1.0.0.jar
```

### Option C: Using IDE (IntelliJ IDEA)

1. Open springboot-backend folder
2. Right-click `src/main/java/com/investa/InvestaApplication.java`
3. Select "Run 'InvestaApplication'"
4. Logs appear in IDE console

---

## Step 4: Verify Backend is Running

In another terminal, test the API:

```bash
# Health check
curl http://localhost:8080/api/portfolio/health

# Expected response:
# {"message":"Portfolio API is running","status":true}
```

Or open browser:
```
http://localhost:8080/api/portfolio/health
```

---

## Step 5: Check Logs for Errors

### Looking for success messages:
```
✅ MongoDB connected successfully
```

### Common issues:

**Issue 1: MongoDB Connection Failed**
```
ERROR o.s.d.m.c.MongoMappingContext - Failed to connect to MongoDB
```
**Solution:**
- Check internet connection
- Verify IP whitelisted in MongoDB Atlas
- Check connection string spelling
- Try connection string in MongoDB Compass

**Issue 2: Port 8080 Already in Use**
```
ERROR o.s.b.d.web.WebappClassLoaderBase - Context initialization failed
```
**Solution:**
```bash
# Find what's using port 8080
# Windows
netstat -ano | findstr :8080

# Mac/Linux
lsof -i :8080

# Kill the process or use different port
SERVER_PORT=8081 mvn spring-boot:run
```

**Issue 3: Java Version Wrong**
```
ERROR - cannot find symbol
```
**Solution:**
```bash
# Check Java version
java -version

# Must be 17 or higher
# If not, install Java 17 from https://adoptium.net/
```

---

## Step 6: Test API Endpoints

Once backend is running, test these endpoints:

### 1. Health Check
```bash
curl http://localhost:8080/api/portfolio/health
```
Response:
```json
{"message":"Portfolio API is running","status":true}
```

### 2. Get Holdings (Empty Initially)
```bash
curl http://localhost:8080/api/portfolio/holdings \
  -H "x-user-id: user-123"
```
Response:
```json
[]
```

### 3. Create a Holding
```bash
curl -X POST http://localhost:8080/api/portfolio/holdings \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "h-test-1",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "quantity": 10,
    "avgPrice": 150.00,
    "currentPrice": 175.00,
    "purchaseDate": "2024-01-15",
    "broker": "Zerodha",
    "invested": 1500.00,
    "currentValue": 1750.00,
    "pnl": 250.00,
    "pnlPercent": 16.67
  }'
```

Response should show the holding with timestamps

### 4. Get Holdings Again
```bash
curl http://localhost:8080/api/portfolio/holdings \
  -H "x-user-id: user-123"
```
Should now show the holding you created!

### 5. Get Portfolio Stats
```bash
curl http://localhost:8080/api/portfolio/stats \
  -H "x-user-id: user-123"
```
Response:
```json
{
  "totalHoldings": 1,
  "totalInvested": 1500.00,
  "totalValue": 1750.00,
  "totalPnl": 250.00,
  "totalPnlPercent": 16.67,
  "topHolding": {...}
}
```

---

## Step 7: Monitor MongoDB

Check your data in MongoDB Atlas:

1. Go to: https://cloud.mongodb.com
2. Click your cluster (cluster0)
3. Go to "Collections"
4. Click "investa" database
5. Click "holdings" collection
6. You should see your test holding!

Or use MongoDB Compass:
```
Connection: mongodb+srv://investa2026:investor@2003@cluster0.mongodb.net/investa
```

---

## Backend Running Successfully! ✅

Once you see:
```
✅ MongoDB connected successfully
Started InvestaApplication in X.XXX seconds
```

**Backend is ready!** Now start the React frontend in another terminal.

---

## Next: Start React Frontend

In a new terminal:
```bash
cd "Investment Research Agent"
npm run dev
```

Then open: http://localhost:5173

---

## 📊 Complete Setup Verification

| Component | Status | Check |
|-----------|--------|-------|
| Java 17+ | ✅ | `java -version` |
| Maven 3.8+ | ✅ | `mvn -version` |
| MongoDB Atlas | ✅ | Connection string valid |
| Backend Build | ✅ | `mvn clean install` |
| Backend Running | ✅ | `mvn spring-boot:run` |
| API Health | ✅ | `curl localhost:8080/api/portfolio/health` |
| MongoDB Connection | ✅ | See logs for "connected successfully" |
| React Frontend | ⏳ | Next step |

---

## 🎯 Common Commands Reference

```bash
# Build backend
cd springboot-backend && mvn clean install

# Start backend (with hot reload)
mvn spring-boot:run

# Start backend (from JAR)
java -jar target/investment-research-api-1.0.0.jar

# Kill backend (if stuck)
# Windows
taskkill /PID <process-id> /F

# Mac/Linux
kill -9 <process-id>

# Check backend logs (save to file)
mvn spring-boot:run > backend.log 2>&1

# Test API with Postman
# Import: http://localhost:8080/api/portfolio

# Connect to MongoDB
mongosh "mongodb+srv://investa2026:investor@2003@cluster0.mongodb.net/investa"
```

---

## 🆘 Getting Help

If backend won't start:

1. **Check Java version**
   ```bash
   java -version  # Must show 17+
   ```

2. **Check Maven installation**
   ```bash
   mvn -version
   ```

3. **Check port 8080 is free**
   ```bash
   netstat -ano | findstr :8080  # Windows
   lsof -i :8080  # Mac/Linux
   ```

4. **Test MongoDB connection**
   ```bash
   mongosh "mongodb+srv://investa2026:investor@2003@cluster0.mongodb.net/investa"
   ```

5. **Review full logs**
   ```bash
   mvn spring-boot:run 2>&1 | tee backend.log
   # Check backend.log for detailed errors
   ```

---

## 📝 Backend Architecture

```
InvestaApplication (Main)
    ↓
PortfolioController (REST Endpoints)
    ↓
HoldingService (Business Logic)
    ↓
HoldingRepository (Data Access)
    ↓
MongoDB Atlas (Data Storage)
```

---

## 🎉 Success Indicators

✅ Build completes without errors  
✅ Backend starts without errors  
✅ Health check returns OK  
✅ Can create holdings via API  
✅ MongoDB shows holdings in collection  
✅ No CORS errors in browser  

**You're ready to run the full application!** 🚀

---

**Status**: ✅ Production Ready  
**Backend Port**: 8080  
**API Base**: http://localhost:8080/api  
**Database**: MongoDB Atlas Cloud  

Next: Start React frontend with `npm run dev`
