# HANARAD Farmer-Companion — Complete REST API Documentation

**Version:** 1.0.0 | **Base URL:** `https://api.hanarad.com/v1` | **Date:** 2026-05-08

---

## Table of Contents

1. [Authentication & Security](#1-authentication--security)
2. [User Profile](#2-user-profile)
3. [Farmer Profile](#3-farmer-profile)
4. [Farm Management](#4-farm-management)
5. [Crop Management](#5-crop-management)
6. [Disease Detection](#6-disease-detection)
7. [Weather](#7-weather)
8. [Mandi / Market Prices](#8-mandi--market-prices)
9. [Government Schemes](#9-government-schemes)
10. [Expert Consultations](#10-expert-consultations)
11. [Nearby Stores](#11-nearby-stores)
12. [Marketplace](#12-marketplace)
13. [Orders](#13-orders)
14. [Payments](#14-payments)
15. [Notifications](#15-notifications)
16. [Language & Settings](#16-language--settings)
17. [Analytics](#17-analytics)
18. [Legal / Content](#18-legal--content)
19. [Support System](#19-support-system)
20. [File Uploads](#20-file-uploads)
21. [Admin Panel](#21-admin-panel)
22. [Error Reference](#22-error-reference)

---

## Global Conventions

### Request Headers

```
Content-Type:  application/json
Authorization: Bearer <access_token>       (required on protected routes)
Accept-Language: en | hi | gu | tl        (optional — defaults to user preference)
X-App-Version: 1.0.0
X-Platform: android | ios | web
```

### Standard Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "per_page": 20, "total": 150 }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message.",
    "details": [{ "field": "email", "message": "Invalid email format." }]
  }
}
```

---

## 1. Authentication & Security

### POST `/auth/register`

Register a new farmer account.

**Auth required:** No  
**Rate limit:** 5 requests / hour per IP

**Request Body:**

```json
{
  "name": "Ramesh Patel",
  "email": "ramesh@example.com",
  "phone": "9876543210",
  "password": "securePass123",
  "language_code": "gu"
}
```

**Validations:**

- `name`: 2–100 chars, required
- `email`: valid format, unique
- `phone`: 10-digit Indian mobile (optional)
- `password`: min 6 chars

**Success Response `201`:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
    "expires_in": 3600,
    "user": {
      "id": "uuid-v4",
      "name": "Ramesh Patel",
      "email": "ramesh@example.com",
      "phone": "9876543210",
      "role": "farmer",
      "language_code": "gu",
      "is_profile_setup": false
    }
  }
}
```

**Error Responses:**

```json
{ "error": { "code": "EMAIL_TAKEN",       "message": "An account with this email already exists." } }
{ "error": { "code": "PHONE_TAKEN",       "message": "This phone number is already registered." } }
{ "error": { "code": "VALIDATION_ERROR",  "message": "Validation failed.", "details": [...] } }
```

---

### POST `/auth/login`

Login with email + password.

**Auth required:** No  
**Rate limit:** 10 requests / 15 minutes per IP

**Request Body:**

```json
{
  "email": "ramesh@example.com",
  "password": "securePass123"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
    "expires_in": 3600,
    "user": {
      "id": "uuid-v4",
      "name": "Ramesh Patel",
      "email": "ramesh@example.com",
      "role": "farmer",
      "language_code": "gu",
      "avatar_emoji": "👨‍🌾",
      "is_profile_setup": true
    }
  }
}
```

**Error Responses:**

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." } }
{ "error": { "code": "ACCOUNT_DISABLED",     "message": "Your account has been suspended." } }
{ "error": { "code": "RATE_LIMIT_EXCEEDED",  "message": "Too many login attempts. Try after 15 minutes." } }
```

---

### POST `/auth/send-otp`

Send a 6-digit OTP to email or phone.

**Auth required:** No

**Request Body:**

```json
{
  "contact": "ramesh@example.com",
  "purpose": "email_verify | phone_verify | login | password_reset"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": { "message": "OTP sent.", "expires_in_sec": 300 }
}
```

---

### POST `/auth/verify-otp`

Verify submitted OTP.

**Auth required:** No

**Request Body:**

```json
{
  "contact": "ramesh@example.com",
  "otp": "482910",
  "purpose": "email_verify"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "dGhpcyBp...",
    "expires_in": 3600,
    "user": { "id": "uuid", "is_email_verified": true }
  }
}
```

**Error Responses:**

```json
{ "error": { "code": "INVALID_OTP",  "message": "The OTP you entered is incorrect." } }
{ "error": { "code": "EXPIRED_OTP",  "message": "OTP has expired. Please request a new one." } }
{ "error": { "code": "OTP_ATTEMPTS_EXCEEDED", "message": "Too many incorrect attempts." } }
```

---

### POST `/auth/forgot-password`

Initiate password reset flow.

**Auth required:** No

**Request Body:**

```json
{ "email": "ramesh@example.com" }
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": { "message": "Password reset OTP sent to your email." }
}
```

---

### POST `/auth/reset-password`

Set new password after OTP verification.

**Auth required:** No

**Request Body:**

```json
{
  "email": "ramesh@example.com",
  "otp": "482910",
  "new_password": "newSecure456"
}
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Password updated successfully." } }
```

---

### POST `/auth/refresh`

Exchange a refresh token for a new access token.

**Auth required:** No

**Request Body:**

```json
{ "refresh_token": "dGhpcyBpcyBhIHJlZnJl..." }
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 3600
  }
}
```

---

### POST `/auth/logout`

Revoke refresh token and end session.

**Auth required:** Yes

**Request Body:**

```json
{ "refresh_token": "dGhpcyBpcyBhIHJlZnJl..." }
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Logged out successfully." } }
```

---

## 2. User Profile

### GET `/users/me`

Get authenticated user's profile.

**Auth required:** Yes

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "name": "Ramesh Patel",
    "email": "ramesh@example.com",
    "phone": "9876543210",
    "role": "farmer",
    "avatar_emoji": "👨‍🌾",
    "avatar_url": null,
    "language_code": "gu",
    "is_email_verified": true,
    "is_phone_verified": false,
    "is_profile_setup": true,
    "is_active": true,
    "last_login_at": "2026-05-08T10:00:00Z",
    "created_at": "2026-01-15T08:30:00Z"
  }
}
```

---

### PATCH `/users/me`

Update name, phone, avatar, or language.

**Auth required:** Yes

**Request Body (all fields optional):**

```json
{
  "name": "Ramesh B. Patel",
  "phone": "9876543210",
  "avatar_emoji": "👩‍🌾",
  "language_code": "hi"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": { "message": "Profile updated.", "user": { ... } }
}
```

---

### DELETE `/users/me`

Soft-delete account.

**Auth required:** Yes

**Request Body:**

```json
{ "password": "confirmMyPassword123" }
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Account scheduled for deletion." } }
```

---

## 3. Farmer Profile

### GET `/farmer-profile`

Get farmer-specific profile (village, land, crops).

**Auth required:** Yes

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "village": "Savar Kundla",
    "taluka": "Savar Kundla",
    "district": "Amreli",
    "state": "Gujarat",
    "pincode": "364515",
    "latitude": 21.3387,
    "longitude": 71.3156,
    "total_land_acres": 8.5,
    "primary_crops": ["cotton", "groundnut"],
    "farming_type": "rainfed",
    "years_farming": 15,
    "kcc_registered": false
  }
}
```

---

### PUT `/farmer-profile`

Create or update farmer profile. Upsert — safe to call on first setup.

**Auth required:** Yes

**Request Body:**

```json
{
  "village": "Savar Kundla",
  "taluka": "Savar Kundla",
  "district": "Amreli",
  "state": "Gujarat",
  "pincode": "364515",
  "latitude": 21.3387,
  "longitude": 71.3156,
  "total_land_acres": 8.5,
  "primary_crops": ["cotton", "groundnut"],
  "farming_type": "rainfed",
  "years_farming": 15
}
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Profile saved.", "profile": { ... } } }
```

---

## 4. Farm Management

### GET `/farms`

List all farms belonging to the authenticated user.

**Auth required:** Yes  
**Query Params:** `?page=1&per_page=20`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "farm-uuid",
      "name": "North Field",
      "village": "Savar Kundla",
      "method": "draw",
      "area_acres": 3.4,
      "area_bigha": 10.2,
      "area_sqm": 13759.2,
      "perimeter_m": 468.3,
      "primary_crop": "cotton",
      "land_type": "farmland",
      "created_at": "2026-03-12T09:00:00Z"
    }
  ],
  "meta": { "total": 4, "page": 1, "per_page": 20 }
}
```

---

### POST `/farms`

Save a new farm boundary.

**Auth required:** Yes

**Request Body:**

```json
{
  "name": "North Field",
  "village": "Savar Kundla",
  "district": "Amreli",
  "state": "Gujarat",
  "method": "draw",
  "area_sqm": 13759.2,
  "area_acres": 3.4,
  "area_bigha": 10.2,
  "perimeter_m": 468.3,
  "centroid_lat": 21.338,
  "centroid_lon": 71.315,
  "primary_crop": "cotton",
  "land_type": "farmland",
  "coordinates": [
    { "seq": 0, "latitude": 21.3382, "longitude": 71.314 },
    { "seq": 1, "latitude": 21.3385, "longitude": 71.3168 },
    { "seq": 2, "latitude": 21.3391, "longitude": 71.3165 },
    { "seq": 3, "latitude": 21.339, "longitude": 71.3142 }
  ]
}
```

**Success Response `201`:**

```json
{
  "success": true,
  "data": { "farm": { "id": "farm-uuid", "name": "North Field", ... } }
}
```

---

### GET `/farms/:farmId`

Get a single farm with its full boundary coordinates.

**Auth required:** Yes

**Path Params:** `farmId` — UUID

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "farm-uuid",
    "name": "North Field",
    "coordinates": [{ "seq": 0, "latitude": 21.3382, "longitude": 71.314 }]
  }
}
```

---

### PATCH `/farms/:farmId`

Update farm name, crop, notes, etc.

**Auth required:** Yes

**Request Body (all optional):**

```json
{
  "name": "Main Field",
  "primary_crop": "groundnut",
  "notes": "Sandy soil, good drainage."
}
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Farm updated." } }
```

---

### DELETE `/farms/:farmId`

Soft-delete a farm.

**Auth required:** Yes

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Farm deleted." } }
```

---

## 5. Crop Management

### GET `/crops`

Get master list of all supported crops.

**Auth required:** No  
**Query Params:** `?category=kharif | rabi | zaid`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "cotton",
      "name_en": "Cotton",
      "name_hi": "कपास",
      "name_gu": "કપાસ",
      "icon": "🌿",
      "category": "Kharif",
      "min_temp": 21,
      "max_temp": 35,
      "kc_coefficient": 1.15,
      "sow_months": [5, 6],
      "tip": "Needs well-drained black soil."
    }
  ]
}
```

---

### GET `/users/me/crops`

List crops the farmer is currently growing.

**Auth required:** Yes

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "crop": { "key": "cotton", "name_en": "Cotton" },
      "farm": { "id": "farm-uuid", "name": "North Field" },
      "area_acres": 3.0,
      "sow_date": "2026-06-10",
      "variety": "Bt Cotton Hybrid"
    }
  ]
}
```

---

### POST `/users/me/crops`

Add a crop to the farmer's active list.

**Auth required:** Yes

**Request Body:**

```json
{
  "crop_id": 1,
  "farm_id": "farm-uuid",
  "area_acres": 3.0,
  "sow_date": "2026-06-10",
  "variety": "Bt Cotton Hybrid"
}
```

**Success Response `201`:**

```json
{
  "success": true,
  "data": { "message": "Crop added.", "user_crop": { "id": 10 } }
}
```

---

### GET `/crops/advisor`

Get AI-recommended crops for a location based on NASA POWER climate data.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "location": { "lat": 21.338, "lon": 71.315 },
    "climate": {
      "avg_temp_c":    28.5,
      "avg_rain_mm":   3.2,
      "avg_humidity":  62.0
    },
    "recommended": [
      {
        "crop_key":   "cotton",
        "name_en":    "Cotton",
        "icon":       "🌿",
        "match_score": 94,
        "reason":     "Ideal temperature and humidity match."
      }
    ],
    "not_recommended": [ ... ]
  }
}
```

---

### GET `/crops/sowing-calendar`

Get sowing calendar for all crops at a given location.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "crop_key": "cotton",
      "name_en": "Cotton",
      "sow_months": [5, 6],
      "status": "soon",
      "months_away": 1,
      "climate_fit": true
    }
  ]
}
```

---

### GET `/crops/irrigation-advice`

Get irrigation recommendations based on weather forecast.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315&crop_key=cotton`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "crop": "cotton",
    "kc": 1.15,
    "days": [
      {
        "date": "2026-05-09",
        "eto_mm": 5.2,
        "etc_mm": 5.98,
        "rain_mm": 1.5,
        "net_need_mm": 4.48,
        "advice": "Moderate irrigation: 4.5 mm",
        "icon": "💦"
      }
    ]
  }
}
```

---

## 6. Disease Detection

### POST `/disease/scan`

Submit an image for AI disease detection (future ML endpoint).

**Auth required:** Yes  
**Content-Type:** `multipart/form-data`

**Form Fields:**

```
crop_key:   cotton
image:      <binary file>
source:     camera | gallery
latitude:   21.338   (optional)
longitude:  71.315   (optional)
```

**Validation:** image max 10 MB, types: JPEG/PNG/WEBP

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "report_id": "report-uuid",
    "disease": "Leaf Blight",
    "confidence": 94.2,
    "severity": "high",
    "description": "Helminthosporium leaf blight caused by Bipolaris sorokiniana...",
    "causes": ["High humidity above 85%", "Temperature 20–30°C"],
    "treatment": [
      {
        "step": 1,
        "action": "Remove infected leaves",
        "detail": "Burn all infected material."
      },
      {
        "step": 2,
        "action": "Apply fungicide",
        "detail": "Mancozeb 75% WP @ 2g/litre."
      }
    ],
    "prevention": ["Use resistant varieties", "Maintain spacing"],
    "image_url": "https://cdn.hanarad.com/disease/abc123.jpg"
  }
}
```

---

### POST `/disease/reports`

Save an offline (symptom-based) disease report.

**Auth required:** Yes

**Request Body:**

```json
{
  "farm_id": "farm-uuid",
  "crop_key": "cotton",
  "scan_method": "symptom",
  "detected_disease": "Leaf Blight",
  "severity": "high",
  "symptoms": ["yellowing leaves", "brown spots"],
  "latitude": 21.338,
  "longitude": 71.315
}
```

**Success Response `201`:**

```json
{ "success": true, "data": { "report_id": "report-uuid" } }
```

---

### GET `/disease/reports`

Get disease scan history for the authenticated farmer.

**Auth required:** Yes  
**Query Params:** `?page=1&per_page=10&crop_key=cotton&status=open`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "report-uuid",
      "crop_key": "cotton",
      "detected_disease": "Leaf Blight",
      "severity": "high",
      "confidence_pct": 94.2,
      "status": "open",
      "created_at": "2026-05-06T11:00:00Z"
    }
  ],
  "meta": { "total": 5 }
}
```

---

### PATCH `/disease/reports/:reportId`

Update report status (treated / resolved).

**Auth required:** Yes

**Request Body:**

```json
{ "status": "treated" }
```

---

## 7. Weather

### GET `/weather/current`

Get current weather for a coordinate.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "latitude": 21.338,
    "longitude": 71.315,
    "temperature": 32.1,
    "humidity": 68,
    "rain_mm": 0.0,
    "wind_kph": 14.4,
    "uv_index": 7.2,
    "condition": "Sunny and warm",
    "icon": "☀️",
    "alerts": [],
    "source": "openmeteo",
    "updated_at": "2026-05-08T10:00:00Z"
  }
}
```

---

### GET `/weather/forecast`

Get 7-day forecast.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315&days=7`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "daily": [
      {
        "date": "2026-05-09",
        "temp_max": 35.2,
        "temp_min": 24.1,
        "rain_mm": 2.5,
        "wind_kph": 16.0,
        "condition": "Partly cloudy",
        "icon": "⛅"
      }
    ]
  }
}
```

---

### GET `/weather/historical`

Get historical weather data (up to 90 days).

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315&from=2026-04-01&to=2026-05-01`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "date": "2026-04-01",
        "temp_max": 37.0,
        "temp_min": 22.5,
        "rain_mm": 0.0
      }
    ]
  }
}
```

---

### GET `/weather/alerts`

Get active weather alerts for a location.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "alert-uuid",
      "type": "heavy_rain",
      "severity": "high",
      "title": "Heavy Rainfall Warning",
      "message": "Expect 80mm+ rain in next 24 hours.",
      "valid_from": "2026-05-09T06:00:00Z",
      "valid_to": "2026-05-10T06:00:00Z"
    }
  ]
}
```

---

### GET `/weather/soil`

Get NASA POWER soil data for a location.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "moisture_pct": 62.0,
    "temperature_c": 28.0,
    "ph": 6.8,
    "nitrogen_kg_ha": 45.0,
    "phosphorus_kg_ha": 22.0,
    "potassium_kg_ha": 180.0,
    "organic_carbon_pct": 0.8,
    "ec_ds_m": 0.3,
    "source": "nasa_power",
    "date": "2026-05-08"
  }
}
```

---

## 8. Mandi / Market Prices

### GET `/mandi/prices`

Get live or cached commodity prices.

**Auth required:** Yes  
**Query Params:** `?state=Gujarat&commodity=Cotton&market=Rajkot&page=1&per_page=20`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "is_live": true,
    "source": "data_gov_in",
    "prices": [
      {
        "market": "Rajkot",
        "district": "Rajkot",
        "state": "Gujarat",
        "commodity": "Cotton",
        "variety": "Local",
        "arrival_date": "2026-05-08",
        "min_price": 6800,
        "max_price": 7200,
        "modal_price": 7050,
        "trend": "up",
        "unit": "₹/quintal"
      }
    ]
  },
  "meta": { "total": 45, "fetched_at": "2026-05-08T08:00:00Z" }
}
```

---

### GET `/mandi/markets`

List all available mandi markets.

**Auth required:** No  
**Query Params:** `?state=Gujarat&district=Amreli`

---

### POST `/mandi/price-alerts`

Create a price alert for a commodity.

**Auth required:** Yes

**Request Body:**

```json
{
  "commodity": "Cotton",
  "state": "Gujarat",
  "alert_above": 7500,
  "alert_below": 6500
}
```

**Success Response `201`:**

```json
{ "success": true, "data": { "alert_id": 12 } }
```

---

### GET `/mandi/price-alerts`

List the user's price alerts.

**Auth required:** Yes

---

### DELETE `/mandi/price-alerts/:alertId`

Delete a price alert.

**Auth required:** Yes

---

## 9. Government Schemes

### GET `/schemes`

List government schemes with optional filters.

**Auth required:** No  
**Query Params:** `?category=insurance&state=Gujarat&is_central=true&page=1&per_page=10`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "pmfby",
      "category": "insurance",
      "name_en": "Pradhan Mantri Fasal Bima Yojana",
      "desc_en": "Crop insurance scheme providing financial support...",
      "benefit_en": "Up to 100% insured sum for crop loss.",
      "eligibility_en": "All farmers including sharecroppers.",
      "portal_url": "https://pmfby.gov.in",
      "helpline": "1800-200-7710",
      "is_central": true
    }
  ]
}
```

---

### GET `/schemes/:schemeId`

Get full details of a scheme.

**Auth required:** No

---

### POST `/schemes/:schemeId/bookmark`

Bookmark a scheme for quick access.

**Auth required:** Yes

**Success Response `201`:**

```json
{ "success": true, "data": { "message": "Scheme bookmarked." } }
```

---

### GET `/schemes/bookmarks`

List the user's bookmarked schemes.

**Auth required:** Yes

---

### DELETE `/schemes/:schemeId/bookmark`

Remove a bookmark.

**Auth required:** Yes

---

## 10. Expert Consultations

### GET `/experts`

List available agricultural experts.

**Auth required:** Yes  
**Query Params:** `?specialization=disease&language=gu&page=1&per_page=10`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "expert-uuid",
      "name": "Dr. Anand Sharma",
      "avatar_url": null,
      "specialization": "Crop Disease",
      "qualification": "Ph.D. Plant Pathology",
      "experience_yrs": 12,
      "languages": ["en", "hi", "gu"],
      "rating": 4.8,
      "total_reviews": 142,
      "per_call_rate": 150,
      "is_available": true
    }
  ]
}
```

---

### POST `/consultations`

Request a consultation with an expert.

**Auth required:** Yes

**Request Body:**

```json
{
  "expert_id": "expert-uuid",
  "crop_key": "cotton",
  "issue_summary": "Cotton leaves turning yellow with brown spots. 2 acres affected.",
  "mode": "chat",
  "scheduled_at": "2026-05-09T14:00:00Z"
}
```

**Success Response `201`:**

```json
{
  "success": true,
  "data": {
    "consultation_id": "consult-uuid",
    "status": "pending",
    "expert": { "name": "Dr. Anand Sharma" },
    "scheduled_at": "2026-05-09T14:00:00Z"
  }
}
```

---

### GET `/consultations`

Get the farmer's consultation history.

**Auth required:** Yes  
**Query Params:** `?status=pending|accepted|completed&page=1`

---

### GET `/consultations/:consultationId`

Get consultation detail with message thread.

**Auth required:** Yes

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "consult-uuid",
    "status": "ongoing",
    "messages": [
      {
        "id": 1,
        "sender_id": "user-uuid",
        "sender_role": "farmer",
        "message_type": "text",
        "content": "Hello doctor, my cotton leaves are turning yellow.",
        "created_at": "2026-05-08T14:05:00Z"
      }
    ]
  }
}
```

---

### POST `/consultations/:consultationId/messages`

Send a message in a consultation.

**Auth required:** Yes

**Request Body:**

```json
{
  "message_type": "text",
  "content": "The spots started 3 days ago after heavy rain."
}
```

---

### PATCH `/consultations/:consultationId/rate`

Submit rating and review after consultation.

**Auth required:** Yes

**Request Body:**

```json
{
  "rating": 5,
  "review_text": "Very helpful advice. Resolved my issue."
}
```

---

## 11. Nearby Stores

### GET `/stores/nearby`

Find agricultural stores near a coordinate.

**Auth required:** Yes  
**Query Params:** `?lat=21.338&lon=71.315&radius_m=10000&type=agro_shop`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "store-uuid",
      "name": "Krishi Seva Kendra",
      "store_type": "agro_shop",
      "address": "Main Bazaar, Savar Kundla",
      "latitude": 21.3392,
      "longitude": 71.313,
      "distance_m": 420,
      "phone": "02847-220000",
      "is_verified": true
    }
  ]
}
```

---

## 12. Marketplace

### GET `/marketplace/products`

Browse the product marketplace.

**Auth required:** No  
**Query Params:** `?category_id=1&search=urea&is_organic=true&min_price=100&max_price=2000&sort_by=price_asc&page=1&per_page=20`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prod-uuid",
      "name": "DAP Fertilizer 50kg",
      "price": 1350.0,
      "unit": "bag",
      "stock_qty": 200,
      "avg_rating": 4.5,
      "seller_name": "AgriMart Gujarat",
      "is_organic": false,
      "thumbnail": "https://cdn.hanarad.com/products/dap.jpg"
    }
  ],
  "meta": { "total": 84, "page": 1, "per_page": 20 }
}
```

---

### GET `/marketplace/products/:productId`

Get product details.

**Auth required:** No

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "prod-uuid",
    "name": "DAP Fertilizer 50kg",
    "description": "Di-Ammonium Phosphate — 18-46-0 formulation.",
    "price": 1350.0,
    "unit": "bag",
    "stock_qty": 200,
    "brand": "IFFCO",
    "avg_rating": 4.5,
    "total_reviews": 28,
    "images": ["https://cdn.hanarad.com/products/dap1.jpg"],
    "seller": {
      "id": "seller-uuid",
      "name": "AgriMart Gujarat"
    }
  }
}
```

---

### POST `/marketplace/products`

Seller creates a new product listing.

**Auth required:** Yes (farmer role)

**Request Body:**

```json
{
  "category_id": 2,
  "name": "Organic Neem Oil 1L",
  "description": "Cold-pressed neem oil for pest control.",
  "price": 480.0,
  "unit": "litre",
  "stock_qty": 50,
  "brand": "GreenFarm",
  "is_organic": true
}
```

**Success Response `201`:**

```json
{
  "success": true,
  "data": {
    "product_id": "prod-uuid",
    "moderation_status": "pending",
    "message": "Product submitted for review."
  }
}
```

---

### PATCH `/marketplace/products/:productId`

Update product listing.

**Auth required:** Yes (product owner)

---

### DELETE `/marketplace/products/:productId`

Soft-delete a product.

**Auth required:** Yes (product owner)

---

## 13. Orders

### POST `/orders`

Place a new order.

**Auth required:** Yes

**Request Body:**

```json
{
  "items": [{ "product_id": "prod-uuid", "quantity": 2 }],
  "delivery_address_id": "addr-uuid",
  "payment_method": "cod",
  "notes": "Deliver before noon."
}
```

**Success Response `201`:**

```json
{
  "success": true,
  "data": {
    "order_id": "order-uuid",
    "status": "pending",
    "total_amount": 2700.0,
    "payment_status": "pending"
  }
}
```

---

### GET `/orders`

List the buyer's orders.

**Auth required:** Yes  
**Query Params:** `?status=delivered&page=1`

---

### GET `/orders/:orderId`

Get order detail with items.

**Auth required:** Yes

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "status": "shipped",
    "items": [
      {
        "product_name": "DAP Fertilizer 50kg",
        "quantity": 2,
        "unit_price": 1350,
        "line_total": 2700
      }
    ],
    "subtotal": 2700,
    "delivery_fee": 0,
    "total_amount": 2700,
    "payment_method": "cod"
  }
}
```

---

### PATCH `/orders/:orderId/cancel`

Cancel a pending order.

**Auth required:** Yes

---

## 14. Payments

### POST `/payments/initiate`

Initiate a payment session (Razorpay/Stripe order creation).

**Auth required:** Yes

**Request Body:**

```json
{
  "order_id": "order-uuid",
  "method": "upi",
  "gateway": "razorpay"
}
```

**Success Response `201`:**

```json
{
  "success": true,
  "data": {
    "payment_id": "pay-uuid",
    "gateway_order_id": "order_Abc123xyz",
    "amount": 2700,
    "currency": "INR",
    "gateway_key": "rzp_live_..."
  }
}
```

---

### POST `/payments/verify`

Verify and record a completed payment (webhook or client callback).

**Auth required:** Yes

**Request Body:**

```json
{
  "payment_id": "pay-uuid",
  "gateway_payment_id": "pay_Def456",
  "gateway_signature": "sha256_signature_string"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": { "status": "success", "message": "Payment verified." }
}
```

---

### GET `/payments`

Get payment history.

**Auth required:** Yes  
**Query Params:** `?status=success&page=1`

---

## 15. Notifications

### GET `/notifications`

Get notification list for the authenticated user.

**Auth required:** Yes  
**Query Params:** `?filter=unread&type=weather&page=1&per_page=20`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "unread_count": 3,
    "notifications": [
      {
        "id": "notif-uuid",
        "type": "weather",
        "title": "Heavy Rain Warning",
        "body": "80mm rainfall expected tomorrow.",
        "is_read": false,
        "deep_link_screen": "Alerts",
        "created_at": "2026-05-08T07:00:00Z"
      }
    ]
  },
  "meta": { "total": 18, "page": 1 }
}
```

---

### PATCH `/notifications/:notificationId/read`

Mark one notification as read.

**Auth required:** Yes

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Marked as read." } }
```

---

### PATCH `/notifications/read-all`

Mark all notifications as read.

**Auth required:** Yes

---

### DELETE `/notifications/:notificationId`

Delete a single notification.

**Auth required:** Yes

---

### DELETE `/notifications`

Clear all notifications.

**Auth required:** Yes

---

### GET `/notifications/preferences`

Get notification preference settings.

**Auth required:** Yes

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "weather_alerts": true,
    "market_updates": false,
    "disease_alerts": true,
    "scheme_updates": true,
    "crop_reminders": true,
    "voice_readout": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "06:00"
  }
}
```

---

### PUT `/notifications/preferences`

Update notification preferences.

**Auth required:** Yes

**Request Body:**

```json
{
  "weather_alerts": true,
  "market_updates": true,
  "quiet_hours_start": "23:00",
  "quiet_hours_end": "05:00"
}
```

---

### POST `/notifications/register-device`

Register device push token with the server.

**Auth required:** Yes

**Request Body:**

```json
{
  "token": "ExponentPushToken[xxx] or FCM token",
  "platform": "android",
  "app_version": "1.0.0"
}
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Device registered." } }
```

---

## 16. Language & Settings

### GET `/settings/languages`

Get list of supported languages.

**Auth required:** No

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "code": "en",
      "name": "English",
      "native_name": "English",
      "is_active": true
    },
    {
      "code": "hi",
      "name": "Hindi",
      "native_name": "हिंदी",
      "is_active": true
    },
    {
      "code": "gu",
      "name": "Gujarati",
      "native_name": "ગુજરાતી",
      "is_active": true
    },
    {
      "code": "tl",
      "name": "Tagalog",
      "native_name": "Tagalog",
      "is_active": true
    }
  ]
}
```

---

### PATCH `/users/me/language`

Update user's preferred language.

**Auth required:** Yes

**Request Body:**

```json
{ "language_code": "hi" }
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Language updated to Hindi." } }
```

---

### GET `/settings/app`

Get app-wide settings (maintenance mode, min version, feature flags).

**Auth required:** No

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "maintenance_mode": false,
    "min_app_version": "1.0.0",
    "force_update_version": "0.0.0",
    "mandi_api_enabled": true,
    "disease_ai_enabled": false,
    "free_consultation_enabled": true
  }
}
```

---

## 17. Analytics

### POST `/analytics/events`

Track a client-side event.

**Auth required:** Yes  
**Rate limit:** 100 events / minute per user

**Request Body:**

```json
{
  "session_id": "session-uuid",
  "event_name": "weather_checked",
  "screen_name": "WeatherScreen",
  "properties": {
    "lat": "21.338",
    "lon": "71.315"
  },
  "occurred_at": "2026-05-08T10:15:00Z"
}
```

**Success Response `202`:**

```json
{ "success": true, "data": { "message": "Event recorded." } }
```

---

### POST `/analytics/events/batch`

Track multiple events in one request (offline sync).

**Auth required:** Yes

**Request Body:**

```json
{
  "events": [
    { "session_id": "uuid", "event_name": "app_open", "occurred_at": "..." },
    {
      "session_id": "uuid",
      "event_name": "screen_view",
      "screen_name": "HomeScreen",
      "occurred_at": "..."
    }
  ]
}
```

**Success Response `202`:**

```json
{ "success": true, "data": { "accepted": 2 } }
```

---

## 18. Legal / Content

### GET `/content/:type`

Get a legal/content document.

**Auth required:** No  
**Path Param:** `type` — `disclaimer | privacy_policy | terms_and_conditions | about_us`  
**Query Params:** `?lang=gu`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "type": "privacy_policy",
    "version": "1.2",
    "effective_date": "2026-01-01",
    "content": "# Privacy Policy\n\nWe respect your data...",
    "language": "gu",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### POST `/content/accept`

Record that the user accepted a legal document version.

**Auth required:** Yes

**Request Body:**

```json
{
  "content_type": "disclaimer",
  "content_version": "1.0"
}
```

**Success Response `200`:**

```json
{ "success": true, "data": { "message": "Acceptance recorded." } }
```

---

## 19. Support System

### GET `/support/faqs`

Get FAQ list.

**Auth required:** No  
**Query Params:** `?lang=gu&category_id=2`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question": "How do I draw my farm boundary?",
      "answer": "Go to Farm Map tab and tap 'Draw Farm'...",
      "category": "Farm"
    }
  ]
}
```

---

### POST `/support/tickets`

Create a support ticket.

**Auth required:** Yes

**Request Body:**

```json
{
  "category": "technical",
  "subject": "App crashes when I open Disease Scan",
  "message": "Every time I tap the camera button, the app closes."
}
```

**Success Response `201`:**

```json
{
  "success": true,
  "data": {
    "ticket_id": "ticket-uuid",
    "ticket_number": "HAN-2026-0042",
    "status": "open"
  }
}
```

---

### GET `/support/tickets`

List user's support tickets.

**Auth required:** Yes  
**Query Params:** `?status=open&page=1`

---

### GET `/support/tickets/:ticketId`

Get ticket with full message thread.

**Auth required:** Yes

---

### POST `/support/tickets/:ticketId/reply`

Reply to an existing ticket.

**Auth required:** Yes

**Request Body:**

```json
{ "message": "I tried reinstalling but the issue persists." }
```

---

## 20. File Uploads

### POST `/uploads`

Upload a file (avatar, farm image, disease scan, product image).

**Auth required:** Yes  
**Content-Type:** `multipart/form-data`

**Form Fields:**

```
file:        <binary>
purpose:     avatar | farm_image | disease_scan | product_image | ticket_attachment
reference_id: <related entity UUID — optional>
```

**Validation:**

- Images: max 10 MB, JPEG/PNG/WEBP/HEIC
- PDFs: max 5 MB
- Malware scan performed server-side

**Success Response `201`:**

```json
{
  "success": true,
  "data": {
    "file_id": "file-uuid",
    "cdn_url": "https://cdn.hanarad.com/uploads/abc123.jpg",
    "file_type": "image/jpeg",
    "file_size_bytes": 245780
  }
}
```

**Error Responses:**

```json
{ "error": { "code": "FILE_TOO_LARGE",    "message": "File exceeds maximum 10 MB limit." } }
{ "error": { "code": "INVALID_FILE_TYPE", "message": "Only JPEG, PNG, and WEBP images allowed." } }
```

---

## 21. Admin Panel

> All admin endpoints require `role: admin | super_admin` in the JWT.

### GET `/admin/users`

List all users with filters.

**Auth required:** Yes (admin)  
**Query Params:** `?role=farmer&state=Gujarat&is_active=true&search=ramesh&page=1&per_page=50`

**Success Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ramesh Patel",
      "email": "ramesh@example.com",
      "role": "farmer",
      "state": "Gujarat",
      "is_active": true,
      "created_at": "2026-01-15T08:30:00Z",
      "last_login_at": "2026-05-07T09:00:00Z"
    }
  ],
  "meta": { "total": 1842 }
}
```

---

### PATCH `/admin/users/:userId`

Enable/disable or change role of a user.

**Auth required:** Yes (admin)

**Request Body:**

```json
{
  "is_active": false,
  "role": "farmer"
}
```

---

### POST `/admin/notifications/send`

Broadcast or target a push notification.

**Auth required:** Yes (admin)  
**Rate limit:** 20 / minute

**Request Body:**

```json
{
  "type": "weather",
  "title": "Cyclone Warning — Gujarat",
  "body": "Please secure your crops. Cyclone expected in 48 hours.",
  "target": "all | topic | user_ids",
  "topic": "weather-alerts-gu",
  "user_ids": ["uuid1", "uuid2"],
  "deep_link_screen": "Alerts"
}
```

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "sent_count": 1284,
    "failed_count": 3,
    "fcm_message_id": "projects/..."
  }
}
```

---

### GET `/admin/banners`

List all banners.

**Auth required:** Yes (admin)

---

### POST `/admin/banners`

Create a new banner.

**Auth required:** Yes (admin)

**Request Body:**

```json
{
  "title_en": "PM Kisan Registration Open",
  "image_url": "https://cdn.hanarad.com/banners/pmkisan.jpg",
  "placement": "home",
  "deep_link_screen": "GovtSchemes",
  "starts_at": "2026-05-10T00:00:00Z",
  "ends_at": "2026-06-10T00:00:00Z",
  "sort_order": 1
}
```

---

### PATCH `/admin/banners/:bannerId`

Update a banner.

**Auth required:** Yes (admin)

---

### DELETE `/admin/banners/:bannerId`

Delete a banner.

**Auth required:** Yes (admin)

---

### GET `/admin/products/pending`

List products awaiting moderation.

**Auth required:** Yes (admin)  
**Query Params:** `?page=1&per_page=20`

---

### PATCH `/admin/products/:productId/moderate`

Approve or reject a product listing.

**Auth required:** Yes (admin)

**Request Body:**

```json
{
  "action": "approved | rejected",
  "rejection_reason": "Product image is blurry and description is incomplete."
}
```

---

### PUT `/admin/content/:type`

Update a legal/CMS document.

**Auth required:** Yes (admin)

**Request Body:**

```json
{
  "content_en": "# Privacy Policy\n\nUpdated content...",
  "content_hi": "...",
  "content_gu": "...",
  "version": "1.2",
  "effective_date": "2026-06-01"
}
```

---

### GET `/admin/analytics/dashboard`

Get aggregated analytics dashboard data.

**Auth required:** Yes (admin)  
**Query Params:** `?from=2026-05-01&to=2026-05-08`

**Success Response `200`:**

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1842,
      "new_this_period": 124,
      "active_today": 387
    },
    "events": {
      "total": 28402,
      "top_events": [
        { "event": "weather_checked", "count": 5210 },
        { "event": "mandi_viewed", "count": 3145 }
      ]
    },
    "disease_scans": { "total": 892, "this_period": 64 },
    "farms_saved": { "total": 1204 },
    "language_split": { "gu": 62, "hi": 28, "en": 8, "tl": 2 }
  }
}
```

---

### GET `/admin/support/tickets`

List all support tickets.

**Auth required:** Yes (admin)  
**Query Params:** `?status=open&priority=urgent&assigned_to=me&page=1`

---

### PATCH `/admin/support/tickets/:ticketId`

Assign, update status, or resolve a ticket.

**Auth required:** Yes (admin)

**Request Body:**

```json
{
  "status": "resolved",
  "assigned_to": "admin-uuid",
  "resolution_note": "App crash fixed in v1.0.2."
}
```

---

### POST `/admin/support/tickets/:ticketId/reply`

Reply to a support ticket as an agent.

**Auth required:** Yes (admin)

**Request Body:**

```json
{ "message": "Hi Ramesh, please update to app version 1.0.2." }
```

---

## 22. Error Reference

| HTTP Code | Error Code              | Meaning                                        |
| --------- | ----------------------- | ---------------------------------------------- |
| 400       | `VALIDATION_ERROR`      | Request body/query param failed validation     |
| 400       | `INVALID_OTP`           | OTP is wrong                                   |
| 400       | `EXPIRED_OTP`           | OTP has expired (5-minute window)              |
| 400       | `FILE_TOO_LARGE`        | Uploaded file exceeds size limit               |
| 400       | `INVALID_FILE_TYPE`     | File MIME type not allowed                     |
| 401       | `UNAUTHORIZED`          | Missing or invalid Bearer token                |
| 401       | `TOKEN_EXPIRED`         | JWT access token has expired                   |
| 401       | `REFRESH_TOKEN_INVALID` | Refresh token is revoked or expired            |
| 401       | `INVALID_CREDENTIALS`   | Wrong email or password                        |
| 403       | `FORBIDDEN`             | Authenticated but insufficient role/permission |
| 404       | `NOT_FOUND`             | Resource does not exist                        |
| 409       | `EMAIL_TAKEN`           | Email already registered                       |
| 409       | `PHONE_TAKEN`           | Phone already registered                       |
| 409       | `DUPLICATE`             | Record already exists (bookmark, review, etc.) |
| 422       | `INSUFFICIENT_STOCK`    | Not enough product stock for order             |
| 429       | `RATE_LIMIT_EXCEEDED`   | Too many requests                              |
| 500       | `INTERNAL_ERROR`        | Unexpected server error                        |
| 503       | `MAINTENANCE_MODE`      | Server in planned maintenance                  |
