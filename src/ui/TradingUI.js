/**
 * Trading UI for Max-Pixels
 * Interactive interface for buying and selling items at stations
 */

export class TradingUI {
    constructor(tradingSystem, authService) {
        this.trading = tradingSystem;
        this.auth = authService;
        this.isOpen = false;
        this.currentStation = null;
        this.modalElement = null;
    }
    
    openTradingInterface(station) {
        if (this.isOpen) return;
        
        this.currentStation = station;
        this.isOpen = true;
        this.createTradingModal();
        this.refreshInterface();
    }
    
    closeTradingInterface() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.currentStation = null;
        
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }
    }
    
    createTradingModal() {
        const modalHTML = `
            <div class="trading-modal-overlay" id="tradingModal">
                <div class="trading-modal">
                    <div class="trading-header">
                        <h2 id="stationName">Trading Station</h2>
                        <button class="close-btn" id="closeTradingBtn">&times;</button>
                    </div>
                    <div class="trading-content">
                        <div class="credits-display">
                            <div class="player-credits">Your Credits: <span id="playerCredits">0</span></div>
                            <div class="station-credits">Station Credits: <span id="stationCredits">0</span></div>
                        </div>
                        <div class="trading-panels">
                            <div class="buy-panel">
                                <h3>Buy from Station</h3>
                                <div class="items-list" id="buyItemsList"></div>
                            </div>
                            <div class="sell-panel">
                                <h3>Sell to Station</h3>
                                <div class="items-list" id="sellItemsList"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('tradingModal');
        
        // Add event listeners
        document.getElementById('closeTradingBtn').addEventListener('click', () => {
            this.closeTradingInterface();
        });
        
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.closeTradingInterface();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // Add styles
        this.addTradingStyles();
    }
    
    handleKeyPress(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.closeTradingInterface();
        }
    }
    
    refreshInterface() {
        if (!this.isOpen || !this.currentStation) return;
        
        const stationInventory = this.trading.getStationInventory(this.currentStation.id);
        const playerInventory = this.trading.getPlayerInventory();
        const playerCredits = this.auth.currentUser?.credits || 1000;
        
        // Update header
        document.getElementById('stationName').textContent = this.currentStation.name;
        document.getElementById('playerCredits').textContent = playerCredits;
        document.getElementById('stationCredits').textContent = stationInventory?.credits || 0;
        
        // Update buy panel
        this.updateBuyPanel(stationInventory);
        
        // Update sell panel
        this.updateSellPanel(stationInventory, playerInventory);
    }
    
    updateBuyPanel(stationInventory) {
        const buyList = document.getElementById('buyItemsList');
        buyList.innerHTML = '';
        
        if (!stationInventory) {
            buyList.innerHTML = '<div class="no-items">Station unavailable</div>';
            return;
        }
        
        const availableItems = stationInventory.items.filter(item => item.quantity > 0);
        
        if (availableItems.length === 0) {
            buyList.innerHTML = '<div class="no-items">No items available</div>';
            return;
        }
        
        availableItems.forEach(stationItem => {
            const itemElement = this.createBuyItemElement(stationItem);
            buyList.appendChild(itemElement);
        });
    }
    
    updateSellPanel(stationInventory, playerInventory) {
        const sellList = document.getElementById('sellItemsList');
        sellList.innerHTML = '';
        
        if (playerInventory.length === 0) {
            sellList.innerHTML = '<div class="no-items">No items to sell</div>';
            return;
        }
        
        playerInventory.forEach(playerItem => {
            const stationItem = stationInventory?.items.find(si => si.item.id === playerItem.item.id);
            const itemElement = this.createSellItemElement(playerItem, stationItem);
            sellList.appendChild(itemElement);
        });
    }
    
    createBuyItemElement(stationItem) {
        const div = document.createElement('div');
        div.className = 'trading-item';
        
        div.innerHTML = `
            <div class="item-info">
                <div class="item-name">${stationItem.item.name}</div>
                <div class="item-description">${stationItem.item.description}</div>
                <div class="item-details">
                    <span class="price">${stationItem.sellPrice} credits</span>
                    <span class="stock">Stock: ${stationItem.quantity}</span>
                </div>
            </div>
            <div class="item-actions">
                <div class="quantity-controls">
                    <button class="qty-btn" data-action="decrease">-</button>
                    <input type="number" class="qty-input" value="1" min="1" max="${stationItem.quantity}">
                    <button class="qty-btn" data-action="increase">+</button>
                </div>
                <button class="buy-btn" data-item-id="${stationItem.item.id}">Buy</button>
            </div>
        `;
        
        // Add event listeners
        const qtyInput = div.querySelector('.qty-input');
        const decreaseBtn = div.querySelector('[data-action="decrease"]');
        const increaseBtn = div.querySelector('[data-action="increase"]');
        const buyBtn = div.querySelector('.buy-btn');
        
        decreaseBtn.addEventListener('click', () => {
            const current = parseInt(qtyInput.value);
            if (current > 1) qtyInput.value = current - 1;
        });
        
        increaseBtn.addEventListener('click', () => {
            const current = parseInt(qtyInput.value);
            const max = parseInt(qtyInput.max);
            if (current < max) qtyInput.value = current + 1;
        });
        
        buyBtn.addEventListener('click', () => {
            const quantity = parseInt(qtyInput.value);
            this.handleBuyItem(stationItem.item.id, quantity);
        });
        
        return div;
    }
    
    createSellItemElement(playerItem, stationItem) {
        const div = document.createElement('div');
        div.className = 'trading-item';
        
        const canSell = stationItem !== undefined;
        const buyPrice = canSell ? stationItem.buyPrice : 'N/A';
        
        div.innerHTML = `
            <div class="item-info">
                <div class="item-name">${playerItem.item.name}</div>
                <div class="item-description">${playerItem.item.description}</div>
                <div class="item-details">
                    <span class="price">${buyPrice} credits ${canSell ? '' : '(Not accepted)'}</span>
                    <span class="owned">Owned: ${playerItem.quantity}</span>
                </div>
            </div>
            <div class="item-actions">
                ${canSell ? `
                <div class="quantity-controls">
                    <button class="qty-btn" data-action="decrease">-</button>
                    <input type="number" class="qty-input" value="1" min="1" max="${playerItem.quantity}">
                    <button class="qty-btn" data-action="increase">+</button>
                </div>
                <button class="sell-btn" data-item-id="${playerItem.item.id}">Sell</button>
                ` : '<span class="not-accepted">Station doesn\'t buy this item</span>'}
            </div>
        `;
        
        if (canSell) {
            // Add event listeners for sellable items
            const qtyInput = div.querySelector('.qty-input');
            const decreaseBtn = div.querySelector('[data-action="decrease"]');
            const increaseBtn = div.querySelector('[data-action="increase"]');
            const sellBtn = div.querySelector('.sell-btn');
            
            decreaseBtn.addEventListener('click', () => {
                const current = parseInt(qtyInput.value);
                if (current > 1) qtyInput.value = current - 1;
            });
            
            increaseBtn.addEventListener('click', () => {
                const current = parseInt(qtyInput.value);
                const max = parseInt(qtyInput.max);
                if (current < max) qtyInput.value = current + 1;
            });
            
            sellBtn.addEventListener('click', () => {
                const quantity = parseInt(qtyInput.value);
                this.handleSellItem(playerItem.item.id, quantity);
            });
        }
        
        return div;
    }
    
    handleBuyItem(itemId, quantity) {
        const playerCredits = this.auth.currentUser?.credits || 1000;
        const result = this.trading.buyFromStation(this.currentStation.id, itemId, quantity, playerCredits);
        
        if (result.success) {
            // Update player credits (in a real game this would be handled by the auth system)
            if (this.auth.currentUser) {
                this.auth.currentUser.credits = playerCredits - result.cost;
            }
            
            this.showMessage(`Purchased ${quantity} units for ${result.cost} credits!`, 'success');
            this.refreshInterface();
        } else {
            this.showMessage(result.error, 'error');
        }
    }
    
    handleSellItem(itemId, quantity) {
        const result = this.trading.sellToStation(this.currentStation.id, itemId, quantity);
        
        if (result.success) {
            // Update player credits (in a real game this would be handled by the auth system)
            if (this.auth.currentUser) {
                this.auth.currentUser.credits = (this.auth.currentUser.credits || 1000) + result.value;
            }
            
            this.showMessage(`Sold ${quantity} units for ${result.value} credits!`, 'success');
            this.refreshInterface();
        } else {
            this.showMessage(result.error, 'error');
        }
    }
    
    showMessage(text, type) {
        const existingMessage = document.querySelector('.trading-message');
        if (existingMessage) existingMessage.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `trading-message ${type}`;
        messageDiv.textContent = text;
        
        const modal = document.querySelector('.trading-modal');
        modal.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    addTradingStyles() {
        if (document.getElementById('tradingStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'tradingStyles';
        styles.textContent = `
            .trading-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            
            .trading-modal {
                background: #1a1a2e;
                border: 2px solid #4a90e2;
                border-radius: 10px;
                width: 90%;
                max-width: 800px;
                max-height: 80%;
                position: relative;
                color: white;
            }
            
            .trading-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-bottom: 1px solid #333;
            }
            
            .trading-header h2 {
                margin: 0;
                color: #4a90e2;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-btn:hover {
                color: #4a90e2;
            }
            
            .trading-content {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .credits-display {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                padding: 10px;
                background: #16213e;
                border-radius: 5px;
            }
            
            .player-credits, .station-credits {
                font-weight: bold;
            }
            
            .trading-panels {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .buy-panel, .sell-panel {
                border: 1px solid #333;
                border-radius: 5px;
                padding: 15px;
            }
            
            .buy-panel h3, .sell-panel h3 {
                margin-top: 0;
                color: #4a90e2;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
            }
            
            .items-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .trading-item {
                border: 1px solid #333;
                border-radius: 5px;
                padding: 10px;
                margin-bottom: 10px;
                background: #0f0f23;
            }
            
            .item-info {
                margin-bottom: 10px;
            }
            
            .item-name {
                font-weight: bold;
                color: #4a90e2;
                margin-bottom: 5px;
            }
            
            .item-description {
                font-size: 12px;
                color: #aaa;
                margin-bottom: 5px;
            }
            
            .item-details {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
            }
            
            .price {
                color: #4a90e2;
                font-weight: bold;
            }
            
            .item-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .quantity-controls {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .qty-btn {
                background: #4a90e2;
                border: none;
                color: white;
                width: 25px;
                height: 25px;
                border-radius: 3px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .qty-btn:hover {
                background: #357abd;
            }
            
            .qty-input {
                width: 50px;
                text-align: center;
                background: #16213e;
                border: 1px solid #333;
                color: white;
                border-radius: 3px;
                padding: 3px;
            }
            
            .buy-btn, .sell-btn {
                background: #4a90e2;
                border: none;
                color: white;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .buy-btn:hover, .sell-btn:hover {
                background: #357abd;
            }
            
            .sell-btn {
                background: #e74c3c;
            }
            
            .sell-btn:hover {
                background: #c0392b;
            }
            
            .no-items {
                text-align: center;
                padding: 20px;
                color: #666;
                font-style: italic;
            }
            
            .not-accepted {
                color: #666;
                font-style: italic;
                font-size: 12px;
            }
            
            .trading-message {
                position: absolute;
                top: 70px;
                left: 50%;
                transform: translateX(-50%);
                padding: 10px 20px;
                border-radius: 5px;
                font-weight: bold;
                z-index: 1001;
            }
            
            .trading-message.success {
                background: #27ae60;
                color: white;
            }
            
            .trading-message.error {
                background: #e74c3c;
                color: white;
            }
            
            @media (max-width: 768px) {
                .trading-panels {
                    grid-template-columns: 1fr;
                }
                
                .trading-modal {
                    width: 95%;
                    max-height: 90%;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
}