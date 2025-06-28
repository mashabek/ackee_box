# Ackee Box - Package Delivery API

A RESTful API for package delivery box management system, built with Node.js, TypeScript, Express, and PostgreSQL with PostGIS for geospatial operations.
## 📋 Results summary 

See [architecture.md](https://github.com/mashabek/ackee_box/blob/master/architecture.md) for a detailed requirements analysis of the first task.

### Metrics
- **Time Spent:** 9 hours
- **Technologies Used:** Node.js, TypeScript, Express.js, Prisma, PostgreSQL, PostGIS, Docker, Jest
- **AI Tools:** GPT 4.1 in Cursor IDE for basic code generation and writing tests.  
Claude Sonnet 4 for generating mermaid diagrams
- **Assumptions:** Based on the task, I focused on the nearest boxes endpoint implementation. It is a production ready implementation since it easily scalable and uses spatial index for quick retrieval. This should easily cover 10-20 drivers requesting box locations at the same time. 

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

All endpoints require JWT authentication. For testing, use the mock SSO:

```bash
# Get test token
curl -X POST http://localhost:3000/mock-sso/test-token

# Use token in requests
curl -H "Authorization: Bearer <your-jwt-token>" \
     "http://localhost:3000/boxes/nearest?lat=50.087&lng=14.421&radius=1000"
```

## 📊 What's Implemented

### Core Features ✅
- **📍 Geospatial Box Search**: Find nearest delivery boxes with PostGIS indexing
- **📦 Complete Delivery Workflow**: Reserve → Start → Complete delivery process  
- **📋 Order Management**: List and update order statuses
- **🔔 Background Processing**: Message queue for notifications and cleanup tasks
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

## 🏗️ Architecture

- **Controllers**: HTTP request handlers with Swagger documentation
- **Services**: Business logic layer 
- **Repositories**: Data access layer with Prisma ORM
- **Background Queue**: Simple message queue for notifications and cleanup
- **PostGIS**: Spatial database for efficient geolocation queries
- **Role-based Auth**: JWT with Driver/Customer role separation

## 📈 Performance & Scalability

- **Spatial Indexing**: PostGIS indexes for sub-second box searches
- **Background Processing**: Async notification system with simple queue
- **Auto-cleanup**: Expired reservations cleaned up automatically
- **Production Ready**: Handles 10-20+ concurrent drivers efficiently