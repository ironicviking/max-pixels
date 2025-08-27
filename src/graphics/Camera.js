/**
 * Camera System for Max-Pixels
 * Provides smooth following, zoom, and viewport management for space navigation
 */

export class Camera {
    constructor(svgElement, viewBox = { width: 1920, height: 1080 }) {
        this.svg = svgElement;
        this.viewBox = viewBox;
        this.position = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.zoom = 1;
        this.targetZoom = 1;
        
        this.smoothing = 0.08;
        this.zoomSmoothness = 0.1;
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        
        this.bounds = {
            minX: -1000,
            maxX: 3000,
            minY: -1000,
            maxY: 2000
        };
        
        this.updateViewBox();
    }
    
    follow(targetX, targetY) {
        this.target.x = targetX;
        this.target.y = targetY;
    }
    
    setZoom(zoom) {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    }
    
    zoomIn(factor = 1.2) {
        this.setZoom(this.targetZoom * factor);
    }
    
    zoomOut(factor = 1.2) {
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
    
    setSmoothness(smoothing = 0.08) {
        this.smoothing = Math.max(0.01, Math.min(1, smoothing));
    }
    
    setZoomLimits(minZoom = 0.5, maxZoom = 3.0) {
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
    
    shake(intensity = 10, duration = 300) {
        const originalSmoothness = this.smoothing;
        this.smoothing = 1;
        
        const startTime = Date.now();
        const shakeLoop = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const shakeAmount = intensity * (1 - elapsed / duration);
                this.position.x += (Math.random() - 0.5) * shakeAmount;
                this.position.y += (Math.random() - 0.5) * shakeAmount;
                requestAnimationFrame(shakeLoop);
            } else {
                this.smoothing = originalSmoothness;
            }
        };
        
        requestAnimationFrame(shakeLoop);
    }
}