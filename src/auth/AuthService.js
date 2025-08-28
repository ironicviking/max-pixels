/**
 * Authentication Service for Max-Pixels
 * Handles user registration, login, and session management
 */

// Authentication constants
const AUTH_CONSTANTS = {
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 20,
    PASSWORD_MIN_LENGTH: 6,
    RANDOM_STRING_BASE: 36,
    RANDOM_STRING_LENGTH: 9,
    TOKEN_EXPIRY_HOURS: 24,
    MINUTES_PER_HOUR: 60,
    SECONDS_PER_MINUTE: 60,
    MILLISECONDS_PER_SECOND: 1000,
    HASH_BIT_SHIFT: 5
};

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = this.getStorageItem('maxPixelsToken');
        this.apiBase = '/api/auth'; // Future server endpoint
        
        // For now, simulate with localStorage until server is implemented
        this.users = JSON.parse(this.getStorageItem('maxPixelsUsers') || '{}');
        
        if (this.token) {
            this.validateToken();
        }
    }
    
    // Helper method to handle localStorage safely
    getStorageItem(key) {
        try {
            return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        } catch {
            return null;
        }
    }
    
    setStorageItem(key, value) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } catch {
            // Silently fail if localStorage is not available
        }
    }
    
    removeStorageItem(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch {
            // Silently fail if localStorage is not available
        }
    }
    
    async register(username, email, password) {
        try {
            // Validate input
            this.validateRegistrationData(username, email, password);
            
            // Check if user already exists
            if (this.users[username] || this.findUserByEmail(email)) {
                throw new Error('Username or email already exists');
            }
            
            // Create user account
            const user = {
                id: this.generateUserId(),
                username,
                email,
                passwordHash: this.hashPassword(password),
                createdAt: new Date().toISOString(),
                level: 1,
                experience: 0,
                credits: 1000
            };
            
            this.users[username] = user;
            this.setStorageItem('maxPixelsUsers', JSON.stringify(this.users));
            
            // Auto-login after registration
            await this.login(username, password);
            
            return {
                success: true,
                message: 'Registration successful',
                user: this.sanitizeUser(user)
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    async login(username, password) {
        try {
            const user = this.users[username];
            
            if (!user) {
                throw new Error('Invalid username or password');
            }
            
            if (!this.verifyPassword(password, user.passwordHash)) {
                throw new Error('Invalid username or password');
            }
            
            // Generate session token
            const token = this.generateToken(user);
            this.token = token;
            this.currentUser = user;
            
            this.setStorageItem('maxPixelsToken', token);
            
            return {
                success: true,
                message: 'Login successful',
                user: this.sanitizeUser(user),
                token
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    logout() {
        this.currentUser = null;
        this.token = null;
        this.removeStorageItem('maxPixelsToken');
        
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }
    
    validateToken() {
        if (!this.token) return false;
        
        try {
            const decoded = JSON.parse(atob(this.token.split('.')[1]));
            
            // Check if token is expired
            if (decoded.exp < Date.now()) {
                this.logout();
                return false;
            }
            
            // Find user
            const user = this.users[decoded.username];
            if (!user) {
                this.logout();
                return false;
            }
            
            this.currentUser = user;
            return true;
            
        } catch {
            this.logout();
            return false;
        }
    }
    
    getCurrentUser() {
        return Boolean(this.currentUser) ? this.sanitizeUser(this.currentUser) : null;
    }
    
    getUsername() {
        return this.currentUser ? this.currentUser.username : null;
    }
    
    isAuthenticated() {
        return Boolean(this.currentUser);
    }
    
    isLoggedIn() {
        return this.isAuthenticated();
    }
    
    isGuest() {
        return Boolean(this.currentUser && this.currentUser.isGuest === true);
    }
    
    async loginAsGuest(displayName = 'Guest') {
        try {
            // Generate a unique guest user
            const guestUser = {
                id: 'guest_' + Date.now() + '_' + Math.random().toString(AUTH_CONSTANTS.RANDOM_STRING_BASE).substr(2, AUTH_CONSTANTS.RANDOM_STRING_LENGTH),
                username: displayName,
                email: null,
                passwordHash: null,
                createdAt: new Date().toISOString(),
                level: 1,
                experience: 0,
                credits: 1000,
                isGuest: true
            };
            
            // Don't store guest users permanently
            this.currentUser = guestUser;
            
            // Generate a temporary token for the guest
            const token = this.generateToken(guestUser);
            this.token = token;
            
            return {
                success: true,
                message: 'Guest login successful',
                user: this.sanitizeUser(guestUser),
                token
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    // Validation helpers
    validateRegistrationData(username, email, password) {
        if (!username || username.length < AUTH_CONSTANTS.USERNAME_MIN_LENGTH || username.length > AUTH_CONSTANTS.USERNAME_MAX_LENGTH) {
            throw new Error(`Username must be between ${AUTH_CONSTANTS.USERNAME_MIN_LENGTH} and ${AUTH_CONSTANTS.USERNAME_MAX_LENGTH} characters`);
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }
        
        if (!email || !this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        if (!password || password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
            throw new Error(`Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters long`);
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Utility functions
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(AUTH_CONSTANTS.RANDOM_STRING_BASE).substr(2, AUTH_CONSTANTS.RANDOM_STRING_LENGTH);
    }
    
    generateToken(user) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            username: user.username,
            userId: user.id,
            exp: Date.now() + (AUTH_CONSTANTS.TOKEN_EXPIRY_HOURS * AUTH_CONSTANTS.MINUTES_PER_HOUR * AUTH_CONSTANTS.SECONDS_PER_MINUTE * AUTH_CONSTANTS.MILLISECONDS_PER_SECOND) // 24 hours
        }));
        
        // Simple signature (in real app, this would be server-side with secret key)
        const signature = btoa('maxpixels_' + user.username);
        
        return `${header}.${payload}.${signature}`;
    }
    
    hashPassword(password) {
        // Simple hash for demo (in real app, use proper bcrypt or similar)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << AUTH_CONSTANTS.HASH_BIT_SHIFT) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
    
    findUserByEmail(email) {
        return Object.values(this.users).find(user => user.email === email);
    }
    
    sanitizeUser(user) {
        // eslint-disable-next-line no-unused-vars
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }
}