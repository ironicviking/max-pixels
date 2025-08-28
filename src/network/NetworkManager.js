/**
 * Network Manager for Max-Pixels
 * Handles WebSocket connections and real-time multiplayer communication
 */

import { NETWORK } from '../constants.js';

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.messageHandlers = new Map();
        this.connectionCallbacks = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = NETWORK.MAX_RECONNECT_ATTEMPTS;
        this.reconnectDelay = NETWORK.INITIAL_RECONNECT_DELAY;
        this.heartbeatInterval = null;
        this.lastHeartbeat = null;
        
        // Message types - use constants from NETWORK
        this.MessageTypes = NETWORK.MESSAGE_TYPES;
        
        console.log('NetworkManager initialized');
    }
    
    /**
     * Connect to the game server
     * @param {string} serverUrl - WebSocket server URL
     * @param {string} playerId - Unique player identifier
     * @returns {Promise<boolean>} - Connection success
     */
    async connect(serverUrl = NETWORK.DEFAULT_SERVER_URL, playerId = null) {
        if (this.isConnected) {
            console.warn('Already connected to server');
            return true;
        }
        
        return new Promise((resolve, reject) => {
            try {
                this.playerId = playerId || this.generatePlayerId();
                this.socket = new WebSocket(serverUrl);
                
                this.socket.onopen = (event) => {
                    console.log('Connected to game server');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = NETWORK.INITIAL_RECONNECT_DELAY;
                    
                    // Start heartbeat
                    this.startHeartbeat();
                    
                    // Send initial join message
                    this.sendMessage(this.MessageTypes.PLAYER_JOIN, {
                        playerId: this.playerId,
                        timestamp: Date.now()
                    });
                    
                    // Notify connection callbacks
                    this.triggerConnectionCallback('connected', event);
                    resolve(true);
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.socket.onclose = (event) => {
                    console.log('Disconnected from game server:', event.code, event.reason);
                    this.isConnected = false;
                    this.stopHeartbeat();
                    
                    // Trigger disconnect callbacks
                    this.triggerConnectionCallback('disconnected', event);
                    
                    // Attempt reconnection if not a clean close
                    if (event.code !== WEBSOCKET_NORMAL_CLOSE && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.attemptReconnect(serverUrl);
                    }
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.triggerConnectionCallback('error', error);
                    
                    if (!this.isConnected) {
                        reject(error);
                    }
                };
                
            } catch (error) {
                console.error('Failed to create WebSocket connection:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.socket && this.isConnected) {
            // Send leave message before disconnecting
            this.sendMessage(this.MessageTypes.PLAYER_LEAVE, {
                playerId: this.playerId,
                timestamp: Date.now()
            });
            
            this.socket.close(WEBSOCKET_NORMAL_CLOSE, 'Client disconnect');
        }
        
        this.isConnected = false;
        this.playerId = null;
        this.stopHeartbeat();
    }
    
    /**
     * Send a message to the server
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    sendMessage(type, data = {}) {
        if (!this.isConnected || !this.socket) {
            console.warn('Cannot send message: not connected to server');
            return false;
        }
        
        const message = {
            type: type,
            playerId: this.playerId,
            timestamp: Date.now(),
            data: data
        };
        
        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    }
    
    /**
     * Handle incoming messages from server
     * @param {string} messageData - Raw message data
     */
    handleMessage(messageData) {
        try {
            const message = JSON.parse(messageData);
            
            // Update last heartbeat time for heartbeat messages
            if (message.type === this.MessageTypes.HEARTBEAT) {
                this.lastHeartbeat = Date.now();
                return;
            }
            
            // Trigger registered handlers
            if (this.messageHandlers.has(message.type)) {
                const handlers = this.messageHandlers.get(message.type);
                handlers.forEach(handler => {
                    try {
                        handler(message.data, message);
                    } catch (error) {
                        console.error('Error in message handler:', error);
                    }
                });
            }
            
            // Log unhandled messages for debugging
            if (!this.messageHandlers.has(message.type)) {
                console.log('Unhandled message type:', message.type, message.data);
            }
            
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }
    
    /**
     * Register a message handler
     * @param {string} messageType - Type of message to handle
     * @param {Function} handler - Handler function
     */
    on(messageType, handler) {
        if (!this.messageHandlers.has(messageType)) {
            this.messageHandlers.set(messageType, []);
        }
        this.messageHandlers.get(messageType).push(handler);
    }
    
    /**
     * Remove a message handler
     * @param {string} messageType - Type of message
     * @param {Function} handler - Handler function to remove
     */
    off(messageType, handler) {
        if (this.messageHandlers.has(messageType)) {
            const handlers = this.messageHandlers.get(messageType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    /**
     * Register connection event callbacks
     * @param {string} event - Event type (connected, disconnected, error)
     * @param {Function} callback - Callback function
     */
    onConnection(event, callback) {
        if (!this.connectionCallbacks.has(event)) {
            this.connectionCallbacks.set(event, []);
        }
        this.connectionCallbacks.get(event).push(callback);
    }
    
    /**
     * Send player movement update
     * @param {Object} position - Player position {x, y}
     * @param {Object} velocity - Player velocity {x, y}
     * @param {number} rotation - Player rotation in degrees
     */
    sendPlayerMovement(position, velocity, rotation) {
        return this.sendMessage(this.MessageTypes.PLAYER_MOVE, {
            position: position,
            velocity: velocity,
            rotation: rotation,
            timestamp: Date.now()
        });
    }
    
    /**
     * Send player firing action
     * @param {Object} position - Fire position {x, y}
     * @param {number} rotation - Fire direction in degrees
     * @param {string} weaponType - Type of weapon fired
     */
    sendPlayerFire(position, rotation, weaponType = 'laser') {
        return this.sendMessage(this.MessageTypes.PLAYER_FIRE, {
            position: position,
            rotation: rotation,
            weaponType: weaponType,
            timestamp: Date.now()
        });
    }
    
    /**
     * Send chat message
     * @param {string} message - Chat message text
     */
    sendChatMessage(message) {
        return this.sendMessage(this.MessageTypes.CHAT_MESSAGE, {
            message: message,
            timestamp: Date.now()
        });
    }
    
    /**
     * Start heartbeat to maintain connection
     */
    startHeartbeat() {
        this.lastHeartbeat = Date.now();
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendMessage(this.MessageTypes.HEARTBEAT, {
                    timestamp: Date.now()
                });
                
                // Check if we haven't received a heartbeat response in too long
                const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
                if (timeSinceLastHeartbeat > NETWORK.HEARTBEAT_TIMEOUT) {
                    console.warn('Heartbeat timeout, connection may be lost');
                }
            }
        }, NETWORK.HEARTBEAT_INTERVAL);
    }
    
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    /**
     * Attempt to reconnect to the server
     * @param {string} serverUrl - Server URL to reconnect to
     */
    attemptReconnect(serverUrl) {
        this.reconnectAttempts++;
        
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        
        setTimeout(async () => {
            try {
                await this.connect(serverUrl, this.playerId);
            } catch (error) {
                console.error('Reconnection failed:', error);
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    // Exponential backoff
                    this.reconnectDelay = Math.min(this.reconnectDelay * NETWORK.RECONNECT_BACKOFF_MULTIPLIER, NETWORK.MAX_RECONNECT_DELAY);
                    this.attemptReconnect(serverUrl);
                } else {
                    console.error('Max reconnection attempts reached');
                    this.triggerConnectionCallback('reconnectFailed', error);
                }
            }
        }, this.reconnectDelay);
    }
    
    /**
     * Trigger connection event callbacks
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    triggerConnectionCallback(event, data) {
        if (this.connectionCallbacks.has(event)) {
            const callbacks = this.connectionCallbacks.get(event);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in connection callback:', error);
                }
            });
        }
    }
    
    /**
     * Generate a unique player ID
     * @returns {string} - Unique player ID
     */
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(NETWORK.PLAYER_ID_RADIX).substr(NETWORK.PLAYER_ID_SUBSTR_START, NETWORK.PLAYER_ID_SUBSTR_LENGTH)}`;
    }
    
    /**
     * Get connection status
     * @returns {Object} - Connection status information
     */
    getStatus() {
        return {
            connected: this.isConnected,
            playerId: this.playerId,
            reconnectAttempts: this.reconnectAttempts,
            lastHeartbeat: this.lastHeartbeat,
            messageHandlers: Array.from(this.messageHandlers.keys())
        };
    }
    
    /**
     * Get network statistics
     * @returns {Object} - Network statistics
     */
    getNetworkStats() {
        return {
            connected: this.isConnected,
            playerId: this.playerId,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            lastHeartbeat: this.lastHeartbeat,
            handlerCount: this.messageHandlers.size,
            socketState: this.socket ? this.socket.readyState : null,
            socketUrl: this.socket ? this.socket.url : null
        };
    }
}