/**
 * Authentication Service for Max-Pixels
 * Handles user registration, login, and session management
 */

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('maxPixelsToken');
        this.apiBase = '/api/auth'; // Future server endpoint
        
        // For now, simulate with localStorage until server is implemented
        this.users = JSON.parse(localStorage.getItem('maxPixelsUsers')) || {};
        
        if (this.token) {
            this.validateToken();
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
            localStorage.setItem('maxPixelsUsers', JSON.stringify(this.users));
            
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
            
            localStorage.setItem('maxPixelsToken', token);
            
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
        localStorage.removeItem('maxPixelsToken');
        
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
    
    isAuthenticated() {
        return Boolean(this.currentUser);
    }
    
    // Validation helpers
    validateRegistrationData(username, email, password) {
        if (!username || username.length < 3 || username.length > 20) {
            throw new Error('Username must be between 3 and 20 characters');
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }
        
        if (!email || !this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Utility functions
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateToken(user) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            username: user.username,
            userId: user.id,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
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
            hash = ((hash << 5) - hash) + char;
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