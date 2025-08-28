/**
 * Simple WebSocket Game Server for Max-Pixels
 * Basic multiplayer server for testing network functionality
 */

import { WebSocketServer, WebSocket } from 'ws';

class GameServer {
    constructor(port = 8080) {
        this.port = port;
        this.clients = new Map();
        this.gameState = {
            players: new Map(),
            gameObjects: [],
            lastUpdate: Date.now()
        };
        
        this.MessageTypes = {
            PLAYER_JOIN: 'player_join',
            PLAYER_LEAVE: 'player_leave',
            PLAYER_MOVE: 'player_move',
            PLAYER_FIRE: 'player_fire',
            GAME_STATE: 'game_state',
            CHAT_MESSAGE: 'chat_message',
            HEARTBEAT: 'heartbeat',
            ERROR: 'error'
        };
        
        this.init();
    }
    
    init() {
        this.wss = new WebSocketServer({ port: this.port }, () => {
            console.log(`Max-Pixels Game Server started on port ${this.port}`);
        });
        
        this.wss.on('connection', (ws) => {
            console.log('New client connected');
            
            ws.on('message', (data) => {
                this.handleMessage(ws, data);
            });
            
            ws.on('close', () => {
                this.handleDisconnect(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
            
            // Send welcome message
            this.sendToClient(ws, 'welcome', {
                message: 'Connected to Max-Pixels Game Server',
                timestamp: Date.now()
            });
        });
        
        // Start game loop for state updates
        this.startGameLoop();
    }
    
    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case this.MessageTypes.PLAYER_JOIN:
                    this.handlePlayerJoin(ws, message);
                    break;
                    
                case this.MessageTypes.PLAYER_LEAVE:
                    this.handlePlayerLeave(ws, message);
                    break;
                    
                case this.MessageTypes.PLAYER_MOVE:
                    this.handlePlayerMove(ws, message);
                    break;
                    
                case this.MessageTypes.PLAYER_FIRE:
                    this.handlePlayerFire(ws, message);
                    break;
                    
                case this.MessageTypes.CHAT_MESSAGE:
                    this.handleChatMessage(ws, message);
                    break;
                    
                case this.MessageTypes.HEARTBEAT:
                    this.handleHeartbeat(ws, message);
                    break;
                    
                default:
                    console.log('Unknown message type:', message.type);
            }
            
        } catch (error) {
            console.error('Error handling message:', error);
            this.sendToClient(ws, this.MessageTypes.ERROR, {
                error: 'Invalid message format'
            });
        }
    }
    
    handlePlayerJoin(ws, message) {
        const playerId = message.playerId;
        
        // Store client connection
        this.clients.set(playerId, ws);
        ws.playerId = playerId;
        
        // Add player to game state
        this.gameState.players.set(playerId, {
            id: playerId,
            position: { x: 960, y: 540 },
            velocity: { x: 0, y: 0 },
            rotation: 0,
            lastUpdate: Date.now(),
            connected: true
        });
        
        console.log(`Player ${playerId} joined the game`);
        
        // Send current game state to new player
        this.sendToClient(ws, this.MessageTypes.GAME_STATE, {
            players: Array.from(this.gameState.players.values()),
            gameObjects: this.gameState.gameObjects
        });
        
        // Broadcast player join to all other clients
        this.broadcast(this.MessageTypes.PLAYER_JOIN, {
            playerId: playerId,
            player: this.gameState.players.get(playerId)
        }, playerId);
    }
    
    handlePlayerLeave(ws, message) {
        const playerId = message.playerId || ws.playerId;
        
        if (playerId && this.gameState.players.has(playerId)) {
            this.gameState.players.delete(playerId);
            this.clients.delete(playerId);
            
            console.log(`Player ${playerId} left the game`);
            
            // Broadcast player leave to all clients
            this.broadcast(this.MessageTypes.PLAYER_LEAVE, {
                playerId: playerId
            });
        }
    }
    
    handlePlayerMove(ws, message) {
        const playerId = message.playerId;
        
        if (this.gameState.players.has(playerId)) {
            const player = this.gameState.players.get(playerId);
            
            // Update player state
            if (message.data.position) {
                player.position = message.data.position;
            }
            if (message.data.velocity) {
                player.velocity = message.data.velocity;
            }
            if (message.data.rotation !== undefined) {
                player.rotation = message.data.rotation;
            }
            
            player.lastUpdate = Date.now();
            
            // Broadcast movement to other players
            this.broadcast(this.MessageTypes.PLAYER_MOVE, {
                playerId: playerId,
                position: player.position,
                velocity: player.velocity,
                rotation: player.rotation,
                timestamp: message.data.timestamp
            }, playerId);
        }
    }
    
    handlePlayerFire(ws, message) {
        const playerId = message.playerId;
        
        console.log(`Player ${playerId} fired weapon`);
        
        // Broadcast firing event to all players
        this.broadcast(this.MessageTypes.PLAYER_FIRE, {
            playerId: playerId,
            position: message.data.position,
            rotation: message.data.rotation,
            weaponType: message.data.weaponType,
            timestamp: message.data.timestamp
        });
    }
    
    handleChatMessage(ws, message) {
        const playerId = message.playerId;
        
        console.log(`Chat from ${playerId}: ${message.data.message}`);
        
        // Broadcast chat message to all players
        this.broadcast(this.MessageTypes.CHAT_MESSAGE, {
            playerId: playerId,
            message: message.data.message,
            timestamp: message.data.timestamp
        });
    }
    
    handleHeartbeat(ws, message) {
        // Respond to heartbeat
        this.sendToClient(ws, this.MessageTypes.HEARTBEAT, {
            timestamp: Date.now()
        });
    }
    
    handleDisconnect(ws) {
        const playerId = ws.playerId;
        
        if (playerId) {
            console.log(`Player ${playerId} disconnected`);
            
            // Remove from game state
            if (this.gameState.players.has(playerId)) {
                this.gameState.players.delete(playerId);
            }
            
            this.clients.delete(playerId);
            
            // Broadcast disconnect to remaining clients
            this.broadcast(this.MessageTypes.PLAYER_LEAVE, {
                playerId: playerId
            });
        }
    }
    
    sendToClient(ws, type, data) {
        if (ws.readyState === WebSocket.OPEN) {
            const message = {
                type: type,
                timestamp: Date.now(),
                data: data
            };
            
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Error sending message to client:', error);
            }
        }
    }
    
    broadcast(type, data, excludePlayerId = null) {
        const message = {
            type: type,
            timestamp: Date.now(),
            data: data
        };
        
        const messageStr = JSON.stringify(message);
        
        this.clients.forEach((ws, playerId) => {
            if (playerId !== excludePlayerId && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(messageStr);
                } catch (error) {
                    console.error(`Error broadcasting to player ${playerId}:`, error);
                }
            }
        });
    }
    
    startGameLoop() {
        // Simple game loop - send periodic updates
        setInterval(() => {
            if (this.gameState.players.size > 0) {
                // Clean up disconnected players
                this.cleanupDisconnectedPlayers();
                
                // Send periodic game state updates
                this.broadcast(this.MessageTypes.GAME_STATE, {
                    players: Array.from(this.gameState.players.values()),
                    gameObjects: this.gameState.gameObjects,
                    timestamp: Date.now()
                });
            }
        }, 1000); // Update every second
    }
    
    cleanupDisconnectedPlayers() {
        const now = Date.now();
        const timeout = 30000; // 30 seconds
        
        for (const [playerId, player] of this.gameState.players.entries()) {
            if (now - player.lastUpdate > timeout) {
                console.log(`Cleaning up inactive player: ${playerId}`);
                this.gameState.players.delete(playerId);
                this.clients.delete(playerId);
                
                this.broadcast(this.MessageTypes.PLAYER_LEAVE, {
                    playerId: playerId
                });
            }
        }
    }
    
    getServerStats() {
        return {
            connectedPlayers: this.clients.size,
            gameObjects: this.gameState.gameObjects.length,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            lastUpdate: this.gameState.lastUpdate
        };
    }
    
    shutdown() {
        console.log('Shutting down game server...');
        
        // Notify all clients
        this.broadcast('server_shutdown', {
            message: 'Server is shutting down',
            timestamp: Date.now()
        });
        
        // Close all connections
        this.wss.close(() => {
            console.log('Game server stopped');
            process.exit(0);
        });
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    if (gameServer) {
        gameServer.shutdown();
    }
});

process.on('SIGINT', () => {
    if (gameServer) {
        gameServer.shutdown();
    }
});

// Start the server
const gameServer = new GameServer(8080);

export default GameServer;