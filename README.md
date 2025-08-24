# JAXChange - Jamaican Cryptocurrency Platform

A simplified cryptocurrency purchase platform specifically for Jamaican residents.

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb jaxchange
   
   # Run migrations
   psql -d jaxchange -f src/shared/database/migrations/001_create_users_table.sql
   psql -d jaxchange -f src/shared/database/migrations/002_create_transactions_table.sql
   psql -d jaxchange -f src/shared/database/migrations/003_create_exchanges_table.sql
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/health

### Using Docker

1. **Start all services**
   ```bash
   cd docker
   docker-compose up -d
   ```

2. **Development with live reload**
   ```bash
   docker-compose --profile development up -d
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

## Testing

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm test -- --watch
```

## Project Structure

```
src/
├── services/           # Microservices
│   ├── user-management/
│   ├── exchange-integration/
│   ├── payment-processing/
│   ├── wallet-management/
│   ├── compliance/
│   ├── notification/
│   └── analytics/
├── shared/            # Shared utilities
│   ├── database/
│   ├── middleware/
│   ├── types/
│   └── utils/
├── config/           # Configuration
└── tests/           # Test files
```

## Features

### MVP (Current)
- ✅ User registration and authentication
- ✅ User profile management
- ✅ PostgreSQL database with migrations
- ✅ Redis caching and session management
- ✅ Comprehensive API documentation
- ✅ Docker containerization
- ✅ Testing framework setup

### Planned Features
- KYC verification integration
- Cryptocurrency trading (BTC, ETH, XRP, LTC)
- Payment processing (Jamaican banks)
- Real-time price feeds
- Mobile application (React Native)
- Web application (Next.js)

## Environment Variables

See `.env.example` for all configuration options including:
- Database connections
- JWT secrets
- Exchange API keys
- Payment processor keys
- KYC service credentials.

## Contributing

1. Follow the project structure and conventions
2. Write tests for new features
3. Update API documentation
4. Follow security best practices

## License

Proprietary - JAXChange Platform