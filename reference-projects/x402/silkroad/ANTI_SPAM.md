# Anti-Spam & Rate Limiting Measures

## Overview

Simple but effective anti-spam measures to prevent abuse during BETA deployment.

---

## ✅ Implemented Measures

### 1. **Maximum 3 Active Listings Per Wallet**

**Location:** `app/api/listings/route.ts`

**Logic:**
- Counts active listings (state: `in_review` or `on_market`) per wallet
- Blocks creation if user already has 3 active listings
- Pulled/deleted listings don't count toward limit
- Works in both MOCK and REAL modes

**Error Response:**
```json
{
  "error": "Maximum 3 active listings allowed per wallet. Delete or deactivate existing listings to create new ones.",
  "currentCount": 3,
  "limit": 3
}
```

**Status Code:** `429 Too Many Requests`

---

### 2. **Rate Limiting (MongoDB-Based)**

**Location:** `lib/rateLimit.ts`

**Mechanism:**
- MongoDB collection `ratelimits` with TTL index
- Tracks request counts per `key:identifier` (e.g., `create-listing:wallet123`)
- Auto-expires after time window
- Fail-open design (allows requests on DB errors)

**Rate Limits:**

| Endpoint | Limit | Window | Key Prefix |
|----------|-------|--------|------------|
| **Create Listing** | 3 requests | 1 hour | `create-listing` |
| **Purchase** | 10 requests | 1 hour | `purchase` |
| **Image Upload** | 5 requests | 10 minutes | `image-upload` |
| **General API** | 100 requests | 1 minute | `api` (reserved) |

---

### 3. **Detailed Error Feedback**

**Location:** `app/listings/new/page.tsx`

**Features:**
- Detects `429` status codes
- Displays human-readable reset times
- Shows current count vs. limit
- Contextual messages per error type

**Examples:**

```
❌ "Too many listing attempts. Maximum 3 per hour. Try again after 3:45 PM."

❌ "Maximum 3 active listings allowed per wallet (3/3 listings)"

❌ "Too many upload attempts. Maximum 5 per 10 minutes. Try again after 2:15 PM."
```

---

## 🔒 How It Works

### Listing Creation Flow

```
1. User submits listing form
   ↓
2. Check rate limit (3/hour via MongoDB)
   ├─ Blocked? → Return 429 with reset time
   └─ Allowed? → Continue
   ↓
3. Count existing active listings
   ├─ >= 3? → Return 429 with count
   └─ < 3? → Allow creation
   ↓
4. Create listing (state: in_review)
```

### Purchase Flow

```
1. User clicks "Buy" button
   ↓
2. Payment header present? (X-PAYMENT)
   ├─ No → Return 402 Payment Required
   └─ Yes → Extract buyer wallet
   ↓
3. Check rate limit (10/hour via MongoDB)
   ├─ Blocked? → Return 429
   └─ Allowed? → Process payment
```

### Image Upload Flow

```
1. User selects image
   ↓
2. Frontend adds wallet query param
   ↓
3. Backend checks rate limit (5/10min)
   ├─ Blocked? → Return 429
   └─ Allowed? → Upload to Cloudinary
```

---

## 🛡️ Protection Against

✅ **Spam Listings:** Max 3 active + 3/hour rate limit  
✅ **Image Spam:** 5 uploads per 10 minutes  
✅ **Purchase Spam:** 10 attempts per hour  
✅ **Database Bloat:** TTL auto-cleanup on rate limit entries  

---

## 🔧 Configuration

Edit `lib/rateLimit.ts` to adjust limits:

```typescript
export const RATE_LIMITS = {
  CREATE_LISTING: {
    maxRequests: 3,        // ← Change here
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'create-listing',
  },
  // ...
}
```

---

## 📊 Monitoring

**Check rate limit usage in MongoDB:**
```javascript
db.ratelimits.find({ key: /create-listing/ }).sort({ count: -1 })
```

**Find users hitting limits:**
```javascript
db.ratelimits.find({ count: { $gte: 3 } })
```

**TTL index ensures auto-cleanup:**
```javascript
db.ratelimits.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 })
```

---

## ⚠️ Known Limitations

1. **No IP-based blocking** (wallet-only)
   - Mitigation: Token gating (50k $SRx402) = natural barrier

2. **Fail-open on DB errors**
   - Allows requests if MongoDB is down
   - Prioritizes uptime over strict enforcement

3. **No distributed rate limiting**
   - Single MongoDB instance (fine for BETA)
   - Scale to Redis for high traffic

---

## 🚀 Future Enhancements

- [ ] IP-based rate limiting for anonymous endpoints
- [ ] Admin dashboard to view rate limit violators
- [ ] Exponential backoff for repeat offenders
- [ ] CAPTCHA on repeated failures
- [ ] Redis distributed rate limiting
- [ ] Webhooks for abuse alerts

---

**Last Updated:** October 30, 2025  
**Status:** ✅ Production-Ready for BETA

