# 🚀 System Startup Checklist

Complete this checklist to ensure everything is running correctly.

---

## ✅ Pre-Startup Checks

### System Requirements
- [ ] Java 17+ installed: `java -version`
- [ ] Node.js 18+ installed: `node --version`
- [ ] npm/bun installed: `npm --version`
- [ ] MongoDB Atlas account active
- [ ] Internet connection available

### Configuration Files
- [ ] `.env` has MongoDB URI
- [ ] `.env` has API keys (Finnhub, Grok, NewsAPI)
- [ ] `springboot-backend/.env` exists
- [ ] No secrets hardcoded in code

### Dependencies
- [ ] Maven installed: `mvn -version`
- [ ] Node modules up to date: `npm install` (in Investment Research Agent)

---

## 🔧 Startup Sequence (Order Matters!)

### Step 1: Start Spring Boot Backend ⏱️ (2-3 minutes)

**Terminal 1:**
```bash
cd springboot-backend
mvn spring-boot:run
```

**Wait for:**
```
Starting Investment Research Terminal - API...
...
Tomcat started on port(s): 8080
```

**Verify:**
- [ ] No errors in output
- [ ] Port 8080 is listening
- [ ] MongoDB connection successful
- [ ] See: "Building JWT security" message

**Test:**
```bash
curl http://localhost:8080/api/auth/health
# Should return: "Auth service is running"
```

---

### Step 2: Start React Frontend ⏱️ (1-2 minutes)

**Terminal 2 (NEW):**
```bash
cd "Investment Research Agent"
npm run dev
```

**Wait for:**
```
VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
```

**Verify:**
- [ ] No build errors
- [ ] VITE compilation successful
- [ ] Port 5173 is listening

---

### Step 3: Open Browser ⏱️ (30 seconds)

**Browser:**
1. [ ] Navigate to `http://localhost:5173`
2. [ ] Check browser console (F12) for errors
3. [ ] Should NOT see:
   - [ ] Red error messages
   - [ ] CORS errors
   - [ ] Network failures

---

## 🧪 Functionality Tests

### Test 1: Registration
1. [ ] Click "Sign Up" or go to `/auth/register`
2. [ ] Fill form:
   - [ ] Name: Your Name
   - [ ] Email: test@example.com
   - [ ] Password: SecurePass123
   - [ ] Confirm: SecurePass123
3. [ ] Click Register
4. [ ] Should see success message
5. [ ] Should redirect to dashboard
6. [ ] User should appear in DevTools localStorage

**Expected:**
- [ ] No error messages
- [ ] Redirects to dashboard
- [ ] User data visible
- [ ] Sidebar shows user name

---

### Test 2: Login
1. [ ] Click Logout
2. [ ] Go to `/auth/login`
3. [ ] Enter credentials:
   - [ ] Email: test@example.com
   - [ ] Password: SecurePass123
4. [ ] Click Login
5. [ ] Should see success message
6. [ ] Should redirect to dashboard

**Expected:**
- [ ] No error messages
- [ ] Redirects to dashboard
- [ ] Same user data restored
- [ ] Tokens in localStorage

---

### Test 3: Portfolio Features
1. [ ] Click "Portfolio" in sidebar
2. [ ] Add a holding:
   - [ ] Stock: AAPL
   - [ ] Quantity: 10
   - [ ] Price: $150
3. [ ] Click "Add Holding"
4. [ ] Should see in table
5. [ ] Should see pie chart update
6. [ ] Refresh page (F5)
7. [ ] Holding should persist

**Expected:**
- [ ] Holding appears in table
- [ ] Chart updates
- [ ] Data persists after refresh
- [ ] Delete works

---

### Test 4: API Integration
1. [ ] Open DevTools (F12)
2. [ ] Go to Network tab
3. [ ] Click any page that loads data
4. [ ] Check request headers:
   - [ ] Should see `Authorization: Bearer <token>`
   - [ ] Should see `Content-Type: application/json`
5. [ ] Response should be:
   - [ ] Status: 200 OK
   - [ ] Data visible
   - [ ] No errors

**Expected:**
- [ ] All requests have token
- [ ] All responses successful
- [ ] No CORS errors
- [ ] No 401 Unauthorized

---

### Test 5: Token Refresh
1. [ ] In Console, get current token:
```javascript
localStorage.getItem('auth.token')
```

2. [ ] Wait 30 seconds
3. [ ] Make another API call (click page)
4. [ ] In DevTools Network tab:
   - [ ] Should show refresh endpoint called
   - [ ] Token should change (new token in response)
   - [ ] New token should be in localStorage

**Expected:**
- [ ] Token refresh works automatically
- [ ] No manual login required
- [ ] API calls continue working

---

### Test 6: Settings
1. [ ] Click "Settings" in sidebar
2. [ ] Try currency toggle (USD ↔ INR)
3. [ ] Refresh page
4. [ ] Currency should persist

**Expected:**
- [ ] Currency toggle works
- [ ] Settings save to localStorage
- [ ] Persists on refresh

---

## 🔍 Database Verification

### MongoDB Check
1. [ ] Go to MongoDB Atlas web console
2. [ ] Navigate to Database → Collections
3. [ ] Check "users" collection:
   - [ ] Should have your test user
   - [ ] Email should be there
   - [ ] Password should be hashed (starts with $2a$)
   - [ ] lastLogin should have timestamp

**Expected:**
```json
{
  "_id": ObjectId("..."),
  "email": "test@example.com",
  "name": "Your Name",
  "password": "$2a$12$...",
  "role": "USER",
  "active": true,
  "lastLogin": ISODate("..."),
  "createdAt": ISODate("...")
}
```

---

## 📊 Performance Verification

### Frontend Performance
1. [ ] DevTools → Performance tab
2. [ ] Refresh page (F5)
3. [ ] Check load time: **< 2 seconds**
4. [ ] Check bundle size: **~1MB**

### Backend Performance
1. [ ] DevTools → Network tab
2. [ ] Any API call should respond in **< 500ms**
3. [ ] No timeout errors

### Build Status
1. [ ] Frontend build: **npm run build**
   - [ ] Should complete in < 5 seconds
   - [ ] 0 errors
   - [ ] dist/ folder created
2. [ ] Backend build: **mvn clean package**
   - [ ] Should complete in < 15 seconds
   - [ ] BUILD SUCCESS
   - [ ] JAR created

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill process on 8080
kill -9 <PID>

# Or change port in application.yml
server:
  port: 8081
```

### Frontend build fails
```bash
cd "Investment Research Agent"
rm -rf node_modules dist
npm install
npm run dev
```

### MongoDB connection error
```bash
# Check .env file has correct URI
cat .env | grep MONGODB

# Should show:
# MONGODB_URI=mongodb+srv://investa2026:investor@2003@cluster0.mongodb.net/investa?retryWrites=true&w=majority
```

### CORS errors in DevTools
- Backend and frontend must be on correct ports
- Backend: http://localhost:8080
- Frontend: http://localhost:5173
- Check SecurityConfig.java for allowed origins

### Tokens not being injected
```javascript
// In DevTools Console:
console.log(localStorage.getItem('auth.token'))
// Should print JWT token (long string)

// If empty, login again:
// 1. Logout
// 2. Login
// 3. Check localStorage again
```

### Page refresh loses session
```javascript
// Check localStorage keys:
Object.keys(localStorage).filter(k => k.includes('auth'))
// Should show: auth.token, auth.refresh, auth.user, auth.user.id

// If empty after refresh, auth initialization failed
// Check browser console for errors
```

---

## 📋 Final Verification Checklist

System is ready when ALL of these pass:

- [ ] Backend runs without errors
- [ ] Frontend builds without errors
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Dashboard loads without errors
- [ ] Portfolio features work
- [ ] Holdings persist after refresh
- [ ] Currency selection works
- [ ] Settings persist after refresh
- [ ] All API requests have token in header
- [ ] No CORS errors
- [ ] No 401 Unauthorized errors
- [ ] MongoDB has user data
- [ ] Tokens auto-refresh
- [ ] Logout clears all data
- [ ] No console errors (F12)
- [ ] Build times acceptable
- [ ] Load times < 2 seconds

---

## 🎉 Success!

If ALL checks pass above:

✅ **System is fully operational**
✅ **Authentication working**
✅ **Database connected**
✅ **APIs functional**
✅ **Ready for production**

---

## 📝 Keeping Logs

Save logs for debugging:

```bash
# Backend log (Terminal 1)
# Redirect to file:
mvn spring-boot:run > backend.log 2>&1

# Frontend log (Terminal 2)
# Redirect to file:
npm run dev > frontend.log 2>&1
```

---

## 🚀 You're Ready!

Your Investment Research Terminal is now:
- Running locally on 2 ports
- Connected to MongoDB Atlas
- Using JWT authentication
- Fully functional

Proceed with:
1. Testing features
2. Creating test data
3. Deploying to production
4. Inviting users

Enjoy! 🎊

