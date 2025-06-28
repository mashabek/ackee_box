# Ackee Box - Package Delivery API

A RESTful API for package delivery box management system, built with Node.js, TypeScript, Express, and PostgreSQL with PostGIS for geospatial operations.
## 📋 Results summary 

See [architecture.md](https://github.com/mashabek/ackee_box/blob/master/architecture.md) for a detailed requirements analysis of the first task.

### Metrics
- **Time Spent:** Architecture design + implementation - 8 hours, understanding the 
task - 2 hours.
- **Technologies Used:** Node.js, TypeScript, Express.js, Prisma, PostgreSQL, PostGIS, Docker, Jest
- **AI Tools:** GPT 4.1 in Cursor IDE for basic code generation and writing tests.  
Claude Sonnet 4 for generating mermaid diagrams, 
GPT o3 helped me to understand the task, but wasn't too good and also failed to understand the scope of the task.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Running with Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd ackee_box
```

2. **Start the application**
```bash
docker-compose up --build
```

It migh take up to a minute to spin up all instances and seed the database.

The API will be available at `http://localhost:3000`
The swagger docs are available at `http://localhost:3000/api-docs`

## 🔐 Authentication

All endpoints require JWT authentication. You can get a token in two ways:

### Option 1: Direct Test Token (Quick)
```bash
# Get test token directly
curl -X POST http://localhost:3000/mock-sso/test-token

# Use token in requests
curl -H "Authorization: Bearer <your-jwt-token>" \
     "http://localhost:3000/boxes/nearest?lat=50.087&lng=14.421&radius=1000"
```

### Option 2: Full OAuth Flow (Realistic)
1. **Start OAuth flow**: Visit `http://localhost:3000/auth/login` in your browser
2. **Complete login**: Fill in the mock SSO form and submit
3. **Copy bearer token**: From the JSON response, copy the `access_token`
4. **Use token**: Include in Authorization header for API requests

```bash
# Example with copied token
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     "http://localhost:3000/boxes/nearest?lat=50.087&lng=14.421&radius=1000"
```

## 📊 What's Implemented

### Core Features ✅
- **📍 Geospatial Box Search**: Find nearest delivery boxes with PostGIS indexing
- **🔒 Compartment Reservation System**: Prevents race conditions when multiple drivers target the same box with limited compartments. Drivers can reserve specific compartments with automatic timeout, ensuring exclusive access during delivery.
- **📦 Complete Delivery Workflow**: Reserve → Start → Complete delivery process  
- **📋 Order Management**: List and update order statuses
- **🔔 Background Processing**: Message queue for notifications and cleanup tasks. Includes automated cleanup job that monitors and releases expired reservations every 2 seconds.
Simple in memory queue was used, but in real world scenario I'd prefer to use Pub/Sub 
and Cloud Functions.
- **🔐 JWT Authentication**: Role-based access control (Driver/Customer roles)
- **📊 Real Data**: 11,000+ delivery boxes across Czech Republic

### API Endpoints

**Box Management**
- `GET /boxes/nearest` - Find boxes within radius (lat, lng, radius, size filter)
- `GET /boxes/search` - Search box by code
- `GET /boxes/:boxCode/compartments` - Check compartment availability

**Delivery Workflow**  
- `POST /deliveries/reserve` - Reserve compartment for delivery
- `POST /deliveries/start` - Open compartment (auto-reserves if needed)
- `POST /deliveries/complete` - Complete delivery & generate pickup PIN

**Order Management**
- `GET /orders` - List orders (optional status filter)
- `PATCH /orders/:id/status` - Update order status

**Authentication**
- `GET /auth/login` - OAuth2 login flow
- `POST /mock-sso/test-token` - Get test JWT token (demo only)

## 🧪 Testing

### Quick Test Examples
```bash
# 1. Get authentication token
TOKEN=$(curl -s -X POST http://localhost:3000/mock-sso/test-token | jq -r '.token')

# 2. Find nearby boxes in Prague
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/boxes/nearest?lat=50.087&lng=14.421&radius=2000"

# 3. Start delivery workflow
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1, "boxCode": "BOX_001"}' \
  http://localhost:3000/deliveries/start

# 4. Complete delivery
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId": 1}' \
  http://localhost:3000/deliveries/complete
```

### Run Integration Tests
```bash
npm test
```
## 📈 Performance & Scalability

- **Spatial Indexing**: PostGIS indexes for sub-second box searches
- **Concurrent Safety**: Compartment reservation system with atomic transactions prevents race conditions between multiple drivers
- **Background Processing**: Async notification system with simple queue
- **Auto-cleanup**: Expired reservations cleaned up automatically every 2 seconds
- **Scalable**: Handles 10-20+ concurrent drivers with 100k orders daily efficiently