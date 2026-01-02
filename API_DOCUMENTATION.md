# 📡 API Documentation

Complete API reference for the Society Management App.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.vercel.app/api
```

## Authentication

Currently, the API does not require authentication headers. In production, add authentication by:

```typescript
// Example: Check JWT token
const token = req.headers.authorization?.split(" ")[1];
```

## Issues API

### List All Issues

```
GET /api/issues?society_id={societyId}&status={status}
```

**Parameters:**

- `society_id` (query, required): UUID of the society
- `status` (query, optional): 'open', 'in_progress', 'resolved', 'closed'

**Response:**

```json
[
  {
    "id": "uuid",
    "title": "Plumbing issue in Block A",
    "description": "Water leaking from bathroom",
    "status": "open",
    "priority": "high",
    "category": "Maintenance",
    "location": "Block A, 4th Floor",
    "reported_by": "uuid",
    "reported_by_user": {
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### Create New Issue

```
POST /api/issues
```

**Body:**

```json
{
  "society_id": "uuid",
  "title": "Electrical problem",
  "description": "Light not working in common area",
  "category": "Maintenance",
  "priority": "medium",
  "location": "Common Hall",
  "reported_by": "uuid",
  "assigned_to": "uuid (optional)"
}
```

**Response:** Returns created issue object with 201 status

**Error Responses:**

- `400`: Validation error - missing required fields
- `500`: Server error

---

## AMCs API

### List All AMCs

```
GET /api/amcs?society_id={societyId}
```

**Parameters:**

- `society_id` (query, required): UUID of the society

**Response:**

```json
[
  {
    "id": "uuid",
    "vendor_name": "ABC Plumbing Services",
    "service_type": "Plumbing",
    "contract_start_date": "2024-01-01",
    "contract_end_date": "2025-01-01",
    "annual_cost": 50000,
    "currency": "INR",
    "contact_person": "Raj Kumar",
    "contact_phone": "+919876543210",
    "status": "active",
    "renewal_reminder_days": 30,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### Create New AMC

```
POST /api/amcs
```

**Body:**

```json
{
  "society_id": "uuid",
  "vendor_name": "XYZ Electrical",
  "service_type": "Electrical Maintenance",
  "contract_start_date": "2024-02-01",
  "contract_end_date": "2025-02-01",
  "annual_cost": 75000,
  "currency": "INR",
  "contact_person": "Priya Singh",
  "contact_phone": "+919876543210",
  "email": "priya@xyzelectric.com",
  "renewal_reminder_days": 30,
  "notes": "Includes periodic inspection"
}
```

**Response:** Returns created AMC object with 201 status

---

## Assets API

### List All Assets

```
GET /api/assets?society_id={societyId}&status={status}&category={category}
```

**Parameters:**

- `society_id` (query, required): UUID of the society
- `status` (query, optional): 'active', 'inactive', 'maintenance', 'decommissioned'
- `category` (query, optional): 'Elevator', 'CCTV', 'Generator', 'Water Pump'

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Elevator - Block A",
    "category": "Elevator",
    "description": "Passenger elevator",
    "purchase_date": "2020-05-15",
    "warranty_expiry_date": "2025-05-15",
    "location": "Block A, Ground Floor",
    "asset_code": "AST-001",
    "status": "active",
    "last_maintenance_date": "2024-01-10",
    "next_maintenance_date": "2024-02-10",
    "maintenance_frequency": "monthly",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### Create New Asset

```
POST /api/assets
```

**Body:**

```json
{
  "society_id": "uuid",
  "name": "CCTV Camera - Gate",
  "category": "CCTV",
  "description": "4MP surveillance camera",
  "purchase_date": "2023-06-01",
  "warranty_expiry_date": "2025-06-01",
  "location": "Main Gate",
  "asset_code": "AST-005",
  "created_by": "uuid",
  "maintenance_frequency": "quarterly"
}
```

**Response:** Returns created asset object with 201 status

---

## Alerts API

### List All Alerts

```
GET /api/alerts?society_id={societyId}&status={status}
```

**Parameters:**

- `society_id` (query, required): UUID of the society
- `status` (query, optional): 'pending', 'sent', 'failed'

**Response:**

```json
[
  {
    "id": "uuid",
    "title": "AMC Expiry Alert - Plumbing",
    "message": "Plumbing AMC expires in 5 days",
    "alert_type": "amc_expiry",
    "severity": "warning",
    "delivery_status": "sent",
    "sent_at": "2024-01-15T09:00:00Z",
    "created_at": "2024-01-15T09:00:00Z"
  }
]
```

### Create and Send Alert

```
POST /api/alerts
```

**Body:**

```json
{
  "society_id": "uuid",
  "title": "Urgent: Elevator Maintenance",
  "message": "Elevator in Block A requires immediate maintenance",
  "alert_type": "asset_maintenance",
  "severity": "critical",
  "channels": ["whatsapp", "telegram"],
  "related_entity_type": "asset",
  "related_entity_id": "uuid"
}
```

**Response:**

```json
{
  "id": "uuid",
  "delivery_status": "sent",
  "sent_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Cron Jobs API

These endpoints are designed to be called by Vercel cron jobs, not by users directly.

### Check AMC Expiry

```
GET /api/crons/check-amc-expiry
Header: Authorization: Bearer {CRON_SECRET}
```

**Triggered:** Daily at 9 AM UTC

**Actions:**

- Checks for AMCs expiring within 30 days
- Sends WhatsApp/Telegram alerts
- Creates alert records

**Response:**

```json
{
  "success": true,
  "processed": 3
}
```

### Check Asset Maintenance

```
GET /api/crons/check-asset-maintenance
Header: Authorization: Bearer {CRON_SECRET}
```

**Triggered:** Daily at 10 AM UTC

**Actions:**

- Checks for upcoming asset maintenance
- Sends alerts to managers
- Updates maintenance records

**Response:**

```json
{
  "success": true,
  "processed": 2
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**

| Code | Meaning                        |
| ---- | ------------------------------ |
| 200  | Success                        |
| 201  | Created successfully           |
| 400  | Bad request (validation error) |
| 401  | Unauthorized                   |
| 404  | Not found                      |
| 500  | Server error                   |

---

## Request Examples

### Using cURL

```bash
# Create an issue
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{
    "society_id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Water leak",
    "description": "Bathroom flooding",
    "priority": "high",
    "reported_by": "user-uuid"
  }'

# List issues
curl "http://localhost:3000/api/issues?society_id=123e4567-e89b-12d3-a456-426614174000"
```

### Using Fetch (JavaScript)

```javascript
// Create AMC
const response = await fetch("/api/amcs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    society_id: "uuid",
    vendor_name: "XYZ Services",
    service_type: "Maintenance",
    contract_start_date: "2024-01-01",
    contract_end_date: "2025-01-01",
    annual_cost: 50000,
  }),
});

const data = await response.json();
console.log(data);
```

### Using Axios (TypeScript)

```typescript
import axios from "axios";

// Create asset
const createAsset = async () => {
  try {
    const response = await axios.post("/api/assets", {
      society_id: "uuid",
      name: "CCTV Camera",
      category: "CCTV",
      location: "Main Gate",
      created_by: "user-uuid",
    });
    console.log("Asset created:", response.data);
  } catch (error) {
    console.error("Error:", error.response.data);
  }
};
```

---

## Rate Limiting

Currently, there is no rate limiting. For production:

```typescript
// Add rate limiting middleware
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

---

## CORS Headers

For cross-origin requests from a different domain:

```typescript
// Add to your API route
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");
```

---

## Database Relationships

```
Issues → Users (reported_by, assigned_to)
Issues → Societies (society_id)
AMCs → Societies (society_id)
Assets → Societies (society_id)
Assets → AMCs (amc_id - optional)
Alerts → Societies (society_id)
```

---

## Pagination

For endpoints with many records, add pagination:

```typescript
// Example for future enhancement
GET /api/issues?society_id={id}&page=1&limit=10

Response includes:
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 10,
  "pages": 15
}
```

---

## Real-Time Updates

To add real-time updates (future enhancement):

```typescript
// Use Supabase Realtime
import { RealtimeClient } from "@supabase/realtime-js";

const subscription = supabase
  .from("issues")
  .on("*", (payload) => {
    console.log("Change:", payload);
  })
  .subscribe();
```

---

## Testing the API

### 1. Test Locally

```bash
npm run dev
# Go to http://localhost:3000
# Open DevTools → Network tab
# Perform actions and watch API calls
```

### 2. Use Postman

1. Import the API collection (can be generated from OpenAPI spec)
2. Set environment variables
3. Test each endpoint

### 3. Use cURL

```bash
curl -X GET "http://localhost:3000/api/issues?society_id=test"
```

---

## Troubleshooting API Issues

| Issue            | Solution                              |
| ---------------- | ------------------------------------- |
| 400 Error        | Check required fields in request body |
| 404 Not Found    | Verify the endpoint URL path          |
| 500 Server Error | Check server logs for details         |
| CORS Error       | Verify CORS headers (if cross-origin) |
| Database Error   | Verify Supabase credentials           |

---

## API Versioning

Currently v1 (implicit). For future versioning:

```
/api/v1/issues
/api/v2/issues
```

---

**API Documentation Complete** ✅

For implementation questions, check the actual route files in `/src/app/api/`
