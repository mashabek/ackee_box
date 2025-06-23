# Ackee Box - Package Delivery API

A RESTful API for package delivery box management system, built with Node.js, TypeScript, Express, and PostgreSQL with PostGIS for geospatial operations.

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


## 📋 Results summary 

See `architecture.md` for detailed requirements analysis of the first task.

### Metrics
- **Time Spent:** ~6 hours
- **Technologies Used:** Node.js, TypeScript, Express.js, Prisma, PostgreSQL, PostGIS, Docker, Jest
- **AI Tools:** GPT 4.1 in Cursor IDE for basic code generation and writing tests

## 📊 Project Overview

### What's Implemented ✅
- **Geospatial Box Search**: Find nearest delivery boxes within specified radius
- **PostGIS Integration**: Efficient spatial queries with proper indexing
- **Docker Setup**: Complete containerization with PostGIS database
- **Tests**: Integration tests with realistic geographical data
- **Data Seeding**: 11,000+ delivery boxes across Czech Republic

## 🔌 API Documentation

### Quick Reference

**Base URL:** `http://localhost:3000`

**Current Endpoints:**
- `GET /boxes/nearest` - Find boxes within radius of location

### Quick Example
```bash
# Find boxes within 1km of Prague center
curl "http://localhost:3000/boxes/nearest?lat=50.087&lng=14.421&radius=1000"
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test
```

## 🏗️ Project Structure

```
ackee_box/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic layer
│   ├── models/          # TypeScript interfaces
│   ├── routes/          # API route definitions
│   └── index.ts         # Application entry point
├── tests/               # Integration tests
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Database seeding script
├── boxes.csv            # Source data (11K+ boxes)
├── docker-compose.yml   # Multi-container setup
├── Dockerfile           # Application container
└── architecture.md      # Detailed architecture analysis
```