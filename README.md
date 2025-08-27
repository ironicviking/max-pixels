# Max-Pixels: Space Exploration Trading Game

A web-based multiplayer space exploration and trading game built entirely with code-generated graphics.

## 🚀 Game Overview

Max-Pixels is an ambitious browser-based game that combines space exploration, trading mechanics, and social gameplay in an ever-expanding universe. Players navigate through space, discover new territories, establish trading routes, and build relationships with other players in a persistent online world.

### Key Features

- **Pure Code-Generated Graphics**: No game engines or external frameworks - everything is built with SVG graphics
- **Multiplayer-First Design**: Built from the ground up for multiplayer with robust authentication and social features
- **Expanding Universe**: New areas, levels, and content added weekly to keep the experience fresh
- **Space Trading Economy**: Complex trading systems with supply/demand mechanics
- **Exploration Rewards**: Discover new sectors, resources, and trading opportunities

## 🛠 Technical Approach

### Technology Stack
- **Frontend**: Web-based with SVG graphics generated in-browser or pre-generated
- **Graphics**: No Unity or game engines - pure algorithmic/procedural graphics generation
- **Architecture**: Client-server multiplayer architecture
- **Real-time**: WebSocket-based real-time communication for multiplayer features

### Core Systems Required
- Authentication and user management
- Friend lists and social features
- Real-time multiplayer synchronization
- Space navigation and physics
- Trading and economy systems
- Procedural content generation
- Weekly content deployment pipeline

## 🎮 Gameplay Mechanics

### Space Exploration
- Navigate through procedurally generated star systems
- Discover planets, asteroids, and space stations
- Unlock new regions through exploration achievements

### Trading System
- Buy and sell resources across different star systems
- Dynamic market prices based on supply and demand
- Trade route optimization for maximum profit
- Cargo management and ship upgrades

### Social Features
- Friend lists and player communication
- Cooperative exploration missions
- Trading partnerships and alliances
- Leaderboards and achievements

## 📈 Development Roadmap

### Phase 1: Foundation
- Basic web infrastructure and authentication
- SVG graphics rendering system
- Basic space navigation
- Initial multiplayer networking
- docker-compose dev environment

### Phase 2: Core Gameplay
- Trading system implementation
- Player progression mechanics
- Friend lists and social features
- Basic procedural content generation

### Phase 3: Expansion
- Weekly content deployment system
- Advanced trading mechanics
- Guild/alliance systems
- Competitive gameplay modes

## 🔧 Getting Started

### Development Setup

#### Option 1: Docker (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd max-pixels

# Start the development environment
docker-compose up -d

# Access the game at http://localhost:3000
```

The Docker setup includes:
- Web application server on port 3000
- PostgreSQL database on port 5432 (for future multiplayer features)
- Redis cache on port 6379 (for session management)

#### Option 2: Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Commands
- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production (placeholder)
- `npm run test` - Run tests (placeholder)
- `npm run lint` - Run linting (placeholder)

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose build web
```

## 📝 Contributing

This project is in active development. Check the issues tab for current development priorities and ways to contribute.

## 📄 License

*License information will be added as the project develops.*
