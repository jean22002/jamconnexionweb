# Code Quality Improvements - Action Plan

## ✅ COMPLETED

### Critical Fixes
1. **React Hook Dependencies - Stale Closure**
   - ✅ Fixed `useVenueBands` hook: Added `useCallback` with proper dependencies
   - ✅ Fixed `useEffect` dependency array to include `searchConcertBands`
   - File: `/app/frontend/src/features/venue-dashboard/hooks/useVenueBands.js`

2. **Console.log Cleanup**
   - ✅ Removed 4 console.error statements from `useVenueBands.js`
   - Remaining: ~340 console statements across the codebase (to be cleaned in future sprints)

## 🔴 TODO - CRITICAL (Must Fix Before Production)

### Security Vulnerabilities

#### 1. Insecure Token Storage (HIGHEST PRIORITY)
**Impact**: Critical - Token theft via XSS attacks

**Files to modify**:
- `/app/frontend/src/context/AuthContext.jsx` (lines 14, 19, 42, 56)
- `/app/frontend/src/pages/VenueAccounting.jsx:23`
- `/app/frontend/src/pages/AdminAnalytics.jsx:23`
- `/app/frontend/src/hooks/useNotifications.js` (lines 21, 35)
- `/app/frontend/src/hooks/useOnlineStatus.js:17`

**Current Issue**: Using `localStorage` for JWT tokens

**Solution**:
1. **Option A (Recommended)**: Implement httpOnly cookies
   - Backend: Set JWT in httpOnly cookie during login
   - Frontend: Remove all localStorage token access
   - Auto-send cookies with each request

2. **Option B**: Memory-only storage with refresh tokens
   - Store access token in memory (React state)
   - Store refresh token in httpOnly cookie
   - Implement token refresh logic

**Implementation Steps**:
```javascript
// Backend (FastAPI)
@router.post("/auth/login")
async def login(response: Response, credentials: LoginRequest):
    # ... authenticate user
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="strict",
        max_age=3600  # 1 hour
    )
    return {"user": user_data}

// Frontend - Remove these lines:
localStorage.setItem('token', token)  // DELETE
const token = localStorage.getItem('token')  // DELETE

// axios interceptor will automatically send cookies
```

#### 2. React Hook Dependencies - Missing in Multiple Files

**Files with Critical Issues**:
1. `/app/frontend/src/pages/VenueDashboard.jsx`
   - Lines: 461, 537, 636, 645, 659, 672
   - 39+ missing dependencies in `useCallback` at line 537

2. `/app/frontend/src/pages/VenueDetail.jsx`
   - Lines: 119, 139, 164, 176, 186, 204, 260, 273, 327

**How to Fix**:
```bash
# Run ESLint with exhaustive-deps rule
npx eslint --fix /app/frontend/src/pages/VenueDashboard.jsx
npx eslint --fix /app/frontend/src/pages/VenueDetail.jsx
```

Manually review and add all missing dependencies to `useCallback` and `useEffect` arrays.

## 🟡 TODO - IMPORTANT

### 1. React Key Anti-Pattern (74 instances)

**Issue**: Using array index as React key

**Files**:
- `src/pages/VenueDashboard.jsx` (lines 3611, 4003, 4178)
- `src/pages/MusicianDashboard.jsx` (lines 1669, 1686, 1860, 1936, 2675, 2722)
- `src/pages/VenueDetail.jsx:1391`

**Fix Pattern**:
```javascript
// WRONG
{items.map((item, index) => <div key={index}>{item.name}</div>)}

// CORRECT
{items.map(item => <div key={item.id}>{item.name}</div>)}

// If no ID exists, generate one:
const itemsWithIds = items.map(item => ({ 
  ...item, 
  _key: item.id || `${item.name}-${Date.now()}-${Math.random()}`
}));
```

### 2. Console Statements Cleanup (~340 remaining)

**Strategy**:
```bash
# Find all console statements
grep -r "console\." /app/frontend/src --include="*.jsx" --include="*.js" -n

# Recommended approach:
# 1. Replace console.log with conditional logging
# 2. Use environment variable for dev logs only

// Create logging utility
// /app/frontend/src/utils/logger.js
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => isDev && console.log(...args),
  error: (...args) => isDev && console.error(...args),
  warn: (...args) => isDev && console.warn(...args),
};

// Usage
import { logger } from './utils/logger';
logger.log('Debug info');  // Only logs in development
```

### 3. Massive Component Refactoring

**Priority Order**:
1. `src/features/musician-dashboard/tabs/MapTab.jsx` - 864 lines
   - Extract: MapControls, MapMarkers, MapFilters, MapLegend

2. `src/features/venue-dashboard/dialogs/EventDetailsDialog.jsx` - 745 lines
   - Extract: EventHeader, EventParticipants, EventActions, EventInfo

3. `src/features/venue-dashboard/tabs/AccountingTab.jsx` - 535 lines
   - Extract: InvoiceList, PaymentSummary, TransactionHistory

4. `src/components/Calendar.jsx` - 334 lines, complexity 97
   - Extract: date calculation, event rendering, interaction handlers

**Refactoring Template**:
```javascript
// Before: 864-line MapTab.jsx
export default function MapTab() {
  // 864 lines of code...
}

// After: Modular structure
// MapTab.jsx (main component - ~100 lines)
import MapControls from './components/MapControls';
import MapMarkers from './components/MapMarkers';
import MapFilters from './components/MapFilters';
import { useMapLogic } from './hooks/useMapLogic';

export default function MapTab() {
  const { markers, filters, position } = useMapLogic();
  
  return (
    <div>
      <MapControls />
      <MapFilters filters={filters} />
      <MapMarkers markers={markers} position={position} />
    </div>
  );
}

// hooks/useMapLogic.js (~150 lines)
export function useMapLogic() {
  // Business logic here
  return { markers, filters, position };
}
```

## 🔵 TODO - NICE TO HAVE

### 1. Python Type Hints
Add type hints to:
- `add_fake_invoices.py`
- `add_invoices_final.py`
- `notifications_daemon.py`
- `notifications_scheduler.py`

### 2. Backend Complexity Reduction
- `notifications_scheduler.py:53` - `check_and_send_event_notifications()` (complexity 43, 249 lines)
- `middleware/rate_limit.py:92` - `get_rate_limit_for_route()` (complexity 23)
- `utils/auto_moderation.py:17` - `check_auto_moderation()` (complexity 12, 122 lines)

---

## Estimated Timeline

| Priority | Task | Effort | Timeline |
|----------|------|--------|----------|
| 🔴 Critical | Token Security (httpOnly cookies) | High | 1-2 days |
| 🔴 Critical | React Hook Dependencies | Medium | 1 day |
| 🟡 Important | React Key Anti-Pattern | Low | 0.5 days |
| 🟡 Important | Console Cleanup | Medium | 0.5 days |
| 🟡 Important | Component Refactoring | High | 3-4 days |
| 🔵 Nice to Have | Python Type Hints | Low | 1 day |
| 🔵 Nice to Have | Backend Complexity | High | 2-3 days |

**Total Estimated Effort**: 9-13 days

---

## Next Steps

1. **Immediate** (before next deployment):
   - Implement httpOnly cookie authentication
   - Fix React hook dependencies in VenueDashboard.jsx and VenueDetail.jsx

2. **This Sprint**:
   - Fix React key anti-patterns
   - Clean up console statements
   - Start MapTab refactoring

3. **Next Sprint**:
   - Complete component refactoring
   - Add Python type hints
   - Reduce backend complexity
