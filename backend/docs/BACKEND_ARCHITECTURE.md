# HANARAD Farmer-Companion — Backend Architecture & Design Document
**Version:** 1.0.0 | **Date:** 2026-05-08 | **Prepared by:** Engineering Team

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Application Module Analysis](#2-application-module-analysis)
3. [Recommended Backend Stack](#3-recommended-backend-stack)
4. [System Architecture Diagram](#4-system-architecture-diagram)
5. [Database Design Overview](#5-database-design-overview)
6. [ER Diagram (Text)](#6-er-diagram-text)
7. [Module Architecture & Folder Structure](#7-module-architecture--folder-structure)
8. [Authentication & Security Design](#8-authentication--security-design)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [Push Notification Architecture](#10-push-notification-architecture)
11. [File Upload Architecture](#11-file-upload-architecture)
12. [Caching Strategy](#12-caching-strategy)
13. [Scalability Design](#13-scalability-design)
14. [Admin Panel Design](#14-admin-panel-design)
15. [API Security Best Practices](#15-api-security-best-practices)
16. [Environment Configuration](#16-environment-configuration)
17. [Deployment Architecture](#17-deployment-architecture)
18. [Development Roadmap](#18-development-roadmap)

---

## 1. Executive Summary

HANARAD Farmer-Companion is a multilingual (English / Hindi / Gujarati / Tagalog) React Native application serving agricultural users in India (and the Philippines). After thorough analysis of all 40+ screens and 12+ API integrations, the backend requires:

- **23 core modules** (auth, farms, crops, weather, mandi, disease, schemes, expert, stores, marketplace, orders, payments, notifications, analytics, support, content, uploads, reviews, admin, settings, irrigation, sowing, soil)
- **42 PostgreSQL tables** with full relational integrity
- **120+ REST API endpoints**
- Role-based access: Farmer · Expert · Admin · Super Admin
- Multilingual content at the database layer (4 locales)
- Real-time push via Firebase Cloud Messaging
- Offline-first design: critical data available without connectivity

---

## 2. Application Module Analysis

Modules discovered from full source analysis:

| Module | Screens | Key Data Entities | External APIs Used |
|---|---|---|---|
| Auth & Onboarding | Splash, Language Select, Permissions, Onboarding, Login, Register, OTP, ProfileSetup, Forgot Password | users, otps, refresh_tokens | Firebase Auth (optional) |
| Farmer Profile | Profile, Edit Profile, Location | farmer_profiles, user_addresses | GPS / Nominatim |
| Farm Management | Manual Draw, Farm Result, Farm Detail, Saved Farms | farms, farm_coordinates | Google Maps, OSM Overpass |
| Crop Advisory | Crop Advisor, Sowing Calendar | crops, user_crops | NASA POWER |
| Disease Detection | Disease Scan, Disease Result | disease_reports, report_images | AI/ML Model (future), local dataset |
| Weather | Weather, Live Forecast, Historical, Alerts, Soil Data, NASA Surface, NASA Weather Hub, Surface Roughness | weather_logs, weather_alerts, soil_data_logs | OpenMeteo, NASA POWER, EONET |
| Irrigation | Irrigation Screen | irrigation_logs | OpenMeteo |
| Mandi / Market | Mandi Screen | mandi_price_cache, mandi_markets, price_alerts | data.gov.in AGMARKNET |
| Government Schemes | Govt Schemes | govt_schemes, scheme_categories, scheme_bookmarks | (local data + portal links) |
| Expert Help | Expert Help | expert_profiles, consultations, messages | FCM, Razorpay |
| Nearby Stores | Nearby Stores | store_listings | OSM Overpass API |
| Notifications | Notifications | notifications, device_tokens, preferences | Firebase FCM |
| Smart Tools | Smart Tools | (calculator only — client-side) | — |
| Voice Guide | Voice Guide | — | Expo Speech |
| Settings | Settings | user_notification_preferences, app_settings | — |
| Language | Language Select, Language Change | languages | — |
| Legal | Disclaimer, Privacy Policy, Terms | app_content, user_content_acceptances | — |
| Help & Support | Help & Support | faqs, support_tickets, ticket_messages | — |
| Analytics | — (utility) | analytics_events, analytics_sessions | Firebase Analytics |
| Marketplace | (future) | products, product_categories, product_images | — |
| Orders | (future) | marketplace_orders, order_items | Razorpay |
| Payments | (future) | payments | Razorpay / Stripe |
| Admin Panel | (web) | admin_activity_logs, banners, app_settings | FCM Admin |

---

## 3. Recommended Backend Stack

### Primary Stack (Recommended)
```
Runtime        Node.js 22 LTS (LTS support until 2027)
Framework      NestJS 10        — TypeScript, modular, DI, built-in OpenAPI docs
Database       PostgreSQL 16    — relational, JSONB, PostGIS, row-level security
ORM            TypeORM 0.3      — with PostgreSQL driver; migrations built-in
Cache          Redis 7          — session store, rate-limit counters, API cache
Auth           JWT (RS256)      — asymmetric keys; refresh token rotation
File Storage   AWS S3 / Cloudflare R2  — scalable binary storage
CDN            AWS CloudFront / Cloudflare — fast image delivery
Push Notifications Firebase Admin SDK (FCM)
Email          AWS SES          — transactional OTP / order emails
SMS OTP        Twilio / MSG91   — Indian mobile OTP delivery
Payments       Razorpay         — UPI, card, netbanking, COD support
Analytics      Firebase Analytics + PostHog (self-hosted) for custom events
Monitoring     Datadog / Grafana + Prometheus
Queue          BullMQ (Redis-backed) — async jobs: OTP, notifications, analytics
Search         PostgreSQL full-text search (PG tsvector) or Elasticsearch later
```

### Why NestJS over plain Express
| Criteria | Express | NestJS |
|---|---|---|
| TypeScript | Optional, manual | First-class, enforced |
| Architecture | Unstructured | Modular (controllers, services, guards) |
| Validation | Manual (Joi/Zod) | Built-in (class-validator decorators) |
| OpenAPI Docs | swagger-jsdoc | @nestjs/swagger auto-generates |
| Dependency Injection | Manual | Built-in IoC container |
| Testing | Manual setup | Jest integration built-in |

### Why PostgreSQL over MongoDB (current backend)
The app's data is **deeply relational**: farms → coordinates, orders → items → products → sellers, consultations → messages. PostgreSQL provides:
- Foreign key constraints (data integrity)
- PostGIS extension for geospatial farm queries
- JSONB for flexible fields (treatment plans, raw weather payloads) alongside structured columns
- Full-text search built-in (no extra service for search)
- ACID transactions (critical for payments, orders)

### Supabase as a Managed PostgreSQL Alternative
If the team wants a fully managed database + auto-generated REST APIs + realtime subscriptions, **Supabase** (managed PostgreSQL) is an excellent choice. It provides:
- Row Level Security (RLS) — database-level multi-tenancy
- Realtime subscriptions for consultation chat
- Auth module (can replace custom JWT)
- Storage module (can replace S3 for MVP)
- Auto-generated REST/GraphQL from schema

---

## 4. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│   React Native App (iOS + Android)   ·   Admin Web (React/Next.js)  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  HTTPS / TLS 1.3
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                 │
│            AWS API Gateway  ·  NGINX (rate-limit, SSL termination)  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│  NestJS API     │ │  NestJS API │ │  NestJS API     │
│  Instance 1     │ │  Instance 2 │ │  Instance N...  │
│  (ECS/K8s pod)  │ │             │ │  (auto-scale)   │
└────────┬────────┘ └──────┬──────┘ └────────┬────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
          ┌────────────────┼─────────────────────────┐
          ▼                ▼                          ▼
┌─────────────────┐ ┌─────────────┐      ┌───────────────────┐
│  PostgreSQL 16  │ │   Redis 7   │      │   BullMQ Worker   │
│  (Primary +     │ │  (Cache +   │      │  (async jobs:     │
│  Read Replica)  │ │  Sessions + │      │   OTP, FCM,       │
│  AWS RDS/       │ │  Rate Limit)│      │   analytics sync) │
│  Supabase       │ └─────────────┘      └───────────────────┘
└─────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  Firebase FCM   ·  AWS S3/R2   ·  Razorpay   ·  Twilio/MSG91   │
│  data.gov.in    ·  OpenMeteo   ·  NASA POWER  ·  OSM Overpass   │
│  AWS SES (email)·  Firebase Analytics         ·  Sentry (errors)│
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Design Overview

### Summary of All Tables

| # | Table | Purpose | Rows (est.) |
|---|---|---|---|
| 1 | `languages` | Supported UI languages | 4 |
| 2 | `users` | Core accounts (farmers, admins, experts) | 100K–1M |
| 3 | `user_otps` | OTP store with expiry | 1M/yr |
| 4 | `refresh_tokens` | JWT refresh token revocation list | 1M/yr |
| 5 | `farmer_profiles` | Extended farmer data (village, land) | 100K |
| 6 | `user_addresses` | Multiple addresses per user | 300K |
| 7 | `farms` | Saved farm boundaries | 200K |
| 8 | `farm_coordinates` | Individual polygon vertices | 5M |
| 9 | `crop_categories` | Kharif, Rabi, Zaid | 3 |
| 10 | `crops` | Master crop list | 20–50 |
| 11 | `user_crops` | Crops being farmed by user | 200K |
| 12 | `disease_reports` | Disease scan history | 500K |
| 13 | `disease_report_images` | Images attached to reports | 1M |
| 14 | `weather_logs` | Cached weather records | 10M/yr |
| 15 | `weather_alerts` | User weather alerts | 5M/yr |
| 16 | `soil_data_logs` | NASA soil data cache | 1M/yr |
| 17 | `irrigation_logs` | Irrigation advice history | 2M/yr |
| 18 | `mandi_markets` | Market reference data | 5K |
| 19 | `mandi_price_cache` | Mandi price data (refreshed daily) | 50K/day |
| 20 | `price_alerts` | User commodity price alerts | 100K |
| 21 | `scheme_categories` | Scheme classification | 5 |
| 22 | `govt_schemes` | Government scheme reference data | 50–100 |
| 23 | `scheme_bookmarks` | User-bookmarked schemes | 200K |
| 24 | `expert_profiles` | Expert extended profile | 200 |
| 25 | `expert_consultations` | Consultation records | 500K |
| 26 | `consultation_messages` | Chat messages per consultation | 5M |
| 27 | `store_listings` | OSM-sourced agri store data | 100K |
| 28 | `product_categories` | Marketplace category tree | 50 |
| 29 | `products` | Marketplace product listings | 50K |
| 30 | `product_images` | Product image gallery | 200K |
| 31 | `marketplace_orders` | Buyer orders | 1M/yr |
| 32 | `order_items` | Line items per order | 3M/yr |
| 33 | `payments` | Payment transaction records | 1M/yr |
| 34 | `device_tokens` | FCM device tokens | 500K |
| 35 | `notifications` | Push + in-app notification records | 10M/yr |
| 36 | `user_notification_preferences` | Per-user notification settings | 100K |
| 37 | `faq_categories` | FAQ section grouping | 10 |
| 38 | `faqs` | Frequently asked questions | 100 |
| 39 | `support_tickets` | User support requests | 50K/yr |
| 40 | `support_ticket_messages` | Ticket conversation thread | 200K/yr |
| 41 | `banners` | Home screen / app banners | 20 |
| 42 | `app_content` | Legal docs (Privacy, T&C, Disclaimer) | 4 |
| 43 | `user_content_acceptances` | Legal acceptance audit trail | 200K |
| 44 | `analytics_events` | Client event stream (partitioned) | 100M/yr |
| 45 | `analytics_sessions` | App session records | 10M/yr |
| 46 | `reviews` | Reviews for products, experts, stores | 500K |
| 47 | `file_uploads` | All uploaded file metadata | 2M |
| 48 | `admin_activity_logs` | Admin action audit trail | 100K/yr |
| 49 | `app_settings` | Key-value feature flags / config | 10 |

---

## 6. ER Diagram (Text)

```
AUTHENTICATION
━━━━━━━━━━━━━
users ──1:1──► farmer_profiles
users ──1:N──► user_otps
users ──1:N──► refresh_tokens
users ──1:N──► user_addresses
users ──1:1──► user_notification_preferences

FARM MANAGEMENT
━━━━━━━━━━━━━━━
users ──1:N──► farms
farms ──1:N──► farm_coordinates
farms ──1:N──► user_crops

CROP MANAGEMENT
━━━━━━━━━━━━━━━
crop_categories ──1:N──► crops
crops           ──1:N──► user_crops
users           ──1:N──► user_crops

DISEASE DETECTION
━━━━━━━━━━━━━━━━
users  ──1:N──► disease_reports
farms  ──1:N──► disease_reports
disease_reports ──1:N──► disease_report_images

WEATHER & ENVIRONMENT
━━━━━━━━━━━━━━━━━━━━
users ──1:N──► weather_logs
users ──1:N──► weather_alerts
users ──1:N──► soil_data_logs
users ──1:N──► irrigation_logs

MANDI / MARKET
━━━━━━━━━━━━━━
mandi_markets ──1:N──► mandi_price_cache
users         ──1:N──► price_alerts

GOVERNMENT SCHEMES
━━━━━━━━━━━━━━━━━━
scheme_categories ──1:N──► govt_schemes
users   ──M:N──► govt_schemes  (via scheme_bookmarks)

EXPERT CONSULTATIONS
━━━━━━━━━━━━━━━━━━━
users (farmer) ──1:N──► expert_consultations
users (expert) ──1:N──► expert_consultations
users          ──1:1──► expert_profiles
expert_consultations ──1:N──► consultation_messages

MARKETPLACE
━━━━━━━━━━━
product_categories ──1:N──► products
users (seller)     ──1:N──► products
products           ──1:N──► product_images
users (buyer)      ──1:N──► marketplace_orders
marketplace_orders ──1:N──► order_items
order_items        ──N:1──► products

PAYMENTS
━━━━━━━━
users               ──1:N──► payments
marketplace_orders  ──1:1──► payments
expert_consultations──1:1──► payments

NOTIFICATIONS
━━━━━━━━━━━━━
users ──1:N──► notifications
users ──1:N──► device_tokens

SUPPORT
━━━━━━━
users           ──1:N──► support_tickets
support_tickets ──1:N──► support_ticket_messages
faq_categories  ──1:N──► faqs

LEGAL / CONTENT
━━━━━━━━━━━━━━━
app_content ──M:N──► users (via user_content_acceptances)

ANALYTICS
━━━━━━━━━
users ──1:N──► analytics_events (partitioned by month)
users ──1:N──► analytics_sessions

FILES
━━━━━
users ──1:N──► file_uploads

LANGUAGES (Reference)
━━━━━━━━━━━━━━━━━━━━
languages ──1:N──► users (language_code FK)
```

---

## 7. Module Architecture & Folder Structure

```
backend/
├── src/
│   ├── main.ts                         # NestJS bootstrap, Swagger setup
│   ├── app.module.ts                   # Root module
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts      # /auth/register, login, otp, refresh, logout
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts     # Passport JWT strategy
│   │   │   │   └── refresh.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       ├── login.dto.ts
│   │   │       └── verify-otp.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── farmer-profiles/
│   │   ├── farms/
│   │   │   ├── farms.controller.ts     # CRUD + coord saving
│   │   │   └── entities/
│   │   │       ├── farm.entity.ts
│   │   │       └── farm-coordinate.entity.ts
│   │   │
│   │   ├── crops/
│   │   │   ├── crops.controller.ts     # /crops, /crops/advisor, /crops/sowing-calendar
│   │   │   └── advisor/
│   │   │       └── nasa-advisor.service.ts
│   │   │
│   │   ├── disease/
│   │   │   ├── disease.controller.ts   # /disease/scan, /disease/reports
│   │   │   └── ml/
│   │   │       └── disease-ml.service.ts  # AI model wrapper (future)
│   │   │
│   │   ├── weather/
│   │   │   ├── weather.controller.ts
│   │   │   └── providers/
│   │   │       ├── openmeteo.service.ts
│   │   │       └── nasa-power.service.ts
│   │   │
│   │   ├── mandi/
│   │   │   ├── mandi.controller.ts
│   │   │   └── providers/
│   │   │       └── agmarknet.service.ts    # data.gov.in API wrapper
│   │   │
│   │   ├── schemes/
│   │   ├── experts/
│   │   ├── consultations/
│   │   ├── stores/
│   │   │   └── providers/
│   │   │       └── overpass.service.ts     # OSM Overpass wrapper
│   │   │
│   │   ├── marketplace/
│   │   ├── orders/
│   │   ├── payments/
│   │   │   └── providers/
│   │   │       └── razorpay.service.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.controller.ts
│   │   │   └── providers/
│   │   │       └── fcm.service.ts          # Firebase Admin SDK
│   │   │
│   │   ├── analytics/
│   │   ├── support/
│   │   ├── content/                        # legal docs, FAQs
│   │   ├── uploads/
│   │   │   └── providers/
│   │   │       └── s3.service.ts
│   │   │
│   │   ├── settings/
│   │   └── admin/
│   │       ├── admin.module.ts
│   │       ├── users.admin.controller.ts
│   │       ├── banners.admin.controller.ts
│   │       ├── products.admin.controller.ts
│   │       ├── notifications.admin.controller.ts
│   │       ├── content.admin.controller.ts
│   │       ├── support.admin.controller.ts
│   │       └── analytics.admin.controller.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts      # @Roles('admin')
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Standard error shape
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts   # Wrap data in { success, data }
│   │   │   ├── logging.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── guards/
│   │   │   └── throttle.guard.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── enums/
│   │       ├── role.enum.ts
│   │       └── language.enum.ts
│   │
│   ├── database/
│   │   ├── migrations/                 # TypeORM migration files
│   │   ├── seeds/                      # Seed data (crops, schemes, languages)
│   │   └── database.module.ts
│   │
│   ├── queue/
│   │   ├── queue.module.ts             # BullMQ setup
│   │   ├── processors/
│   │   │   ├── otp.processor.ts
│   │   │   ├── notification.processor.ts
│   │   │   └── analytics.processor.ts
│   │   └── jobs/
│   │       ├── send-otp.job.ts
│   │       └── push-notification.job.ts
│   │
│   └── config/
│       ├── database.config.ts
│       ├── jwt.config.ts
│       ├── redis.config.ts
│       ├── aws.config.ts
│       ├── fcm.config.ts
│       └── razorpay.config.ts
│
├── database/
│   └── schema.sql                      # Full PostgreSQL schema
│
├── docs/
│   ├── BACKEND_ARCHITECTURE.md         # This file
│   └── API_DOCUMENTATION.md            # Full API reference
│
├── test/
│   ├── unit/
│   └── e2e/
│
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 8. Authentication & Security Design

### JWT Strategy
```
Access Token:  RS256, expires in 1 hour
Refresh Token: SHA-256 hashed, stored in DB, expires in 30 days
               Rotated on every use (single-use refresh tokens)

Flow:
1. Login → { access_token, refresh_token }
2. API calls use access_token in Authorization: Bearer header
3. When access_token expires → POST /auth/refresh with refresh_token
4. Refresh endpoint: verifies hash, issues new pair, revokes old refresh token
5. Logout → refresh_token revoked immediately
```

### OTP Design
```
- 6-digit numeric code
- Stored as bcrypt hash (never plain text)
- 5-minute expiry window
- Max 3 verification attempts before lock
- Rate limited: max 3 OTP sends per hour per contact
- Delivered via email (AWS SES) or SMS (MSG91/Twilio)
```

### Role-Based Access Control (RBAC)
```
farmer      — Default role. Access to own data only.
expert      — All farmer permissions + expert endpoints.
admin       — All farmer permissions + admin panel endpoints.
super_admin — Full access including admin management.
```

### Password Security
```
- bcrypt with cost factor 12
- Minimum 6 characters enforced at API level
- Password history: last 5 passwords cannot be reused
- Account locked after 10 failed login attempts (15-minute lockout)
```

---

## 9. Third-Party Integrations

| Service | Purpose | Cost | Integration Point |
|---|---|---|---|
| **OpenMeteo** | Current weather + 7-day forecast | Free | `weather.service.ts` |
| **NASA POWER** | Historical climate + soil data | Free | `nasa-power.service.ts` |
| **NASA EONET** | Natural disaster events | Free | `eonet.service.ts` |
| **data.gov.in (AGMARKNET)** | Live mandi prices | Free | `agmarknet.service.ts` |
| **OSM Overpass** | Nearby agri stores | Free | `overpass.service.ts` |
| **Nominatim** | Reverse geocoding | Free | `geocoding.service.ts` |
| **Firebase FCM** | Push notifications | Free tier | `fcm.service.ts` |
| **Firebase Analytics** | Event analytics | Free | Client-side SDK |
| **AWS S3 / Cloudflare R2** | File storage | ~$0.023/GB/month | `s3.service.ts` |
| **AWS SES** | Transactional email (OTP) | ~$0.10/1000 emails | `email.service.ts` |
| **MSG91 / Twilio** | SMS OTP | ~₹0.15/SMS | `sms.service.ts` |
| **Razorpay** | Payments (UPI, card, COD) | 2% per transaction | `razorpay.service.ts` |
| **Sentry** | Error tracking | Free tier | Global exception filter |
| **MapTiler / Google Maps** | Farm boundary map | Pay-per-use | Client-side SDK |

### Mandi Price Caching Strategy
```
- data.gov.in is queried at 06:00 IST daily (cron job)
- Results stored in mandi_price_cache table
- TTL: 24 hours
- Fallback: serve previous day's cache if API fails
- Client receives is_live=true/false flag to show data freshness
```

### Weather Caching Strategy
```
- OpenMeteo: cache current weather for 30 minutes per coordinate
- NASA POWER: cache climatology for 7 days per coordinate
- Redis key format: weather:current:{lat_2dp}:{lon_2dp}
```

---

## 10. Push Notification Architecture

### FCM Topic Strategy
```
Topics used (subscribed per user on login):
  weather-alerts-{state}     e.g. weather-alerts-gujarat
  market-alerts-{state}      e.g. market-alerts-gujarat
  crop-alerts-{crop_type}    e.g. crop-alerts-cotton
  lang-{code}                e.g. lang-gu
  user-{user_id}             e.g. user-abc123 (direct send)
  all-farmers                Broadcast to all
```

### Notification Flow
```
1. Admin triggers notification via POST /admin/notifications/send
2. NestJS queues FCM job in BullMQ
3. Worker sends to FCM HTTP v1 API
4. FCM delivers to devices
5. Notification saved to `notifications` table
6. On app open: client fetches GET /notifications
7. InAppNotification banner shown if foreground
```

### Notification Types & Channels (Android)
```
farmer-alerts  — MAX importance — cyclone, flood, extreme heat
weather-alerts — HIGH importance — daily forecast, rain warning
market-alerts  — DEFAULT — mandi price movements
crop-alerts    — HIGH — disease outbreak, pest alert
reminders      — DEFAULT — irrigation schedule, sowing window
```

---

## 11. File Upload Architecture

```
Client → POST /uploads (multipart) → NestJS
         ↓
    1. Validate: type (JPEG/PNG/WEBP), size (10MB max)
    2. Scan: ClamAV or cloud malware scan
    3. Resize: Sharp (resize images to max 1200px width)
    4. Upload: stream to AWS S3 (private bucket)
    5. CDN URL: generate CloudFront signed URL (public images)
               or presigned S3 URL (private documents)
    6. Record: INSERT into file_uploads table
    7. Return: { cdn_url, file_id }

Bucket Structure:
  s3://hanarad-files/
    avatars/{userId}/{uuid}.jpg
    farms/{farmId}/{uuid}.jpg
    disease/{reportId}/{uuid}.jpg
    products/{productId}/{seq}.jpg
    tickets/{ticketId}/{uuid}.pdf

CDN: CloudFront distribution → s3://hanarad-files (public prefix only)
```

---

## 12. Caching Strategy

| Data | Cache Layer | TTL | Invalidation |
|---|---|---|---|
| Current weather | Redis | 30 min | Time-based |
| 7-day forecast | Redis | 2 hours | Time-based |
| Mandi prices | PostgreSQL (cache table) | 24 hours | Daily cron refresh |
| Govt schemes list | Redis | 24 hours | On admin update |
| App settings / feature flags | Redis | 5 min | On admin update |
| Banners | Redis | 1 hour | On admin update |
| Legal content (Terms/Privacy) | Redis | 1 hour | On admin update |
| User profile | Redis | 15 min | On profile update |
| JWT blacklist | Redis | Token expiry time | On logout/refresh |

---

## 13. Scalability Design

### Database Scaling
```
Phase 1 (0–50K users):   Single PostgreSQL instance (RDS db.t3.medium)
Phase 2 (50K–500K users): Primary + 1 read replica (RDS Multi-AZ)
Phase 3 (500K+ users):    PgBouncer connection pooling + multiple read replicas

Partitioning:
  analytics_events    — PARTITION BY RANGE (occurred_at) monthly
  weather_logs        — PARTITION BY RANGE (recorded_date) quarterly
  notifications       — Archive to cold storage after 6 months

Archival:
  Compress and move to S3 (Parquet format) via pg_dump or AWS DMS
  Query with Athena for historical analytics
```

### API Scaling
```
Horizontal: ECS Fargate or Kubernetes
  - Each NestJS pod: 0.5 vCPU, 512MB RAM
  - Auto-scale on CPU > 60%
  - Target: 2–10 pods

CDN: CloudFront in front of API Gateway
  - Cache GET /crops, GET /schemes, GET /content/{type}
  - Cache-Control: public, max-age=3600

Rate Limiting: Redis-backed (express-rate-limit or @nestjs/throttler)
  - Auth endpoints: 10 req/15min per IP
  - OTP send: 3 req/hour per contact
  - API general: 300 req/min per authenticated user
  - Analytics ingest: 100 events/min per user
```

### Queue Design (BullMQ)
```
Queues:
  otp-queue          — Send OTP via email/SMS (retry: 3x, delay: 5s)
  notification-queue — FCM push (retry: 5x, backoff: exponential)
  analytics-queue    — Batch insert events (drain every 30s)
  email-queue        — Order confirmations, support replies
  mandi-refresh      — Daily mandi price fetch (cron: 06:00 IST)
  price-alerts       — Evaluate price thresholds after mandi refresh
```

---

## 14. Admin Panel Design

### Admin Web App (separate React/Next.js app)
```
Dashboard      — DAU, MAU, new users, top events, language split
Users          — Search, view, activate/deactivate, role change
Banners        — Create, schedule, target by placement
Products       — Moderation queue, approve/reject listings
Notifications  — Compose and broadcast (topic or targeted)
Content        — Edit disclaimer, privacy policy, terms, FAQs
Support        — Ticket queue, assign, reply, close
Analytics      — Event explorer, cohort analysis, funnel
App Settings   — Feature flags, min version, maintenance mode
```

### Admin Role Separation
```
super_admin — Can create/manage admin users
admin       — Full access except admin management
support     — Support tickets + user view only
content     — CMS (banners, legal) only
```

---

## 15. API Security Best Practices

### Input Validation
```typescript
// NestJS class-validator example
class RegisterDto {
  @IsString() @Length(2, 100)  name: string;
  @IsEmail()                   email: string;
  @Matches(/^\d{10}$/)         @IsOptional() phone?: string;
  @MinLength(6)                password: string;
}
```

### Injection Prevention
- All database queries through TypeORM query builder (parameterized)
- Never use raw string concatenation in SQL
- Helmet.js: sets secure HTTP headers (HSTS, CSP, X-Frame-Options)
- CORS: whitelist only app bundle identifier + admin domain

### Rate Limiting Implementation
```typescript
@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })  // 10 req/min
class AuthController { ... }

// OTP send: stricter
@Throttle({ default: { limit: 3, ttl: 3600000 } })  // 3/hour
@Post('send-otp') sendOtp() { ... }
```

### Sensitive Data Handling
- Passwords: bcrypt hash (cost 12), never logged or returned
- OTPs: bcrypt hash stored, plain OTP sent to email/SMS only
- Phone numbers: stored as-is but masked in logs (`98765***10`)
- Aadhar: never stored, only `aadhaar_verified` boolean
- JWT secret: RSA private key in AWS Secrets Manager
- All secrets in environment variables, never hardcoded

### File Upload Security
```
- Whitelist MIME types: image/jpeg, image/png, image/webp, application/pdf
- File size limit: 10 MB images, 5 MB PDFs
- ClamAV malware scan before storing to S3
- Content-Disposition: attachment for PDFs (no inline execution)
- S3 bucket: private by default, access via signed URLs
- Never serve user-uploaded files from the API domain (XSS risk)
```

---

## 16. Environment Configuration

```bash
# .env.example

# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=hanarad-db.rds.amazonaws.com
DB_PORT=5432
DB_NAME=hanarad_prod
DB_USER=hanarad_api
DB_PASSWORD=<secret>
DB_SSL=true

# Redis
REDIS_URL=redis://hanarad-redis.cache.amazonaws.com:6379

# JWT
JWT_PRIVATE_KEY=<RS256 private key>
JWT_PUBLIC_KEY=<RS256 public key>
JWT_ACCESS_EXPIRES=3600        # 1 hour
JWT_REFRESH_EXPIRES=2592000    # 30 days

# OTP
OTP_EXPIRY_SEC=300             # 5 minutes
OTP_MAX_ATTEMPTS=3

# Firebase
FIREBASE_PROJECT_ID=hanarad-app
FIREBASE_SERVICE_ACCOUNT_JSON=<JSON string>

# AWS
AWS_REGION=ap-south-1
AWS_S3_BUCKET=hanarad-files
AWS_CLOUDFRONT_DOMAIN=cdn.hanarad.com
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>

# Email (AWS SES)
SES_FROM_EMAIL=noreply@hanarad.com
SES_FROM_NAME=HANARAD Farmer-Companion

# SMS (MSG91)
MSG91_AUTH_KEY=<key>
MSG91_SENDER_ID=HNRD

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=<secret>

# External APIs
DATA_GOV_IN_API_KEY=<key>     # Mandi prices
MAPTILER_API_KEY=<key>        # Map tiles (used client-side)

# App
CORS_ORIGINS=hanarad://,https://admin.hanarad.com
BCRYPT_ROUNDS=12
```

---

## 17. Deployment Architecture

### Docker Setup
```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### docker-compose (Local Development)
```yaml
version: '3.9'
services:
  api:
    build: .
    ports: ["3000:3000"]
    depends_on: [postgres, redis]
    env_file: .env

  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: hanarad_dev
      POSTGRES_USER: hanarad
      POSTGRES_PASSWORD: dev_secret
    volumes: [pgdata:/var/lib/postgresql/data]
    ports: ["5432:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

### Production Deployment (AWS Recommended)
```
VPC:
  Public subnets:  API Gateway + Load Balancer
  Private subnets: ECS cluster + RDS + ElastiCache

Services:
  API:      ECS Fargate (2–10 tasks, auto-scale)
  DB:       RDS PostgreSQL Multi-AZ (db.t3.large → db.r6g.large at scale)
  Cache:    ElastiCache Redis (cache.t3.micro → cache.r6g.large)
  Queue:    BullMQ workers on ECS (separate task definition)
  Storage:  S3 + CloudFront
  Secrets:  AWS Secrets Manager
  Logs:     CloudWatch Logs + Datadog agent
  CI/CD:    GitHub Actions → ECR → ECS rolling deploy
  SSL:      AWS Certificate Manager
  DNS:      Route 53
```

---

## 18. Development Roadmap

### Phase 1 — Core MVP (8 weeks)
- [ ] Auth module (register, login, OTP, refresh, logout)
- [ ] Farmer profile CRUD
- [ ] Farm management (CRUD + coordinates)
- [ ] Weather proxy API (OpenMeteo + NASA POWER)
- [ ] Mandi price cache + daily refresh cron
- [ ] Government schemes (seed + list API)
- [ ] Push notifications (FCM topic subscribe/send)
- [ ] Legal content CRUD (admin)
- [ ] File uploads (avatar, disease scan image)
- [ ] Basic admin panel (user list, notification send)

### Phase 2 — Enhanced Features (6 weeks)
- [ ] Disease detection (symptom-based reports + image upload)
- [ ] Crop advisory AI (NASA POWER + recommendations)
- [ ] Sowing calendar + irrigation advisor API
- [ ] Expert consultations (booking + messaging)
- [ ] Nearby stores sync from OSM
- [ ] Support ticket system
- [ ] Analytics event ingestion + basic dashboard
- [ ] Multilingual FAQ system

### Phase 3 — Marketplace & Monetization (8 weeks)
- [ ] Product listings + moderation workflow
- [ ] Marketplace orders
- [ ] Razorpay payment integration
- [ ] Seller dashboard
- [ ] Reviews & ratings system
- [ ] Price alerts (mandi)
- [ ] Advanced admin analytics dashboard

### Phase 4 — AI & Scale (ongoing)
- [ ] AI disease image detection (TensorFlow Lite model or cloud ML API)
- [ ] Personalized crop recommendations (ML model)
- [ ] Weather-triggered automated notifications
- [ ] Database partitioning + read replicas
- [ ] Elasticsearch for product search
- [ ] Realtime consultation chat (WebSocket / Supabase Realtime)
