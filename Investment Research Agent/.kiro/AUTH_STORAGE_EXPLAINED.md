# 🔐 Authentication & Credential Storage - Complete Explanation

## Question: "Where are username and password stored?"

### Quick Answer
- **Username/Password**: NOT stored locally (only transmitted during login)
- **Session Token**: Stored in `localStorage` with key `auth.token`
- **Refresh Token**: Stored in `localStorage` with key `auth.refresh`
- **User Data**: Stored in `localStorage` with key `auth.user` (cached)

---

## 📊 Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Login Flow                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. User enters email + password                         │
│    ↓                                                     │
│ 2. Sends to backend (authService.login)                 │
│    ↓                                                     │
│ 3. Backend validates credentials                        │
│    (password NEVER stored locally)                      │
│    ↓                                                     │
│ 4. Backend returns JWT token + refreshToken            │
│    ↓                                                     │
│ 5. Frontend stores tokens in localStorage              │
│    - auth.token = JWT token                            │
│    - auth.refresh = Refresh token                      │
│    - auth.user = User data (JSON)                      │
│    ↓                                                     │
│ 6. On every API request, token auto-injected           │
│    Authorization: Bearer <token>                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Storage Details by Location

### 1. **Session Tokens** (localStorage)
**File**: `src/lib/api-client.ts`

```typescript
const TOKEN_KEY = "auth.token";        // JWT access token
const REFRESH_KEY = "auth.refresh";    // Refresh token

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (token: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
```

**What gets stored:**
- `auth.token`: JWT token (used to authenticate API requests)
- `auth.refresh`: Refresh token (used to get new JWT when expired)

**Token Format** (current mock):
```
auth.token = "mock.jwt.YWxleFRlc3RAaW52ZXN0YQ=="  (encoded email)
auth.refresh = "mock.refresh.a1b2c3d4e5"
```

---

### 2. **User Data** (localStorage)
**File**: `src/context/auth-context.tsx`

```typescript
const USER_KEY = "auth.user";  // User profile cache

localStorage.setItem(USER_KEY, JSON.stringify(session.user));
```

**What gets stored:**
```json
{
  "id": "u-001",
  "name": "Alex Morgan",
  "email": "alex@investa.io",
  "role": "user",
  "createdAt": "2024-01-15T00:00:00Z"
}
```

---

### 3. **Credentials** (NOT stored)
- ❌ **Password is NEVER stored** in localStorage
- ❌ **Email is NOT stored** as plain text (only in User JSON after login)
- ✅ Password is only transmitted once during login → deleted after authentication

---

## 🔄 Authentication Flow (Detailed)

### Step 1: Login
**File**: `src/routes/_app.login.tsx` (or login page)

```typescript
// User submits: email + password
const handleLogin = async (email: string, password: string) => {
  await authContext.login(email, password);
};
```

### Step 2: Backend Validation
**File**: `src/services/auth-service.ts`

```typescript
async login(email: string, _password: string): Promise<AuthSession> {
  // In mock: no validation
  // In real backend: POST /api/auth/login { email, password }
  // Backend validates against database, generates JWT
  
  return {
    token: "jwt_token_from_backend",
    refreshToken: "refresh_token_from_backend",
    user: { id, name, email, role, createdAt }
  };
}
```

### Step 3: Token Persistence
**File**: `src/context/auth-context.tsx`

```typescript
const persist = (session: AuthSession) => {
  // Store tokens
  tokenStorage.set(session.token, session.refreshToken);
  
  // Store user data
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  
  // Update React state
  setUser(session.user);
};
```

### Step 4: Auto-Inject Token on API Requests
**File**: `src/lib/api-client.ts`

```typescript
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();  // Read from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // Add to header
  }
  return config;
});
```

### Step 5: Session Restoration on Page Refresh
**File**: `src/context/auth-context.tsx`

```typescript
useEffect(() => {
  // On page load/refresh:
  const token = tokenStorage.get();           // Get token from storage
  const cached = localStorage.getItem(USER_KEY);  // Get user from storage
  
  if (token && cached) {
    setUser(JSON.parse(cached));  // Restore session
  }
  setIsLoading(false);
}, []);
```

---

## 📍 Browser Storage Locations

### How to View Stored Data (DevTools)

**Chrome/Edge Developer Tools:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. In left sidebar: **Storage** → **Local Storage**
4. Click `http://localhost:5173`
5. You'll see:
   - `auth.token` = JWT
   - `auth.refresh` = Refresh token
   - `auth.user` = User JSON

**Firefox Developer Tools:**
1. Press `F12`
2. Go to **Storage** tab
3. Expand **Local Storage**
4. Click the app URL

---

## 🔐 Security Considerations

### Current Implementation (Mock - Development Only)
✅ Tokens stored in localStorage (development)
✅ Tokens auto-injected to API requests
✅ Logout clears all tokens
✅ Page refresh restores session

### For Production (Recommended Changes)
- Move tokens to **httpOnly cookies** (not accessible via JavaScript)
- Add token expiration (JWT exp claim)
- Implement token rotation (refresh token endpoints)
- Use HTTPS only (secure flag on cookies)
- Add CSRF protection

---

## 🗄️ Spring Boot Backend Integration

### Current Status: Mock Auth Service

**Real backend endpoints needed:**

```
POST /api/auth/login
  Request:  { email, password }
  Response: { token, refreshToken, user }

POST /api/auth/register
  Request:  { name, email, password }
  Response: { token, refreshToken, user }

POST /api/auth/refresh
  Request:  { refreshToken }
  Response: { token, refreshToken }

GET /api/auth/me
  Headers:  Authorization: Bearer <token>
  Response: { user }
```

### Conversion Steps (When Ready)

**1. Update authService.ts:**
```typescript
export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    // Replace mock with:
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;  // { token, refreshToken, user }
  }
}
```

**2. Create Spring Boot Auth Controller:**
- See `springboot-backend/src/main/java/com/investa/controller/AuthController.java`
- Implement login/register endpoints
- Generate JWT tokens
- Store user credentials in MongoDB

**3. Update .env:**
```
VITE_API_BASE_URL=http://localhost:8080/api
JWT_SECRET=your_secret_key
```

---

## 📋 Summary Table

| Item | Stored | Location | Key | Format |
|------|--------|----------|-----|--------|
| JWT Token | ✅ Yes | localStorage | `auth.token` | String (base64) |
| Refresh Token | ✅ Yes | localStorage | `auth.refresh` | String (random) |
| User Data | ✅ Yes | localStorage | `auth.user` | JSON (id, name, email, role) |
| Email | ✅ Yes | localStorage | In `auth.user` | String |
| Password | ❌ No | — | — | — |
| Credentials | ❌ No | — | — | — |

---

## 🚀 Next Steps

1. **Implement Spring Boot Auth Controller** → Generate real JWT tokens
2. **Update authService.ts** → Call real backend endpoints
3. **Test Login Flow** → Verify tokens stored correctly
4. **Monitor API Requests** → Check Authorization header in DevTools Network tab
5. **Add Logout** → Clear localStorage tokens
6. **Token Refresh** → Auto-refresh expired tokens

---

## 📞 Questions?

- **Q: Can I see the password after login?**
  - A: No. Password is transmitted once during login, then discarded.

- **Q: Where is the password validated?**
  - A: On the backend (Spring Boot). Frontend never validates.

- **Q: What if I clear localStorage?**
  - A: Session ends. User must login again.

- **Q: Is localStorage secure?**
  - A: No. Use httpOnly cookies in production.

- **Q: How long are tokens valid?**
  - A: Until manually logged out or token expires (JWT exp claim).

