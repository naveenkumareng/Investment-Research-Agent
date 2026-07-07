# MongoDB Integration Guide

## Overview

This application now uses MongoDB for persistent portfolio data storage. Holdings are automatically saved to MongoDB and persist across page refreshes and server restarts.

## Setup Instructions

### Option 1: Local MongoDB (Development)

#### On Windows

1. **Install MongoDB Community Edition**
   - Download from: https://www.mongodb.com/try/download/community
   - Run the installer and follow the setup wizard
   - Default installation path: `C:\Program Files\MongoDB\Server\7.0`

2. **Verify Installation**

   ```bash
   mongod --version
   ```

3. **Start MongoDB Server**

   ```bash
   # Option A: As Windows Service (starts automatically)
   # Already configured if you chose "Install as Service" during setup

   # Option B: Manual start
   mongod
   ```

4. **Test Connection**
   ```bash
   mongosh
   ```

#### On Mac/Linux

```bash
# Using Homebrew (Mac)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Using apt (Linux)
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

1. **Create Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Create" → Choose "Shared" (Free tier)
   - Select region (closest to your location)
   - Click "Create Cluster"

3. **Setup Network Access**
   - Go to "Security" → "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" for development
   - Add current IP for production

4. **Create Database User**
   - Go to "Security" → "Database Access"
   - Click "Add New Database User"
   - Set username and password
   - Give "atlasAdmin" role

5. **Get Connection String**
   - Go to Cluster → "Connect"
   - Choose "Drivers" → "Node.js"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/investa?retryWrites=true&w=majority`

### Configuration

#### Update .env file

```env
# For Local Development
MONGODB_URI=mongodb://localhost:27017/investa

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/investa?retryWrites=true&w=majority
```

## Architecture

### Database Structure

```
Database: investa
├── Collection: holdings
│   ├── userId (string) - User identifier
│   ├── id (string) - Unique holding ID
│   ├── symbol (string) - Stock ticker (uppercase, indexed)
│   ├── name (string) - Company name
│   ├── quantity (number) - Shares owned
│   ├── avgPrice (number) - Average purchase price
│   ├── purchaseDate (string) - Date of purchase
│   ├── broker (string) - Broker name
│   ├── currentPrice (number) - Current market price
│   ├── invested (number) - Total investment amount
│   ├── currentValue (number) - Current portfolio value
│   ├── pnl (number) - Profit/Loss amount
│   ├── pnlPercent (number) - P&L percentage
│   ├── createdAt (date) - Record creation time
│   └── updatedAt (date) - Record update time
```

### Indexes

- `{ userId: 1, symbol: 1 }` - Fetch user's holdings by symbol
- `{ userId: 1, createdAt: -1 }` - Fetch user's recent holdings

## API Endpoints

### GET /api/portfolio/holdings

Fetch all holdings for the user

```
Header: x-user-id: <userId>
Response: Holding[]
```

### POST /api/portfolio/holdings

Add a new holding

```
Header: x-user-id: <userId>
Body: Holding (without _id)
Response: Holding (with _id)
```

### PUT /api/portfolio/holdings/:id

Update a holding

```
Header: x-user-id: <userId>
Body: Partial<Holding>
Response: Holding
```

### DELETE /api/portfolio/holdings/:id

Remove a holding

```
Header: x-user-id: <userId>
Response: { ok: true, id }
```

## Features

✅ **Automatic Persistence** - Holdings are saved to MongoDB automatically
✅ **Fallback Support** - Falls back to localStorage if MongoDB is unavailable
✅ **Multi-user Support** - Separate data per user (via x-user-id header)
✅ **Data Integrity** - Validation and error handling
✅ **Performance** - Indexed queries for fast retrieval
✅ **Offline Support** - Works offline with localStorage sync

## Troubleshooting

### MongoDB Connection Issues

**Error: "connect ECONNREFUSED 127.0.0.1:27017"**

- MongoDB server is not running
- Solution: Start MongoDB server (`mongod` on Windows or `brew services start mongodb-community` on Mac)

**Error: "authentication failed"**

- Username/password is incorrect
- Solution: Check .env file has correct credentials

**Error: "Database 'investa' not found"**

- This is normal - MongoDB creates it automatically on first write
- Solution: Add a holding to trigger database creation

### Data Not Persisting

**Check MongoDB Status**

```bash
# Windows
mongosh

# Mac/Linux
mongo
```

**Verify Collections**

```javascript
use investa
db.holdings.find()
```

**Check Logs**

```bash
# Check application logs for errors
# Should see: "✅ MongoDB connected successfully"
```

## Migration from localStorage

The system automatically migrates data:

1. New holdings added → Saved to both MongoDB and localStorage
2. MongoDB unavailable → Falls back to localStorage automatically
3. MongoDB reconnected → Syncs with localStorage

No manual migration needed!

## Best Practices

1. **Backup your data regularly** - Use MongoDB Atlas automatic backups
2. **Monitor connection** - Check logs for connection issues
3. **Update credentials** - Change database password periodically
4. **Use Atlas for production** - More reliable than local MongoDB
5. **Enable IP whitelisting** - Restrict access to known IPs

## Performance Tips

- Holdings are cached in React Query
- Indexes ensure fast queries even with 1000+ holdings
- Pagination can be added if needed
- Consider archiving old holdings for better performance

## Next Steps

1. Install and start MongoDB
2. Update .env with correct connection string
3. Restart development server
4. Test by adding a holding
5. Refresh page - holding should persist

Happy investing! 📈
