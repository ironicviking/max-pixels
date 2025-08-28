/**
 * Input Manager for Max-Pixels
 * Advanced input handling with key states, combinations, and events
 */

export class InputManager {
    constructor() {
        this.keys = new Map();
        this.previousKeys = new Map();
        this.keyBindings = new Map();
        this.listeners = new Map();
        this.isEnabled = true;
        
        this.initializeEventListeners();
        this.setupDefaultBindings();
    }
    
    initializeEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled) return;
            
            const keyCode = event.code;
            const wasPressed = this.keys.get(keyCode)?.isPressed || false;
            
            this.keys.set(keyCode, {
                isPressed: true,
                justPressed: !wasPressed,
                justReleased: false,
                timestamp: Date.now()
            });
            
            this.triggerKeyEvents('keydown', keyCode, event);
            
            if (this.shouldPreventDefault(keyCode)) {
                event.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (!this.isEnabled) return;
            
            const keyCode = event.code;
            const wasPressed = this.keys.get(keyCode)?.isPressed || false;
            
            this.keys.set(keyCode, {
                isPressed: false,
                justPressed: false,
                justReleased: wasPressed,
                timestamp: Date.now()
            });
            
            this.triggerKeyEvents('keyup', keyCode, event);
            
            if (this.shouldPreventDefault(keyCode)) {
                event.preventDefault();
            }
        });
        
        document.addEventListener('blur', () => {
            this.clearAllKeys();
        });
    }
    
    setupDefaultBindings() {
        this.keyBindings.set('move_up', ['KeyW', 'ArrowUp']);
        this.keyBindings.set('move_down', ['KeyS', 'ArrowDown']);
        this.keyBindings.set('move_left', ['KeyA', 'ArrowLeft']);
        this.keyBindings.set('move_right', ['KeyD', 'ArrowRight']);
        this.keyBindings.set('action', ['Space']);
        this.keyBindings.set('menu', ['Escape']);
        this.keyBindings.set('boost', ['ShiftLeft', 'ShiftRight']);
    }
    
    isPressed(keyOrAction) {
        if (this.keyBindings.has(keyOrAction)) {
            const keys = this.keyBindings.get(keyOrAction);
            return keys.some(key => this.keys.get(key)?.isPressed || false);
        }
        
        return this.keys.get(keyOrAction)?.isPressed || false;
    }
    
    justPressed(keyOrAction) {
        if (this.keyBindings.has(keyOrAction)) {
            const keys = this.keyBindings.get(keyOrAction);
            return keys.some(key => this.keys.get(key)?.justPressed || false);
        }
        
        return this.keys.get(keyOrAction)?.justPressed || false;
    }
    
    justReleased(keyOrAction) {
        if (this.keyBindings.has(keyOrAction)) {
            const keys = this.keyBindings.get(keyOrAction);
            return keys.some(key => this.keys.get(key)?.justReleased || false);
        }
        
        return this.keys.get(keyOrAction)?.justReleased || false;
    }
    
    getMovementVector() {
        const vector = { x: 0, y: 0 };
        
        if (this.isPressed('move_up')) vector.y -= 1;
        if (this.isPressed('move_down')) vector.y += 1;
        if (this.isPressed('move_left')) vector.x -= 1;
        if (this.isPressed('move_right')) vector.x += 1;
        
        const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2);
        if (magnitude > 0) {
            vector.x /= magnitude;
            vector.y /= magnitude;
        }
        
        return vector;
    }
    
    bindKey(action, keys) {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }
        this.keyBindings.set(action, keys);
    }
    
    unbindKey(action) {
        this.keyBindings.delete(action);
    }
    
    addEventListener(event, keyOrAction, callback) {
        const eventKey = `${event}_${keyOrAction}`;
        if (!this.listeners.has(eventKey)) {
            this.listeners.set(eventKey, []);
        }
        this.listeners.get(eventKey).push(callback);
    }
    
    removeEventListener(event, keyOrAction, callback) {
        const eventKey = `${event}_${keyOrAction}`;
        const listeners = this.listeners.get(eventKey);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    triggerKeyEvents(event, keyCode, originalEvent) {
        const eventKey = `${event}_${keyCode}`;
        const listeners = this.listeners.get(eventKey);
        if (listeners) {
            listeners.forEach(callback => {
                callback(keyCode, originalEvent);
            });
        }
        
        for (const [action, keys] of this.keyBindings) {
            if (keys.includes(keyCode)) {
                const actionEventKey = `${event}_${action}`;
                const actionListeners = this.listeners.get(actionEventKey);
                if (actionListeners) {
                    actionListeners.forEach(callback => {
                        callback(action, originalEvent);
                    });
                }
            }
        }
    }
    
    shouldPreventDefault(keyCode) {
        const preventKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'Space'
        ];
        return preventKeys.includes(keyCode);
    }
    
    update() {
        // Copy current states to previous for next frame comparison
        this.previousKeys.clear();
        for (const [keyCode, state] of this.keys) {
            this.previousKeys.set(keyCode, {
                isPressed: state.isPressed,
                justPressed: state.justPressed,
                justReleased: state.justReleased,
                timestamp: state.timestamp
            });
        }
        
        // Reset just-pressed and just-released flags for next frame
        // eslint-disable-next-line no-unused-vars
        for (const [keyCode, state] of this.keys) {
            if (state.justPressed) {
                state.justPressed = false;
            }
            if (state.justReleased) {
                state.justReleased = false;
            }
        }
    }
    
    clearAllKeys() {
        // eslint-disable-next-line no-unused-vars
        for (const [keyCode, state] of this.keys) {
            state.isPressed = false;
            state.justPressed = false;
            state.justReleased = true;
        }
    }
    
    enable() {
        this.isEnabled = true;
    }
    
    disable() {
        this.isEnabled = false;
        this.clearAllKeys();
    }
    
    getKeyState(keyOrAction) {
        if (this.keyBindings.has(keyOrAction)) {
            const keys = this.keyBindings.get(keyOrAction);
            for (const key of keys) {
                const state = this.keys.get(key);
                if (state?.isPressed) {
                    return state;
                }
            }
            return { isPressed: false, justPressed: false, justReleased: false, timestamp: 0 };
        }
        
        return this.keys.get(keyOrAction) || { 
            isPressed: false, 
            justPressed: false, 
            justReleased: false, 
            timestamp: 0 
        };
    }
    
    getPressedKeys() {
        const pressed = [];
        for (const [keyCode, state] of this.keys) {
            if (state.isPressed) {
                pressed.push(keyCode);
            }
        }
        return pressed;
    }
    
    getActiveActions() {
        const active = [];
        for (const [action, keys] of this.keyBindings) {
            if (keys.some(key => this.keys.get(key)?.isPressed)) {
                active.push(action);
            }
        }
        return active;
    }
    
    getPreviousKeyState(keyOrAction) {
        if (this.keyBindings.has(keyOrAction)) {
            const keys = this.keyBindings.get(keyOrAction);
            for (const key of keys) {
                const state = this.previousKeys.get(key);
                if (state?.isPressed) {
                    return state;
                }
            }
            return { isPressed: false, justPressed: false, justReleased: false, timestamp: 0 };
        }
        
        return this.previousKeys.get(keyOrAction) || { 
            isPressed: false, 
            justPressed: false, 
            justReleased: false, 
            timestamp: 0 
        };
    }
}