---
layout: default
title: API Reference
---

# API Reference

Complete documentation for all API endpoints.

## Base URL

```
http://localhost:3000/api  (Development)
https://your-domain.vercel.app/api  (Production)
```

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@test.com",
    "full_name": "Admin Test User",
    "role": "admin",
    "society_id": "123e4567-e89b-12d3-a456-426614174000",
    "is_active": true
  }
}
```

**Errors**:
- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account disabled

---

### POST /api/auth/signup

Create new user account.

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securepass123",
  "full_name": "New User",
  "phone": "+1234567890",
  "society_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response** (201):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { /* user object */ }
}
```

---

### GET /api/auth/me

Get current authenticated user.

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@test.com",
  "full_name": "Admin Test User",
  "role": "admin",
  "society_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## 📋 AMC Endpoints

### GET /api/amcs

Get all AMCs (filtered by society if provided).

**Query Parameters**:
- `society_id` (optional): UUID of society

**Response** (200):
```json
[
  {
    "id": "uuid",
    "society_id": "uuid",
    "vendor_name": "Star Cool",
    "service_type": "AC Maintenance",
    "contract_start_date": "2026-01-01",
    "contract_end_date": "2027-01-01",
    "annual_cost": 50000,
    "currency": "INR",
    "contact_person": "John Doe",
    "contact_phone": "9876543210",
    "email": "contact@vendor.com",
    "status": "active",
    "created_at": "2026-01-02T10:30:00Z"
  }
]
```

---

### POST /api/amcs

Create new AMC (sends email alert if expiring soon).

**Request Body**:
```json
{
  "society_id": "uuid",
  "vendor_name": "Star Cool",
  "service_type": "AC Maintenance",
  "contract_start_date": "2026-01-01",
  "contract_end_date": "2027-01-01",
  "annual_cost": 50000,
  "currency": "INR",
  "contact_person": "John Doe",
  "contact_phone": "9876543210",
  "email": "contact@vendor.com"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  /* ... all AMC fields ... */
}
```

**Auto-Alert**: If contract expires within 30 days, emails all society admins.

---

## 🏢 Assets Endpoints

### GET /api/assets

Get all assets.

**Query Parameters**:
- `society_id` (optional): Filter by society

**Response** (200):
```json
[
  {
    "id": "uuid",
    "society_id": "uuid",
    "name": "Elevator - Tower A",
    "asset_type": "Equipment",
    "location": "Tower A Lobby",
    "purchase_date": "2020-05-15",
    "warranty_expiry": "2025-05-15",
    "current_value": 500000,
    "status": "operational",
    "created_at": "2026-01-02T10:30:00Z"
  }
]
```

---

### POST /api/assets

Create new asset.

**Request Body**:
```json
{
  "society_id": "uuid",
  "name": "CCTV Camera - Gate 1",
  "asset_type": "Security",
  "location": "Main Gate",
  "purchase_date": "2026-01-01",
  "warranty_expiry": "2028-01-01",
  "current_value": 25000,
  "status": "operational"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  /* ... all asset fields ... */
}
```

---

## 🐛 Issues Endpoints

### GET /api/issues

Get all issues.

**Query Parameters**:
- `society_id` (optional): Filter by society
- `status` (optional): Filter by status (open, in_progress, resolved)

**Response** (200):
```json
[
  {
    "id": "uuid",
    "society_id": "uuid",
    "title": "Water Leak in Basement",
    "description": "Severe water leakage observed",
    "category": "Plumbing",
    "priority": "high",
    "status": "open",
    "reported_by": "user-uuid",
    "assigned_to": null,
    "created_at": "2026-01-02T10:30:00Z"
  }
]
```

---

### POST /api/issues

Report new issue.

**Request Body**:
```json
{
  "society_id": "uuid",
  "title": "Broken Water Pump",
  "description": "Water pump in Tower B not working",
  "category": "Maintenance",
  "priority": "high",
  "reported_by": "user-uuid"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  /* ... all issue fields ... */
}
```

---

## 👥 Users Endpoints

### GET /api/users

Get all users (Admin only).

**Headers**: `Authorization: Bearer <admin-token>`

**Query Parameters**:
- `society_id` (optional): Filter by society

**Response** (200):
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "manager",
    "society_id": "uuid",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

### PUT /api/auth/update-role

Update user role (Admin only).

**Request Body**:
```json
{
  "userId": "target-user-uuid",
  "role": "manager"
}
```

**Response** (200):
```json
{
  "message": "Role updated successfully"
}
```

---

## 📧 Alerts Endpoints

### GET /api/alerts

Get all alerts for a society.

**Query Parameters**:
- `society_id` (required): UUID of society

**Response** (200):
```json
[
  {
    "id": "uuid",
    "society_id": "uuid",
    "title": "AMC Expiry Alert - Star Cool",
    "message": "The AMC for AC Service from Star Cool is expiring on 1/2/2026",
    "alert_type": "amc_expiry",
    "severity": "warning",
    "delivery_status": "sent",
    "sent_at": "2026-01-02T10:30:00Z"
  }
]
```

---

## 🔄 Cron Endpoints

### GET /api/crons/check-amc-expiry

Check for expiring AMCs and send alerts (called by scheduled cron).

**Headers**: `Authorization: Bearer <cron-secret>`

**Response** (200):
```json
{
  "message": "AMC expiry check completed",
  "checked": 5,
  "alerted": 2
}
```

---

### GET /api/crons/check-asset-maintenance

Check for asset maintenance due and send alerts.

**Headers**: `Authorization: Bearer <cron-secret>`

**Response** (200):
```json
{
  "success": true,
  "processed": 3
}
```

---

## Error Responses

All endpoints follow consistent error format:

```json
{
  "error": "Error message description"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently not implemented. Consider adding for production.

## Pagination

Currently returns all results. Consider implementing pagination for large datasets:

```
?page=1&limit=20
```

---

[← Authentication](authentication) | [Next: Configuration →](configuration)
