# Spring Boot Backend Setup Guide

## Project Structure

```
springboot-backend/
├── pom.xml                          # Maven configuration
├── src/
│   ├── main/
│   │   ├── java/com/investa/
│   │   │   ├── InvestaApplication.java      # Main Spring Boot app
│   │   │   ├── model/
│   │   │   │   └── Holding.java             # MongoDB document
│   │   │   ├── repository/
│   │   │   │   └── HoldingRepository.java   # Data access layer
│   │   │   ├── service/
│   │   │   │   └── HoldingService.java      # Business logic
│   │   │   ├── dto/
│   │   │   │   └── HoldingDTO.java          # API request/response
│   │   │   └── controller/
│   │   │       └── PortfolioController.java # REST endpoints
│   │   └── resources/
│   │       └── application.yml              # Configuration
│   └── test/                                # Test files
└── README.md
```

## Prerequisites

1. **Java 17 or higher**
   ```bash
   java -version
   ```

2. **Maven 3.8.1 or higher**
   ```bash
   mvn -version
   ```

3. **MongoDB**
   - See `Investment Research Agent/.kiro/MONGODB_SETUP.md` for installation

## Installation Steps

### 1. Clone/Navigate to Backend Directory

```bash
cd springboot-backend
```

### 2. Set Environment Variables

Create a `.env` file or export variables:

**On Windows (PowerShell):**
```powershell
$env:MONGODB_URI="mongodb://localhost:27017/investa"
$env:SERVER_PORT="8080"
```

**On Mac/Linux:**
```bash
export MONGODB_URI="mongodb://localhost:27017/investa"
export SERVER_PORT="8080"
```

**Or update `src/main/resources/application.yml`:**
```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/investa
```

### 3. Build the Project

```bash
mvn clean install
```

This will:
- Download dependencies
- Compile Java code
- Run tests
- Create JAR file in `target/`

### 4. Run the Application

```bash
# Option A: Using Maven
mvn spring-boot:run

# Option B: Using JAR file
java -jar target/investment-research-api-1.0.0.jar

# Option C: Using IDE (IntelliJ/Eclipse)
# Right-click InvestaApplication.java → Run 'InvestaApplication'
```

### 5. Verify Application is Running

```bash
# Should return 200 with health status
curl http://localhost:8080/api/portfolio/health
```

Expected response:
```json
{
  "message": "Portfolio API is running",
  "status": true
}
```

## API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Portfolio Endpoints

#### 1. Get All Holdings
```
GET /portfolio/holdings
Header: x-user-id: <userId>

Response:
[
  {
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
    "broker": "Zerodha",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-16T15:45:00"
  }
]
```

#### 2. Get Single Holding
```
GET /portfolio/holdings/:id
Header: x-user-id: <userId>

Response: HoldingDTO
```

#### 3. Create Holding
```
POST /portfolio/holdings
Header: x-user-id: <userId>
Content-Type: application/json

Body:
{
  "id": "h-xyz789",
  "symbol": "GOOGL",
  "name": "Google LLC",
  "quantity": 5,
  "avgPrice": 140.00,
  "currentPrice": 160.00,
  "purchaseDate": "2024-01-16",
  "broker": "Zerodha",
  "invested": 700.00,
  "currentValue": 800.00,
  "pnl": 100.00,
  "pnlPercent": 14.29
}

Response: HoldingDTO (with createdAt)
```

#### 4. Update Holding
```
PUT /portfolio/holdings/:id
Header: x-user-id: <userId>
Content-Type: application/json

Body: Partial<HoldingDTO>

Response: Updated HoldingDTO
```

#### 5. Delete Holding
```
DELETE /portfolio/holdings/:id
Header: x-user-id: <userId>

Response:
{
  "ok": true,
  "id": "h-abc123"
}
```

#### 6. Get Portfolio Statistics
```
GET /portfolio/stats
Header: x-user-id: <userId>

Response:
{
  "totalHoldings": 3,
  "totalInvested": 2500.00,
  "totalValue": 2950.00,
  "totalPnl": 450.00,
  "totalPnlPercent": 18.00,
  "topHolding": HoldingDTO
}
```

#### 7. Health Check
```
GET /portfolio/health

Response:
{
  "message": "Portfolio API is running",
  "status": true
}
```

## Integration with React Frontend

### Update API Client

Modify `Investment Research Agent/src/services/db/portfolio-db-mongodb.ts`:

```typescript
const API_BASE = "http://localhost:8080/api/portfolio"; // Update this
```

### Update Environment Variables

Create `Investment Research Agent/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
MONGODB_URI=mongodb://localhost:27017/investa
```

### Test Integration

1. Start MongoDB
2. Start Spring Boot backend
3. Start React frontend (`npm run dev`)
4. Try adding a holding in the app
5. Refresh page - holding should persist

## Development

### Hot Reload
Spring Boot DevTools enables automatic restart on code changes:

```bash
mvn spring-boot:run -Dspring-boot.run.fork=false
```

### Database Access
Access MongoDB directly:

```bash
mongosh

# Switch to database
use investa

# View holdings collection
db.holdings.find()

# View indexes
db.holdings.getIndexes()
```

### Logging
Check application logs in console for debugging:

```
[main] com.investa.InvestaApplication    : Starting InvestaApplication
[main] com.investa.InvestaApplication    : No active profile set, falling back to 1 default profile: "default"
[main] o.s.d.m.c.MongoMappingContext      : Initializing Spring Data MongoDB core
```

## Troubleshooting

### Build Errors

**"Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin"**
- Solution: Ensure Java 17+ is installed: `java -version`

**"Could not find a version that satisfies the requirement"**
- Solution: Clear Maven cache: `mvn clean install -U`

### Runtime Errors

**"Connection refused: no further information"**
- MongoDB not running
- Solution: Start MongoDB server

**"MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017"**
- MongoDB connection string is wrong
- Solution: Check MONGODB_URI in application.yml

**"404 Not Found when accessing /api/portfolio/holdings"**
- Backend not running or wrong port
- Solution: Check if running on http://localhost:8080/api/portfolio/health

### Data Issues

**Holdings not appearing in frontend**
1. Check MongoDB connection: `db.holdings.find()`
2. Check user ID matches in requests
3. Check backend logs for errors
4. Verify x-user-id header is being sent

## Production Deployment

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/investment-research-api-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Build and run:
```bash
docker build -t investa-api .
docker run -e MONGODB_URI=<mongodb-connection> -p 8080:8080 investa-api
```

### Using Heroku

```bash
heroku create investa-api
heroku config:set MONGODB_URI=<atlas-connection-string>
git push heroku main
```

## Performance Optimization

1. **Add Pagination**
   ```java
   @GetMapping("/holdings")
   public Page<HoldingDTO> getHoldings(Pageable pageable)
   ```

2. **Cache Results**
   ```java
   @Cacheable("holdings")
   public List<HoldingDTO> getUserHoldings(String userId)
   ```

3. **Database Indexing** - Already implemented:
   - userId, symbol compound index
   - userId, createdAt sorting index

## Security Considerations

1. **Authentication** - Add Spring Security
   ```java
   @Configuration
   @EnableWebSecurity
   public class SecurityConfig { ... }
   ```

2. **Input Validation** - Use @Valid annotations
3. **CORS** - Already configured for localhost
4. **Rate Limiting** - Consider using Resilience4j

## Next Steps

1. ✅ Set up MongoDB
2. ✅ Install Java 17 & Maven
3. ✅ Configure Spring Boot
4. ✅ Run backend: `mvn spring-boot:run`
5. ✅ Update frontend API client
6. ✅ Test integration
7. 🔄 Add authentication
8. 🔄 Add more features (watchlist, alerts, etc.)
9. 🔄 Deploy to production

Happy building! 🚀
