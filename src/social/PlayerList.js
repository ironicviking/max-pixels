/**
 * Player List - Social System for Max-Pixels
 * Manages connected players and basic social features
 */

import { SOCIAL } from '../constants.js';

export class PlayerList {
    constructor() {
        this.players = new Map(); // playerId -> player data
        this.localPlayerId = null;
        this.lastUpdateTime = 0;
        
        // UI Elements
        this.container = null;
        this.isVisible = false;
        
        this.initializeUI();
    }
    
    initializeUI() {
        // Create player list container
        this.container = document.createElement('div');
        this.container.id = 'player-list';
        this.container.className = 'player-list-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 250px;
            background: rgba(0, 20, 40, 0.9);
            border: 1px solid #4a90e2;
            border-radius: 8px;
            padding: 15px;
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 1000;
            display: none;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #4a90e2;">Players Online</h3>
                <button id="close-player-list" style="background: none; border: none; color: #888; cursor: pointer;">×</button>
            </div>
        `;
        this.container.appendChild(header);
        
        // Create player list
        const playerListDiv = document.createElement('div');
        playerListDiv.id = 'players';
        this.container.appendChild(playerListDiv);
        
        // Add to document
        document.body.appendChild(this.container);
        
        // Bind close button
        document.getElementById('close-player-list').addEventListener('click', () => {
            this.hide();
        });
    }
    
    /**
     * Set the local player ID
     */
    setLocalPlayer(playerId) {
        this.localPlayerId = playerId;
    }
    
    /**
     * Add or update a player in the list
     */
    updatePlayer(playerId, playerData) {
        const now = Date.now();
        
        this.players.set(playerId, {
            ...playerData,
            lastSeen: now,
            isOnline: true
        });
        
        this.lastUpdateTime = now;
        
        if (this.isVisible) {
            this.renderPlayerList();
        }
    }
    
    /**
     * Remove a player from the list
     */
    removePlayer(playerId) {
        this.players.delete(playerId);
        
        if (this.isVisible) {
            this.renderPlayerList();
        }
    }
    
    /**
     * Mark a player as offline but keep in recent players
     */
    setPlayerOffline(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.isOnline = false;
            player.lastSeen = Date.now();
            
            if (this.isVisible) {
                this.renderPlayerList();
            }
        }
    }
    
    /**
     * Get all online players
     */
    getOnlinePlayers() {
        const online = [];
        for (const [playerId, playerData] of this.players) {
            if (playerData.isOnline && playerId !== this.localPlayerId) {
                online.push({
                    id: playerId,
                    ...playerData
                });
            }
        }
        return online.sort((a, b) => a.username.localeCompare(b.username));
    }
    
    /**
     * Get recently seen players (offline)
     */
    getRecentPlayers() {
        const recent = [];
        const cutoffTime = Date.now() - (SOCIAL.RECENT_PLAYER_CUTOFF_MINUTES * SOCIAL.SECONDS_PER_MINUTE * SOCIAL.MILLISECONDS_PER_SECOND); // 5 minutes ago
        
        for (const [playerId, playerData] of this.players) {
            if (!playerData.isOnline && 
                playerData.lastSeen > cutoffTime && 
                playerId !== this.localPlayerId) {
                recent.push({
                    id: playerId,
                    ...playerData
                });
            }
        }
        return recent.sort((a, b) => b.lastSeen - a.lastSeen);
    }
    
    /**
     * Show the player list
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'block';
        this.renderPlayerList();
    }
    
    /**
     * Hide the player list
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
    
    /**
     * Toggle player list visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Render the player list UI
     */
    renderPlayerList() {
        const playersDiv = document.getElementById('players');
        if (!playersDiv) return;
        
        const onlinePlayers = this.getOnlinePlayers();
        const recentPlayers = this.getRecentPlayers();
        
        let html = '';
        
        // Online Players Section
        if (onlinePlayers.length > 0) {
            html += '<div style="margin-bottom: 15px;">';
            html += `<div style="color: #4a90e2; font-weight: bold; margin-bottom: 5px;">Online (${onlinePlayers.length})</div>`;
            
            onlinePlayers.forEach(player => {
                const healthPercent = ((player.health || 0) / (player.maxHealth || SOCIAL.DEFAULT_MAX_HEALTH)) * SOCIAL.DEFAULT_MAX_HEALTH;
                const shieldPercent = ((player.shield || 0) / (player.maxShield || SOCIAL.DEFAULT_MAX_SHIELD)) * SOCIAL.DEFAULT_MAX_SHIELD;
                
                html += `
                    <div style="margin: 5px 0; padding: 8px; background: rgba(74, 144, 226, 0.1); border-radius: 4px; cursor: pointer;"
                         onclick="playerList.focusPlayer('${player.id}')">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #00ff88; font-weight: bold;">${player.username || player.id}</span>
                            <span style="color: #888; font-size: 10px;">${this.getPlayerStatus(player)}</span>
                        </div>
                        <div style="margin-top: 4px;">
                            <div style="display: flex; gap: 5px; font-size: 10px;">
                                <div title="Health">❤️ ${Math.round(healthPercent)}%</div>
                                <div title="Shield">🛡️ ${Math.round(shieldPercent)}%</div>
                                ${player.currentSystem ? `<div title="System">🌌 ${player.currentSystem}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<div style="color: #888; font-style: italic; margin-bottom: 15px;">No other players online</div>';
        }
        
        // Recent Players Section
        if (recentPlayers.length > 0) {
            html += '<div>';
            html += '<div style="color: #888; font-weight: bold; margin-bottom: 5px;">Recently Seen</div>';
            
            recentPlayers.forEach(player => {
                const timeSince = this.formatTimeSince(player.lastSeen);
                html += `
                    <div style="margin: 3px 0; padding: 5px; background: rgba(136, 136, 136, 0.1); border-radius: 4px; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #ccc;">${player.username || player.id}</span>
                            <span style="color: #888;">${timeSince} ago</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        if (html === '') {
            html = '<div style="color: #888; font-style: italic;">No players found</div>';
        }
        
        playersDiv.innerHTML = html;
    }
    
    /**
     * Get player status text
     */
    getPlayerStatus(player) {
        if (!player.isAlive) return '💀 Dead';
        if (player.boosting) return '🚀 Boosting';
        if (player.thrust > 0) return '⚡ Moving';
        if (player.shieldsActive) return '🛡️ Shielded';
        return '⚪ Idle';
    }
    
    /**
     * Format time since last seen
     */
    formatTimeSince(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / SOCIAL.MILLISECONDS_PER_SECOND);
        
        if (seconds < SOCIAL.SECONDS_PER_MINUTE) return `${seconds}s`;
        if (seconds < SOCIAL.SECONDS_PER_HOUR) return `${Math.floor(seconds / SOCIAL.SECONDS_PER_MINUTE)}m`;
        if (seconds < SOCIAL.SECONDS_PER_DAY) return `${Math.floor(seconds / SOCIAL.SECONDS_PER_HOUR)}h`;
        return `${Math.floor(seconds / SOCIAL.SECONDS_PER_DAY)}d`;
    }
    
    /**
     * Focus on a specific player (for future camera/map integration)
     */
    focusPlayer(playerId) {
        const player = this.players.get(playerId);
        if (player && player.isOnline) {
            console.log('Focusing on player:', player.username || playerId, player);
            
            // Dispatch custom event for other systems to listen to
            document.dispatchEvent(new CustomEvent('focusPlayer', {
                detail: { playerId, player }
            }));
        }
    }
    
    /**
     * Get player count statistics
     */
    getStats() {
        const online = this.getOnlinePlayers().length;
        const recent = this.getRecentPlayers().length;
        const total = this.players.size;
        
        return {
            online,
            recent,
            total,
            localPlayer: this.localPlayerId
        };
    }
    
    /**
     * Clean up old player data
     */
    cleanup() {
        const cutoffTime = Date.now() - (SOCIAL.PLAYER_CLEANUP_CUTOFF_MINUTES * SOCIAL.SECONDS_PER_MINUTE * SOCIAL.MILLISECONDS_PER_SECOND); // 30 minutes ago
        
        for (const [playerId, playerData] of this.players) {
            if (!playerData.isOnline && playerData.lastSeen < cutoffTime) {
                this.players.delete(playerId);
            }
        }
    }
    
    /**
     * Integration with NetworkManager
     */
    handleNetworkMessage(messageType, data) {
        switch (messageType) {
        case 'player_join':
            if (data.playerId && data.playerId !== this.localPlayerId) {
                this.updatePlayer(data.playerId, {
                    username: data.username || data.playerId,
                    ...data
                });
            }
            break;
                
        case 'player_leave':
            if (data.playerId) {
                this.setPlayerOffline(data.playerId);
            }
            break;
                
        case 'player_move':
            if (data.playerId && data.playerId !== this.localPlayerId) {
                this.updatePlayer(data.playerId, data);
            }
            break;
                
        case 'game_state':
            if (data.players) {
                data.players.forEach(player => {
                    if (player.id !== this.localPlayerId) {
                        this.updatePlayer(player.id, player);
                    }
                });
            }
            break;
        }
    }
}

// Global instance
export const playerList = new PlayerList();

// Make globally accessible for onclick handlers
window.playerList = playerList;