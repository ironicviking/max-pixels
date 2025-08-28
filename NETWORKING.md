# Max-Pixels Multiplayer Networking

This document describes the multiplayer networking foundation implemented for Max-Pixels.

## Overview

The networking system provides real-time multiplayer functionality using WebSockets, enabling players to connect to a central game server and interact with other players in shared space sectors.

## Architecture

### Client-Side Components

#### NetworkManager (`src/network/NetworkManager.js`)
- Handles WebSocket connections to the game server
- Manages message sending/receiving with proper error handling
- Implements automatic reconnection with exponential backoff
- Provides heartbeat mechanism to detect connection issues
- Supports event-driven message handling

#### Key Features:
- **Connection Management**: Automatic connection, disconnection, and reconnection
- **Message Protocol**: Standardized message types for game events
- **Heartbeat System**: Keeps connections alive and detects failures
- **Event Handlers**: Extensible system for handling server messages
- **Error Recovery**: Graceful handling of network interruptions

### Server-Side Components

#### GameServer (`server/gameServer.js`)
- Simple WebSocket server for multiplayer coordination
- Manages connected players and game state
- Broadcasts player actions to relevant clients
- Implements basic game loop for state updates
- Handles player join/leave events

#### Key Features:
- **Player Management**: Track connected players and their states
- **Message Broadcasting**: Efficiently distribute updates to clients
- **Game State Synchronization**: Maintain authoritative game state
- **Connection Cleanup**: Remove disconnected players automatically

## Message Protocol

### Message Types

```javascript
const MessageTypes = {
    PLAYER_JOIN: 'player_join',      // Player joins the game
    PLAYER_LEAVE: 'player_leave',    // Player leaves the game
    PLAYER_MOVE: 'player_move',      // Player position/rotation update
    PLAYER_FIRE: 'player_fire',      // Player weapon firing
    GAME_STATE: 'game_state',        // Full game state update
    CHAT_MESSAGE: 'chat_message',    // Chat communication
    HEARTBEAT: 'heartbeat',          // Connection keepalive
    ERROR: 'error'                   // Error notifications
};
```

### Message Format

```javascript
{
    type: 'player_move',
    playerId: 'player_123',
    timestamp: 1234567890123,
    data: {
        position: { x: 100, y: 200 },
        velocity: { x: 5, y: 0 },
        rotation: 45
    }
}
```

## Integration Points

### Game Loop Integration
- Player movement updates are automatically sent to server in `updatePlayer()`
- Weapon firing events are broadcast in `fireLaser()`
- Network status is displayed with visual indicators

### Authentication Integration
- Uses authenticated player usernames as player IDs when available
- Falls back to generated IDs for guest players

### UI Integration
- Network status indicator shows connection state
- Automatic reconnection attempts with user feedback
- Error states gracefully handled with fallback to offline mode

## Usage

### Starting the Server

```bash
npm run server
```

This starts the WebSocket server on port 8080.

### Running with Multiplayer

```bash
npm run dev:multiplayer
```

This starts both the game server and development server concurrently.

### Connecting to Multiplayer

The game automatically attempts to connect to the local server. Players can also programmatically connect:

```javascript
// Connect to multiplayer server
await game.connectToMultiplayer('ws://localhost:8080');

// Disconnect from multiplayer
game.disconnectFromMultiplayer();
```

## Current Implementation Status

### ✅ Implemented Features
- Basic WebSocket client/server communication
- Player join/leave events
- Player movement synchronization
- Weapon firing events
- Connection management with auto-reconnect
- Heartbeat/keepalive system
- Error handling and status indicators
- Visual representation of other players
- Real-time player ship rendering
- Chat system UI integration
- Game state synchronization

### 🚧 Planned Features (Future Tasks)
- Collision detection between players
- Synchronized asteroid destruction
- Trading between players
- Sector-based player grouping
- Server-side anti-cheat validation
- Persistent game state storage
- Player progression synchronization

## Development Notes

### Testing Multiplayer
1. Start the development environment: `npm run dev:multiplayer`
2. Open multiple browser tabs/windows to `http://localhost:3000`
3. Check browser console for network messages
4. Observe network status indicator in top-right corner

### Message Debugging
All network messages are logged to the browser console with prefixes:
- `Connected to multiplayer server` - Successful connection
- `Player X joined the game` - New player events
- `Player X moved to` - Movement updates
- Network errors and reconnection attempts

### Architecture Decisions
- **Client Authority**: Currently uses client-side authority for simplicity
- **Message Frequency**: Movement updates sent every frame (60fps) when moving
- **Connection Recovery**: Exponential backoff up to 30 seconds between attempts
- **State Synchronization**: Periodic full state broadcasts every second

## Future Considerations

### Scalability
- Implement spatial partitioning for large numbers of players
- Add dedicated servers for different game sectors
- Consider message batching for high-frequency updates

### Security
- Add server-side validation of player actions
- Implement rate limiting for message sending
- Add authentication tokens for secure connections

### Performance
- Implement delta compression for state updates
- Add client-side prediction for smooth movement
- Optimize message serialization

This networking foundation provides the groundwork for Max-Pixels' multiplayer features and can be extended as the game develops more complex multiplayer interactions.