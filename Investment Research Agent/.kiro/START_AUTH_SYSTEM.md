# 🚀 Quick Start: Real Authentication System

## Prerequisites
- Java 17+ installed
- Node.js 18+ installed
- MongoDB Atlas connected (already configured)

---

## 🎯 Step 1: Start the Spring Boot Backend (5 minutes)

### Option A: Using Maven
```bash
cd springboot-backend
mvn spring-boot:run
```

### Option B: Using Built JAR
```bash
cd springboot-backend
java -jar target/investment-research-api-1.0.0.jar
```

**Expected output:**
```
Starting Investment Research Terminal - API...
...
Tomcat started on port(s): 8080
```

✅ Backend ready at: `http://localhost:8080/api`

---

## 🎯 Step 2: Start the React Frontend (2 minutes)

**In a NEW terminal:**

```bash
cd "Investment Research Agent"
npm run dev
```

**Expected output:**
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
```

✅ Frontend ready at: `http://localhost:5173`

---

## 🎯 Step 3: Test the Authentication

### Open Browser
Navigate to: `http://localhost:5173/auth/register`

### Register New Account
Fill in the form:
- **Name:** John Doe
- **Email:** john@example.com
- **Password:** SecurePassword123
- **Confirm:** SecurePassword123

Click **Register**

### Expected Results
1. ✅ Account created in MongoDB
2. ✅ Auto-logged in
3. ✅ Tokens stored in localStorage
4. ✅ Redirected to dashboard
5. ✅ User profile visible

### Verify in Browser DevTools (F12)
**Application → Local Storage:**
```
auth.token      → JWT token (long string)
auth.refresh    → Refresh token
auth.user       → {"id":"...", "name":"John Doe", ...}
auth.user.id    → User MongoDB ID
```

**Network Tab:**
- All requests show `Authorization: Bearer <token>` header
- `/api/auth/register` returns 201 Created
- `/api/auth/me` returns user data

---

## 🧪 Quick Tests

### Test 1: Login with Existing Account
1. Click **Logout**
2. Go to `http://localhost:5173/auth/login`
3. Enter: john@example.com / SecurePassword123
4. Click **Login**
5. ✅ Should redirect to dashboard

### Test 2: Wrong Password
1. Go to `http://localhost:5173/auth/login`
2. Enter: john@example.com / WrongPassword
3. Click **Login**
4. ✅ Should show "Invalid email or password" error

### Test 3: API Request with Token
Open DevTools Console:
```javascript
// Check token is present
console.log(localStorage.getItem('auth.token'));

// Test API request
fetch('http://localhost:8080/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth.token')}`,
    'X-User-Id': localStorage.getItem('auth.user.id')
  }
})
.then(r => r.json())
.then(data => console.log('User data:', data))
```

### Test 4: Portfolio Persistence
1. Add a holding (e.g., AAPL 10 shares)
2. Refresh page (F5)
3. ✅ Holdings should still be there
4. ✅ Charts should display

---

## 🔍 Backend Verification

### Check MongoDB Users
```javascript
// In MongoDB Atlas → Collections → users
db.users.find({})

// Returns documents like:
{
  "_id": ObjectId("..."),
  "email": "john@example.com",
  "name": "John Doe",
  "password": "$2a$12$...",  // BCrypt hash
  "role": "USER",
  "active": true,
  "lastLogin": ISODate("2026-07-05T15:35:00Z"),
  "createdAt": ISODate("2026-07-05T15:30:00Z"),
  "updatedAt": ISODate("2026-07-05T15:35:00Z")
}
```

### Check Backend Logs
When you login/register, you should see:
```
INFO: Login attempt for email: john@example.com
INFO: User logged in successfully: john@example.com
DEBUG: JWT token valid for user: john@example.com
```

---

## 📊 Architecture Verification Checklist

- [ ] Spring Boot started on port 8080
- [ ] React frontend started on port 5173
- [ ] MongoDB connection working (no errors in logs)
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Tokens appear in localStorage
- [ ] Tokens injected in API requests
- [ ] User data syncs to MongoDB
- [ ] Portfolio data persists after refresh
- [ ] Logout clears tokens

---

## 🆘 Troubleshooting

### Backend won't start: "Address already in use :8080"
```bash
# Kill process on port 8080
# Windows: lsof -ti:8080 | xargs kill -9
# Mac/Linux: lsof -ti:8080 | xargs kill -9

# Or change port in application.yml:
server:
  port: 8081
```

### Frontend build errors
```bash
cd "Investment Research Agent"
rm -rf node_modules
npm install
npm run dev
```

### MongoDB connection failed
Check .env file:
```
MONGODB_URI=mongodb+srv://investa2026:investor@2003@cluster0.mongodb.net/investa?retryWrites=true&w=majority
```

### Tokens not saving to localStorage
1. Open DevTools → Application
2. Check if localStorage is enabled
3. Check browser settings for "Block all cookies"

### Can't login after registration
1. Check MongoDB for the user:
   ```javascript
   db.users.findOne({email: "john@example.com"})
   ```
2. Check password is hashed (not plain text)
3. Check user.active = true

---

## 📚 What's Running

| Service | URL | Purpose |
|---------|-----|---------|
| React Frontend | http://localhost:5173 | Web interface |
| Spring Boot API | http://localhost:8080/api | REST endpoints |
| MongoDB Atlas | mongodb+srv://cluster0.mongodb.net | User data storage |

---

## ✅ Complete!

Your authentication system is now:
- ✅ Fully integrated
- ✅ Connected to real backend
- ✅ Storing users in MongoDB
- ✅ Managing JWT tokens
- ✅ Handling login/register/refresh
- ✅ Auto-injecting tokens on API calls

**Next steps:**
1. Test the auth flow
2. Create multiple user accounts
3. Test portfolio features with real accounts
4. Proceed to other features (password reset, email verification, etc.)

Enjoy! 🎉

