# OrderFlow - Pizza Ordering System

A full-stack pizza ordering system built with Next.js frontend, NestJS backend, and PostgreSQL database, orchestrated with Docker Compose.

## 🏗️ Architecture

```
project-root/
├── frontend/          # Next.js React application
├── backend/           # NestJS API server
└── docker-compose.yml # Multi-container orchestration
```

### Tech Stack
- **Frontend**: Next.js 13, React 18
- **Backend**: NestJS 10, TypeScript
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload enabled for both frontend and backend

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

### Running with Docker (Recommended)

1. **Navigate to project:**
   ```bash
   cd project-root
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Local Development

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📁 Project Structure

### Frontend (`/frontend`)
```
frontend/
├── pages/           # Next.js pages (routing)
│   ├── index.js     # Home page with pizza ordering form
│   └── _app.js      # Next.js app wrapper
├── components/      # React components
├── package.json     # Dependencies and scripts
├── next.config.js   # Next.js configuration
└── Dockerfile       # Frontend container setup
```

### Backend (`/backend`)
```
backend/
├── src/            # Source code
│   ├── main.ts     # Application entry point
│   ├── app.module.ts # Root module
│   └── app.controller.ts # Basic API endpoints
├── package.json    # Dependencies and scripts
├── tsconfig.json   # TypeScript configuration
└── Dockerfile      # Backend container setup
```

## 🔧 Configuration

### Environment Variables
The application uses the following environment variables (configured in docker-compose.yml):

```env
# Database
POSTGRES_USER=pizza_user
POSTGRES_PASSWORD=pizza_pass
POSTGRES_DB=pizza_db

# Backend
DB_HOST=db
DB_PORT=5432
DB_USER=pizza_user
DB_PASS=pizza_pass
DB_NAME=pizza_db
```

### Ports
- **3000**: Frontend (Next.js)
- **3001**: Backend (NestJS)
- **5432**: Database (PostgreSQL)

## 🌟 Features

### Current Features
- **Pizza Ordering Form**: Simple form with pizza types, quantities, and special instructions
- **Backend API**: Basic NestJS endpoints with health check
- **Real-time Status**: Frontend checks backend connectivity
- **Docker Setup**: Complete containerized environment

### Planned Features (from repository rules)
1. **Order Placement** - Web-based ordering with validation
2. **Inventory Management** - Real-time stock tracking
3. **Kitchen Display** - Real-time order streaming via WebSocket
4. **POS Integration** - Physical store order entry
5. **Payment Processing** - Secure payment gateway integration
6. **Reporting** - Sales and inventory analytics
7. **User Management** - Authentication and authorization
8. **Order Management** - Cancellation and modification
9. **System Monitoring** - Health checks and error handling

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm run build
npm start
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 API Endpoints

### Backend API (http://localhost:3001)
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## 🆘 Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000, 3001, and 5432 are available
2. **Docker issues**: Run `docker-compose down -v` to clean up
3. **Build failures**: Check logs with `docker-compose logs [service-name]`

### Development Tips
- Use `docker-compose logs -f` to watch real-time logs
- Frontend auto-reloads on file changes
- Backend restarts automatically with ts-node

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker-compose up --build`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This is a development setup. For production deployment, additional security measures and environment-specific configurations are required. 