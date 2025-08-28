/**
 * Authentication UI Components for Max-Pixels
 * Handles login/registration forms and user interface
 */

import { TRADING } from '../constants.js';

export class AuthUI {
    constructor(authService, containerElement) {
        this.auth = authService;
        this.container = containerElement;
        this.currentModal = null;
        
        this.init();
    }
    
    init() {
        this.createAuthButton();
        
        if (this.auth.isAuthenticated()) {
            this.showUserProfile();
        }
    }
    
    createAuthButton() {
        const authSection = document.createElement('div');
        authSection.className = 'auth-section';
        authSection.innerHTML = `
            <button id="authButton" class="auth-button">
                ${this.auth.isAuthenticated() ? 'Profile' : 'Login / Register'}
            </button>
        `;
        
        this.container.appendChild(authSection);
        
        document.getElementById('authButton').addEventListener('click', () => {
            if (this.auth.isAuthenticated()) {
                this.showUserProfile();
            } else {
                this.showLoginModal();
            }
        });
    }
    
    showLoginModal() {
        this.createModal('login-modal', this.getLoginModalHTML());
        this.setupLoginForm();
    }
    
    showRegisterModal() {
        this.createModal('register-modal', this.getRegisterModalHTML());
        this.setupRegisterForm();
    }
    
    showUserProfile() {
        const user = this.auth.getCurrentUser();
        this.createModal('profile-modal', this.getProfileModalHTML(user));
        this.setupProfileActions();
    }
    
    createModal(id, content) {
        this.closeModal();
        
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentModal = modal;
        
        // Close modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());
        
        // Prevent modal content clicks from closing modal
        modal.querySelector('.modal-content').addEventListener('click', (e) => e.stopPropagation());
    }
    
    closeModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
        }
    }
    
    getLoginModalHTML() {
        return `
            <h2>Login to Max-Pixels</h2>
            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="loginUsername">Username:</label>
                    <input type="text" id="loginUsername" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">Password:</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="auth-submit">Login</button>
                <div class="auth-error" id="loginError"></div>
            </form>
            <div class="auth-switch">
                <p>Don't have an account? <a href="#" id="switchToRegister">Register here</a></p>
            </div>
        `;
    }
    
    getRegisterModalHTML() {
        return `
            <h2>Join Max-Pixels</h2>
            <form id="registerForm" class="auth-form">
                <div class="form-group">
                    <label for="registerUsername">Username:</label>
                    <input type="text" id="registerUsername" required>
                    <small>3-20 characters, letters, numbers, and underscores only</small>
                </div>
                <div class="form-group">
                    <label for="registerEmail">Email:</label>
                    <input type="email" id="registerEmail" required>
                </div>
                <div class="form-group">
                    <label for="registerPassword">Password:</label>
                    <input type="password" id="registerPassword" required>
                    <small>At least 6 characters</small>
                </div>
                <button type="submit" class="auth-submit">Register</button>
                <div class="auth-error" id="registerError"></div>
            </form>
            <div class="auth-switch">
                <p>Already have an account? <a href="#" id="switchToLogin">Login here</a></p>
            </div>
        `;
    }
    
    getProfileModalHTML(user) {
        return `
            <h2>Commander ${user.username}</h2>
            <div class="profile-info">
                <div class="profile-stat">
                    <label>Level:</label>
                    <span>${user.level}</span>
                </div>
                <div class="profile-stat">
                    <label>Experience:</label>
                    <span>${user.experience.toLocaleString()}</span>
                </div>
                <div class="profile-stat">
                    <label>Credits:</label>
                    <span>${user.credits.toLocaleString()}</span>
                </div>
                <div class="profile-stat">
                    <label>Member Since:</label>
                    <span>${new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="profile-actions">
                <button id="logoutButton" class="auth-button logout">Logout</button>
            </div>
        `;
    }
    
    setupLoginForm() {
        const form = document.getElementById('loginForm');
        const errorDiv = document.getElementById('loginError');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            const result = await this.auth.login(username, password);
            
            if (result.success) {
                this.closeModal();
                this.updateAuthButton();
                this.showMessage('Welcome back, ' + result.user.username + '!', 'success');
            } else {
                errorDiv.textContent = result.message;
            }
        });
        
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterModal();
        });
    }
    
    setupRegisterForm() {
        const form = document.getElementById('registerForm');
        const errorDiv = document.getElementById('registerError');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            const result = await this.auth.register(username, email, password);
            
            if (result.success) {
                this.closeModal();
                this.updateAuthButton();
                this.showMessage('Welcome to Max-Pixels, ' + result.user.username + '!', 'success');
            } else {
                errorDiv.textContent = result.message;
            }
        });
        
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });
    }
    
    setupProfileActions() {
        document.getElementById('logoutButton').addEventListener('click', () => {
            this.auth.logout();
            this.closeModal();
            this.updateAuthButton();
            this.showMessage('Logged out successfully', 'info');
        });
    }
    
    updateAuthButton() {
        const button = document.getElementById('authButton');
        if (button) {
            button.textContent = this.auth.isAuthenticated() ? 'Profile' : 'Login / Register';
        }
    }
    
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `game-message message-${type}`;
        message.textContent = text;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => message.remove(), TRADING.FADE_OUT_DELAY);
        }, TRADING.MESSAGE_DURATION);
    }
}