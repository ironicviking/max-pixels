/**
 * Trading System for Max-Pixels
 * Handles items, resources, prices, and trading mechanics
 */

export class TradingSystem {
    constructor() {
        this.items = new Map();
        this.playerInventory = new Map();
        this.stationInventories = new Map();
        this.priceHistory = new Map();
        this.playerCredits = 1000;
        
        this.initializeItems();
        this.initializeStationInventories();
    }
    
    initializeItems() {
        const itemDefinitions = [
            {
                id: 'ore-iron',
                name: 'Iron Ore',
                category: 'raw-materials',
                basePrice: 15,
                volatility: 0.2,
                description: 'Basic metallic ore used in construction'
            },
            {
                id: 'ore-copper',
                name: 'Copper Ore',
                category: 'raw-materials',
                basePrice: 25,
                volatility: 0.3,
                description: 'Conductive metal essential for electronics'
            },
            {
                id: 'fuel-hydrogen',
                name: 'Hydrogen Fuel',
                category: 'fuel',
                basePrice: 45,
                volatility: 0.4,
                description: 'Clean-burning spacecraft fuel'
            },
            {
                id: 'food-rations',
                name: 'Food Rations',
                category: 'consumables',
                basePrice: 30,
                volatility: 0.1,
                description: 'Preserved food for long space journeys'
            },
            {
                id: 'tech-processors',
                name: 'Quantum Processors',
                category: 'technology',
                basePrice: 150,
                volatility: 0.5,
                description: 'Advanced computing components'
            },
            {
                id: 'med-supplies',
                name: 'Medical Supplies',
                category: 'medical',
                basePrice: 80,
                volatility: 0.2,
                description: 'Essential medical equipment and pharmaceuticals'
            }
        ];
        
        itemDefinitions.forEach(item => {
            this.items.set(item.id, {
                ...item,
                currentPrice: item.basePrice
            });
        });
    }
    
    initializeStationInventories() {
        // Trading Outpost Alpha - mixed inventory
        this.stationInventories.set('tradingStation', {
            inventory: new Map([
                ['ore-iron', { quantity: 150, buyPrice: 12, sellPrice: 18 }],
                ['ore-copper', { quantity: 80, buyPrice: 22, sellPrice: 28 }],
                ['fuel-hydrogen', { quantity: 50, buyPrice: 40, sellPrice: 50 }],
                ['food-rations', { quantity: 200, buyPrice: 25, sellPrice: 35 }]
            ]),
            credits: 10000,
            demandMultipliers: {
                'ore-iron': 0.9,
                'ore-copper': 1.1,
                'fuel-hydrogen': 1.2,
                'food-rations': 0.8
            }
        });
    }
    
    getItem(itemId) {
        return this.items.get(itemId);
    }
    
    getPlayerInventory() {
        return Array.from(this.playerInventory.entries()).map(([itemId, quantity]) => ({
            item: this.getItem(itemId),
            quantity
        }));
    }
    
    getStationInventory(stationId) {
        const stationData = this.stationInventories.get(stationId);
        if (!stationData) return null;
        
        return {
            credits: stationData.credits,
            items: Array.from(stationData.inventory.entries()).map(([itemId, data]) => ({
                item: this.getItem(itemId),
                quantity: data.quantity,
                buyPrice: data.buyPrice,
                sellPrice: data.sellPrice
            }))
        };
    }
    
    canBuyFromStation(stationId, itemId, quantity) {
        const stationData = this.stationInventories.get(stationId);
        if (!stationData) return { success: false, error: 'Station not found' };
        
        const stationItem = stationData.inventory.get(itemId);
        if (!stationItem) return { success: false, error: 'Item not available' };
        
        if (stationItem.quantity < quantity) {
            return { success: false, error: 'Insufficient stock' };
        }
        
        const totalCost = stationItem.sellPrice * quantity;
        return { success: true, cost: totalCost };
    }
    
    canSellToStation(stationId, itemId, quantity, _playerCredits) {
        const stationData = this.stationInventories.get(stationId);
        if (!stationData) return { success: false, error: 'Station not found' };
        
        const stationItem = stationData.inventory.get(itemId);
        if (!stationItem) return { success: false, error: 'Station does not buy this item' };
        
        const playerQuantity = this.playerInventory.get(itemId) || 0;
        if (playerQuantity < quantity) {
            return { success: false, error: 'Insufficient inventory' };
        }
        
        const totalValue = stationItem.buyPrice * quantity;
        if (stationData.credits < totalValue) {
            return { success: false, error: 'Station has insufficient credits' };
        }
        
        return { success: true, value: totalValue };
    }
    
    buyFromStation(stationId, itemId, quantity, playerCredits) {
        const canBuy = this.canBuyFromStation(stationId, itemId, quantity);
        if (!canBuy.success) return canBuy;
        
        if (playerCredits < canBuy.cost) {
            return { success: false, error: 'Insufficient credits' };
        }
        
        // Execute transaction
        const stationData = this.stationInventories.get(stationId);
        const stationItem = stationData.inventory.get(itemId);
        
        // Update station inventory
        stationItem.quantity -= quantity;
        stationData.credits += canBuy.cost;
        
        // Update player inventory
        const currentPlayerQuantity = this.playerInventory.get(itemId) || 0;
        this.playerInventory.set(itemId, currentPlayerQuantity + quantity);
        
        // Update prices based on supply/demand
        this.updatePrices(itemId, 'buy', quantity);
        
        return {
            success: true,
            cost: canBuy.cost,
            newPlayerQuantity: currentPlayerQuantity + quantity,
            newStationQuantity: stationItem.quantity
        };
    }
    
    sellToStation(stationId, itemId, quantity) {
        const canSell = this.canSellToStation(stationId, itemId, quantity, 0);
        if (!canSell.success) return canSell;
        
        // Execute transaction
        const stationData = this.stationInventories.get(stationId);
        const stationItem = stationData.inventory.get(itemId);
        
        // Update station inventory
        stationItem.quantity += quantity;
        stationData.credits -= canSell.value;
        
        // Update player inventory
        const currentPlayerQuantity = this.playerInventory.get(itemId);
        this.playerInventory.set(itemId, currentPlayerQuantity - quantity);
        if (this.playerInventory.get(itemId) === 0) {
            this.playerInventory.delete(itemId);
        }
        
        // Update prices based on supply/demand
        this.updatePrices(itemId, 'sell', quantity);
        
        return {
            success: true,
            value: canSell.value,
            newPlayerQuantity: Math.max(0, currentPlayerQuantity - quantity),
            newStationQuantity: stationItem.quantity
        };
    }
    
    updatePrices(itemId, action, quantity) {
        const stationData = this.stationInventories.get('tradingStation');
        const stationItem = stationData.inventory.get(itemId);
        
        if (!stationItem) return;
        
        // Simple supply/demand pricing
        const priceChange = quantity * 0.1;
        
        if (action === 'buy') {
            // Player buying increases demand, prices go up
            stationItem.sellPrice += priceChange;
            stationItem.buyPrice += priceChange * 0.8;
        } else if (action === 'sell') {
            // Player selling increases supply, prices go down
            stationItem.sellPrice -= priceChange;
            stationItem.buyPrice -= priceChange * 0.8;
        }
        
        // Keep prices within reasonable bounds
        const item = this.getItem(itemId);
        stationItem.sellPrice = Math.max(item.basePrice * 0.5, stationItem.sellPrice);
        stationItem.buyPrice = Math.max(item.basePrice * 0.3, stationItem.buyPrice);
        stationItem.sellPrice = Math.min(item.basePrice * 2, stationItem.sellPrice);
        stationItem.buyPrice = Math.min(item.basePrice * 1.5, stationItem.buyPrice);
    }
    
    addPlayerItem(itemId, quantity) {
        const currentQuantity = this.playerInventory.get(itemId) || 0;
        this.playerInventory.set(itemId, currentQuantity + quantity);
    }
    
    getPlayerItemQuantity(itemId) {
        return this.playerInventory.get(itemId) || 0;
    }
    
    getTotalInventoryValue() {
        let totalValue = 0;
        
        for (const [itemId, quantity] of this.playerInventory) {
            const item = this.getItem(itemId);
            if (item) {
                totalValue += item.basePrice * quantity;
            }
        }
        
        return totalValue;
    }
    
    // Test compatibility methods
    getPlayerItems() {
        return Array.from(this.playerInventory.entries()).map(([id, quantity]) => ({
            id,
            quantity,
            item: this.getItem(id)
        }));
    }
    
    getPlayerCredits() {
        return this.playerCredits;
    }
    
    setPlayerCredits(credits) {
        this.playerCredits = Math.max(0, credits);
    }
    
    buyItem(station, itemId, quantity) {
        const stationItem = station.market[itemId];
        if (!stationItem) {
            return { success: false, error: 'Item not available' };
        }
        
        const totalCost = stationItem.sellPrice * quantity;
        if (this.playerCredits < totalCost) {
            return { success: false, error: 'Insufficient credits' };
        }
        
        if (stationItem.supply < quantity) {
            return { success: false, error: 'Insufficient stock' };
        }
        
        // Execute transaction
        this.playerCredits -= totalCost;
        this.addPlayerItem(itemId, quantity);
        stationItem.supply -= quantity;
        
        return {
            success: true,
            cost: totalCost,
            newPlayerQuantity: this.getPlayerItemQuantity(itemId)
        };
    }
    
    sellItem(station, itemId, quantity) {
        const stationItem = station.market[itemId];
        if (!stationItem) {
            return { success: false, error: 'Station does not buy this item' };
        }
        
        const playerQuantity = this.getPlayerItemQuantity(itemId);
        if (playerQuantity < quantity) {
            return { success: false, error: 'Insufficient inventory' };
        }
        
        const totalValue = stationItem.buyPrice * quantity;
        
        // Execute transaction
        this.playerCredits += totalValue;
        const currentQuantity = this.playerInventory.get(itemId);
        this.playerInventory.set(itemId, currentQuantity - quantity);
        
        if (this.playerInventory.get(itemId) === 0) {
            this.playerInventory.delete(itemId);
        }
        
        return {
            success: true,
            value: totalValue,
            newPlayerQuantity: this.getPlayerItemQuantity(itemId)
        };
    }
}