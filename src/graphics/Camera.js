/**
 * Camera System for Max-Pixels
 * Provides smooth following, zoom, and viewport management for space navigation
 */

import { CAMERA } from '../constants.js';

export class Camera {
    constructor(svgElement, viewBox = { width: 1920, height: 1080 }) {
        this.svg = svgElement;
        this.viewBox = viewBox;
        this.position = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.zoom = 1;
        this.targetZoom = 1;
        
        this.smoothing = CAMERA.FOLLOW_LERP;
        this.zoomSmoothness = CAMERA.ZOOM_SMOOTHNESS;
        this.minZoom = CAMERA.MIN_ZOOM;
        this.maxZoom = CAMERA.MAX_ZOOM;
        
        this.bounds = {
            minX: -1000,
            maxX: 3000,
            minY: -1000,
            maxY: 2000
        };
        
        this.updateViewBox();
    }
    
    get x() {
        return this.position.x;
    }
    
    get y() {
        return this.position.y;
    }
    
    follow(targetX, targetY) {
        this.target.x = targetX;
        this.target.y = targetY;
    }
    
    setZoom(zoom) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
    
    setZoomImmediate(zoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        this.targetZoom = this.zoom;
        this.updateViewBox();
    }
    
    zoomIn(factor = CAMERA.ZOOM_FACTOR) {
        this.setZoom(this.targetZoom * factor);
    }
    
    zoomOut(factor = CAMERA.ZOOM_FACTOR) {
        this.setZoom(this.targetZoom / factor);
    }
    
    update() {
        const dx = this.target.x - this.position.x;
        const dy = this.target.y - this.position.y;
        
        this.position.x += dx * this.smoothing;
        this.position.y += dy * this.smoothing;
        
        this.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.position.x));
        this.position.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.position.y));
        
        const zoomDiff = this.targetZoom - this.zoom;
        this.zoom += zoomDiff * this.zoomSmoothness;
        
        this.updateViewBox();
    }
    
    updateViewBox() {
        const halfWidth = (this.viewBox.width / this.zoom) / 2;
        const halfHeight = (this.viewBox.height / this.zoom) / 2;
        
        const viewBoxX = this.position.x - halfWidth;
        const viewBoxY = this.position.y - halfHeight;
        const viewBoxWidth = this.viewBox.width / this.zoom;
        const viewBoxHeight = this.viewBox.height / this.zoom;
        
        this.svg.setAttribute('viewBox', 
            `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`
        );
    }
    
    worldToScreen(worldX, worldY) {
        const halfWidth = (this.viewBox.width / this.zoom) / 2;
        const halfHeight = (this.viewBox.height / this.zoom) / 2;
        
        const screenX = ((worldX - (this.position.x - halfWidth)) * this.zoom);
        const screenY = ((worldY - (this.position.y - halfHeight)) * this.zoom);
        
        return { x: screenX, y: screenY };
    }
    
    screenToWorld(screenX, screenY) {
        const halfWidth = (this.viewBox.width / this.zoom) / 2;
        const halfHeight = (this.viewBox.height / this.zoom) / 2;
        
        const worldX = (screenX / this.zoom) + (this.position.x - halfWidth);
        const worldY = (screenY / this.zoom) + (this.position.y - halfHeight);
        
        return { x: worldX, y: worldY };
    }
    
    getVisibleBounds() {
        const halfWidth = (this.viewBox.width / this.zoom) / 2;
        const halfHeight = (this.viewBox.height / this.zoom) / 2;
        
        return {
            left: this.position.x - halfWidth,
            right: this.position.x + halfWidth,
            top: this.position.y - halfHeight,
            bottom: this.position.y + halfHeight
        };
    }
    
    isVisible(x, y, radius = 0) {
        const bounds = this.getVisibleBounds();
        return (
            x + radius > bounds.left &&
            x - radius < bounds.right &&
            y + radius > bounds.top &&
            y - radius < bounds.bottom
        );
    }
    
    setBounds(minX, maxX, minY, maxY) {
        this.bounds = { minX, maxX, minY, maxY };
    }
    
    setSmoothness(smoothing = CAMERA.FOLLOW_LERP) {
        this.smoothing = Math.max(CAMERA.FOLLOW_THRESHOLD, Math.min(1, smoothing));
    }
    
    setZoomLimits(minZoom = CAMERA.MIN_ZOOM, maxZoom = CAMERA.MAX_ZOOM) {
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.targetZoom = Math.max(minZoom, Math.min(maxZoom, this.targetZoom));
    }
    
    centerOn(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.target.x = x;
        this.target.y = y;
        this.updateViewBox();
    }
    
    focusOnPoint(x, y, zoom = this.targetZoom) {
        this.follow(x, y);
        this.setZoom(zoom);
    }
    
    shake(intensity = CAMERA.SHAKE_INTENSITY, duration = CAMERA.SHAKE_DURATION) {
        const originalSmoothness = this.smoothing;
        this.smoothing = 1;
        
        const startTime = Date.now();
        const shakeLoop = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const shakeAmount = intensity * (1 - elapsed / duration);
                this.position.x += (Math.random() - CAMERA.VIEWPORT_CENTER) * shakeAmount;
                this.position.y += (Math.random() - CAMERA.VIEWPORT_CENTER) * shakeAmount;
                requestAnimationFrame(shakeLoop);
            } else {
                this.smoothing = originalSmoothness;
            }
        };
        
        requestAnimationFrame(shakeLoop);
    }
}