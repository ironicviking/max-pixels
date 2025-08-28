# Docker Development Setup

This document explains how to use Docker Compose for Max-Pixels development.

## Quick Start

1. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start the development environment:**
   ```bash
   docker compose up -d
   ```

3. **View logs:**
   ```bash
   docker compose logs -f web
   ```

4. **Access the application:**
   - Web app: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

5. **Stop the environment:**
   ```bash
   docker compose down
   ```

## Environment Configuration

Max-Pixels uses environment variables for configuration. The `.env.example` file provides templates for all available settings:

### Required Configuration
- **Database Settings**: PostgreSQL connection details
- **Cache Settings**: Redis connection configuration 
- **Security**: JWT and session secrets (change in production!)

### Optional Configuration
- **Game Settings**: Player limits, tick rates, update intervals
- **Development**: Debug logging, development tools

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `APP_PORT` | Application port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Auto-generated |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `JWT_SECRET` | JWT signing secret | `dev-jwt-secret` |
| `SESSION_SECRET` | Session signing secret | `dev-session-secret` |
| `MAX_PLAYERS_PER_SECTOR` | Maximum players per game sector | `50` |
| `GAME_TICK_RATE` | Game update frequency (Hz) | `60` |
| `ENABLE_DEBUG_LOGGING` | Enable detailed logging | `true` |

**Security Note**: Always change `JWT_SECRET` and `SESSION_SECRET` in production environments!

## Services

### Web Application (`web`)
- **Port**: 3000
- **Technology**: Node.js with http-server
- **Features**: 
  - Hot-reloading for development with live file watching
  - Source code volume mounting for instant updates
  - Development environment variables and debugging
  - Health Check: Built-in HTTP endpoint monitoring
  - Service Dependencies: Waits for database and cache to be healthy

### PostgreSQL Database (`postgres`)
- **Port**: 5432
- **Database**: `maxpixels_dev`
- **Username**: `maxpixels_dev`
- **Password**: `dev_password_123`
- **Persistence**: Data stored in `postgres_data` volume
- **Health Check**: Built-in PostgreSQL health monitoring
- **Development Features**: Enhanced logging for debugging

### Redis Cache (`redis`)
- **Port**: 6379
- **Features**:
  - Persistent storage with AOF (Append Only File)
  - Future use for sessions and real-time multiplayer features
  - Data stored in `redis_data` volume
  - Health Check: Built-in Redis ping monitoring
  - Development Features: Verbose logging enabled

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

## Recent Improvements

✅ **Completed:**
- Health checks for all services (PostgreSQL, Redis, Web)
- Service dependency management with health check conditions
- Enhanced development logging and debugging
- Consistent environment variables across services
- Optimized Dockerfile with proper layer caching
- Comprehensive .dockerignore for faster builds

🔄 **Future Enhancements:**
- Production Docker configuration with multi-stage builds
- Environment-specific configurations (staging, production)
- Container resource limits and monitoring
- Automated database migrations on startup
- Load balancing for horizontal scaling