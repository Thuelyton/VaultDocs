# API Specification - VaultDocs

## Overview

| Property | Value |
|----------|-------|
| **Base URL** | `https://api.vaultdocs.app/api/v1` |
| **Version** | v1 |
| **Format** | JSON |
| **Authentication** | Bearer Token (JWT) |
| **Rate Limit** | 100 requests/minute (authenticated) |

---

## Resources

### User
| Field | Type | Description |
|-------|------|-------------|
| `id` | ObjectId | Unique identifier |
| `name` | String | User's full name (2-100 chars) |
| `email` | String | User's email (unique, lowercase) |
| `avatar` | String \| null | Profile avatar URL |
| `createdAt` | ISO 8601 | Account creation timestamp |
| `updatedAt` | ISO 8601 | Last update timestamp |

### Document
| Field | Type | Description |
|-------|------|-------------|
| `id` | ObjectId | Unique identifier |
| `userId` | ObjectId | Owner's user ID |
| `title` | String | Document title (max 255 chars) |
| `category` | Enum | Document type (see categories) |
| `file` | Object | File metadata (see File) |
| `extractedData` | Object | OCR/IA extracted data (flexible) |
| `expirationDate` | ISO 8601 | Document expiration date |
| `notifications` | Array | Notification schedule |
| `status` | Enum | Document status |
| `createdAt` | ISO 8601 | Creation timestamp |
| `updatedAt` | ISO 8601 | Last update timestamp |

### Document Categories
| Value | Description |
|-------|-------------|
| `cnh` | Carteira Nacional de Habilitação |
| `rg` | Registro Geral |
| `boleto` | Boleto de pagamento |
| `contrato` | Contrato |
| `garantia` | Certificado de garantia |
| `outros` | Outros documentos |

### Document Status
| Value | Description |
|-------|-------------|
| `active` | Document is active |
| `archived` | Document has been archived (soft deleted) |
| `expired` | Document has expired |

### File
| Field | Type | Description |
|-------|------|-------------|
| `storageKey` | String | R2 storage path |
| `originalName` | String | Original filename |
| `mimeType` | String | MIME type |
| `sizeBytes` | Number | File size in bytes |

### Notification
| Field | Type | Description |
|-------|------|-------------|
| `daysBefore` | Number | Days before expiration to notify (0-365) |
| `sent` | Boolean | Whether notification was sent |
| `sentAt` | ISO 8601 \| undefined | When notification was sent |

### Allowed MIME Types
- `image/jpeg`
- `image/png`
- `image/webp`
- `application/pdf`

### Max File Size
- **10 MB**

---

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Access:** Public

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ✅ | User's name (2-100 chars) |
| `email` | String | ✅ | Valid email address |
| `password` | String | ✅ | Min 6 characters |

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com",
      "avatar": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `400` | Missing required fields: name, email, password |
| `400` | Password must be at least 6 characters |
| `409` | Email already registered |

---

#### Login User
```http
POST /auth/login
```

**Access:** Public

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | String | ✅ | Registered email |
| `password` | String | ✅ | User password |

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com",
      "avatar": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `400` | Missing required fields: email, password |
| `401` | Invalid email or password |

---

#### Get Current User
```http
GET /auth/me
```

**Access:** Private (Bearer Token required)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "João Silva",
    "email": "joao@example.com",
    "avatar": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `401` | No authentication token provided |
| `401` | Invalid or expired token |
| `404` | User not found |

---

### Documents

#### Create Document
```http
POST /documents
```

**Access:** Private

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ | Document title |
| `category` | Enum | ✅ | One of: cnh, rg, boleto, contrato, garantia, outros |
| `file` | Object | ✅ | File metadata object |
| `file.storageKey` | String | ✅ | R2 storage key from upload |
| `file.mimeType` | String | ✅ | File MIME type |
| `file.sizeBytes` | Number | ✅ | File size in bytes |
| `file.originalName` | String | ✅ | Original filename |
| `expirationDate` | ISO 8601 | ✅ | Must be in the future |
| `extractedData` | Object | ❌ | OCR/IA extracted data |
| `notifications` | Array | ❌ | Notification schedule |

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "CNH João Silva",
    "category": "cnh",
    "file": {
      "storageKey": "uploads/2024/01/1705312200000-a1b2c3d4e5f6.jpg",
      "originalName": "cnh_frente.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 1048576
    },
    "extractedData": {
      "cpf": "123.456.789-00",
      "nome": "João Silva",
      "emissor": "DETRAN-SP"
    },
    "expirationDate": "2025-01-15T00:00:00.000Z",
    "notifications": [
      { "daysBefore": 30, "sent": false },
      { "daysBefore": 7, "sent": false }
    ],
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `400` | Missing required fields: title, category, file, expirationDate |
| `400` | Expiration date must be in the future |

---

#### List Documents
```http
GET /documents
```

**Access:** Private

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | Enum | - | Filter by status (active, archived, expired) |
| `category` | Enum | - | Filter by category |
| `search` | String | - | Full-text search on title |
| `expiringBefore` | ISO 8601 | - | Documents expiring before this date |
| `page` | Number | 1 | Page number |
| `limit` | Number | 10 | Items per page (max 100) |

**Response:** `200 OK`
```json
{
  "status": "success",
  "documents": [
    {
      "id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "title": "CNH João Silva",
      "category": "cnh",
      "file": {
        "storageKey": "uploads/2024/01/1705312200000-a1b2c3d4e5f6.jpg",
        "originalName": "cnh_frente.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 1048576
      },
      "extractedData": {},
      "expirationDate": "2025-01-15T00:00:00.000Z",
      "notifications": [],
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### Get Document by ID
```http
GET /documents/:id
```

**Access:** Private

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | Document ID |

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "title": "CNH João Silva",
    "category": "cnh",
    "file": {
      "storageKey": "uploads/2024/01/1705312200000-a1b2c3d4e5f6.jpg",
      "originalName": "cnh_frente.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 1048576
    },
    "extractedData": {
      "cpf": "123.456.789-00",
      "nome": "João Silva"
    },
    "expirationDate": "2025-01-15T00:00:00.000Z",
    "notifications": [
      { "daysBefore": 30, "sent": true, "sentAt": "2024-12-16T10:00:00.000Z" }
    ],
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `400` | Invalid ID format |
| `404` | Document not found |

---

#### Update Document
```http
PUT /documents/:id
```

**Access:** Private

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | Document ID |

**Request Body (all optional):**
| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Updated title |
| `category` | Enum | Updated category |
| `expirationDate` | ISO 8601 | Updated expiration date |
| `extractedData` | Object | Updated extracted data |
| `status` | Enum | Update status (active, archived, expired) |

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "CNH João Silva - Atualizada",
    "category": "cnh",
    "status": "active",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `400` | Invalid ID format |
| `404` | Document not found |

---

#### Delete Document (Archive)
```http
DELETE /documents/:id
```

**Access:** Private

**Description:** Soft deletes by setting status to `archived`.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | Document ID |

**Response:** `204 No Content`

**Errors:**
| Status | Message |
|--------|---------|
| `400` | Invalid ID format |
| `404` | Document not found |

---

#### Get Document Statistics
```http
GET /documents/stats
```

**Access:** Private

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "byStatus": {
      "active": 15,
      "archived": 3,
      "expired": 2
    },
    "byCategory": {
      "cnh": 2,
      "rg": 1,
      "boleto": 5,
      "contrato": 3,
      "garantia": 2,
      "outros": 2
    }
  }
}
```

---

#### Get Expiring Documents
```http
GET /documents/expiring
```

**Access:** Private

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | Number | 30 | Days ahead to check |

**Response:** `200 OK`
```json
{
  "status": "success",
  "count": 5,
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Boleto Energia",
      "category": "boleto",
      "expirationDate": "2024-02-01T00:00:00.000Z",
      "status": "active",
      "notifications": [
        { "daysBefore": 30, "sent": false }
      ]
    }
  ]
}
```

---

### Upload

#### Upload File
```http
POST /upload
```

**Access:** Private

**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | File to upload (max 10MB) |

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "storageKey": "uploads/2024/01/1705312200000-a1b2c3d4e5f6.jpg",
    "originalName": "cnh_frente.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 1048576,
    "publicUrl": "https://pub-xxx.r2.dev/uploads/2024/01/1705312200000-a1b2c3d4e5f6.jpg"
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `400` | No file provided. Use field name: file |
| `400` | File size exceeds limit of 10MB |
| `400` | File type {mimetype} is not allowed |
| `500` | Failed to upload file to storage |

---

#### Upload and Create Document
```http
POST /upload/document
```

**Access:** Private

**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | File to upload |
| `title` | String | ✅ | Document title |
| `category` | String | ✅ | Document category |
| `expirationDate` | String | ✅ | ISO 8601 date |
| `extractedData` | String | ❌ | JSON string of extracted data |

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "document": {
      "id": "507f1f77bcf86cd799439013",
      "userId": "507f1f77bcf86cd799439011",
      "title": "CNH João Silva",
      "category": "cnh",
      "file": {
        "storageKey": "uploads/2024/01/1705312200000-a1b2c3d4e5f6.jpg",
        "originalName": "cnh_frente.jpg",
        "mimeType": "image/jpeg",
        "sizeBytes": 1048576
      },
      "expirationDate": "2025-01-15T00:00:00.000Z",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "file": {
      "publicUrl": "https://pub-xxx.r2.dev/uploads/2024/01/..."
    }
  }
}
```

**Errors:**
| Status | Message |
|--------|---------|
| `400` | No file provided |
| `400` | Missing required fields: title, category, expirationDate |

---

#### Delete File
```http
DELETE /upload/:storageKey
```

**Access:** Private

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `storageKey` | String | URL-encoded storage key |

**Response:** `204 No Content`

**Errors:**
| Status | Message |
|--------|---------|
| `400` | Storage key is required |
| `500` | Failed to delete file from storage |

---

### Health Check

#### API Health
```http
GET /health
```

**Access:** Public

**Response:** `200 OK`
```json
{
  "status": "ok",
  "version": "v1",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Authentication

### JWT Token Format

**Header:**
```
Authorization: Bearer <token>
```

**Token Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "joao@example.com",
  "iat": 1705312200,
  "exp": 1705917000
}
```

**Token Expiration:** 7 days

### Authentication Flow

```
┌─────────────┐     POST /auth/register      ┌─────────────┐
│   Mobile    │ ────────────────────────────► │    API      │
│    App      │ ◄──────────────────────────── │  (Express)  │
└─────────────┘      { user, token }          └─────────────┘
       │
       │  Store token securely
       │
       ▼
┌─────────────┐     GET /documents            ┌─────────────┐
│   Mobile    │ ────────────────────────────► │    API      │
│    App      │   Header: Bearer <token>      │  (Express)  │
└─────────────┘ ◄──────────────────────────── └─────────────┘
                     { documents[] }
```

### Security Rules

1. **All document routes require authentication** except `/health` and `/auth/*`
2. **User isolation**: Each user can only access their own documents
3. **Token validation**: Invalid/expired tokens return `401`
4. **Password hashing**: bcrypt with salt rounds = 12
5. **Password exclusion**: Passwords are never returned in responses

---

## Request Examples

### cURL

**Register:**
```bash
curl -X POST https://api.vaultdocs.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "minha123"
  }'
```

**Login:**
```bash
curl -X POST https://api.vaultdocs.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "minha123"
  }'
```

**List Documents:**
```bash
curl -X GET "https://api.vaultdocs.app/api/v1/documents?status=active&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Create Document:**
```bash
curl -X POST https://api.vaultdocs.app/api/v1/documents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CNH João Silva",
    "category": "cnh",
    "file": {
      "storageKey": "uploads/2024/01/abc123.jpg",
      "originalName": "cnh.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 1048576
    },
    "expirationDate": "2025-06-15T00:00:00.000Z",
    "extractedData": {
      "cpf": "123.456.789-00",
      "nome": "João Silva"
    }
  }'
```

**Upload File:**
```bash
curl -X POST https://api.vaultdocs.app/api/v1/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "file=@./documento.pdf"
```

**Upload and Create Document:**
```bash
curl -X POST https://api.vaultdocs.app/api/v1/upload/document \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "file=@./contrato.pdf" \
  -F "title=Contrato de Aluguel" \
  -F "category=contrato" \
  -F "expirationDate=2025-12-31T00:00:00.000Z"
```

---

## Response Examples

### Success Response (Single Item)
```json
{
  "status": "success",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Documento",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Success Response (Paginated List)
```json
{
  "status": "success",
  "documents": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Success Response (No Content)
```
HTTP/1.1 204 No Content
```

### Error Response
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Missing required fields: title, category, file, expirationDate"
}
```

### Error Response (Development)
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "stack": "Error: ...\n    at ..."
}
```

---

## Error Codes Reference

| Status | Description | Common Causes |
|--------|-------------|---------------|
| `400` | Bad Request | Missing fields, invalid data, validation errors |
| `401` | Unauthorized | Invalid/missing token, wrong credentials |
| `404` | Not Found | Resource doesn't exist or user has no access |
| `409` | Conflict | Duplicate email, constraint violation |
| `413` | Payload Too Large | File exceeds 10MB limit |
| `415` | Unsupported Media Type | Invalid file type |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

---

## Versioning

- **Current Version:** v1
- **Version in URL:** `/api/v1/`
- **Breaking Changes:** Will increment to v2
- **Deprecation Policy:** 6 months notice before removal

---

## Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Authenticated | 100 requests | 1 minute |
| Unauthenticated | 20 requests | 1 minute |

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312260
```

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- User authentication (register, login, profile)
- Document CRUD operations
- File upload to Cloudflare R2
- Pagination and filtering
- Document statistics
- Expiring documents endpoint
