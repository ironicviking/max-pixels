# Docker Development Setup

This document explains how to use Docker Compose for Max-Pixels development.

## Quick Start

1. **Start the development environment:**
   ```bash
   docker compose up -d
   ```

2. **View logs:**
   ```bash
   docker compose logs -f web
   ```

3. **Access the application:**
   - Web app: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

4. **Stop the environment:**
   ```bash
   docker compose down
   ```

## Services

### Web Application (`web`)
- **Port**: 3000
- **Technology**: Node.js with http-server
- **Features**: 
  - Hot-reloading for development
  - Source code volume mounting
  - Development environment variables

### PostgreSQL Database (`postgres`)
- **Port**: 5432
- **Database**: `maxpixels_dev`
- **Username**: `maxpixels_dev`
- **Password**: `dev_password_123`
- **Persistence**: Data stored in `postgres_data` volume

### Redis Cache (`redis`)
- **Port**: 6379
- **Features**:
  - Persistent storage with AOF
  - Future use for sessions and real-time features
  - Data stored in `redis_data` volume

## Development Workflow

1. **First time setup:**
   ```bash
   docker compose build
   docker compose up -d
   ```

2. **Daily development:**
   ```bash
   docker compose up -d
   # Your app is now running with hot-reload
   ```

3. **View application logs:**
   ```bash
   docker compose logs -f web
   ```

4. **Rebuild after dependency changes:**
   ```bash
   docker compose down
   docker compose build --no-cache web
   docker compose up -d
   ```

## Configuration Files

- `docker-compose.yml`: Main production-ready configuration
- `docker-compose.override.yml`: Development-specific overrides
- `Dockerfile`: Application container definition

## Troubleshooting

### Port Conflicts
If ports 3000, 5432, or 6379 are in use:
```bash
docker compose down
# Edit docker-compose.override.yml to change port mappings
docker compose up -d
```

### Database Connection Issues
```bash
# Reset PostgreSQL data
docker compose down -v
docker compose up -d
```

### Container Issues
```bash
# Rebuild containers
docker compose build --no-cache
docker compose up -d
```

## Future Enhancements

- Production Docker configuration
- Multi-stage builds for optimization
- Health checks for services
- Environment-specific configurations