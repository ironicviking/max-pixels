/**
 * Audio Manager for Max-Pixels
 * Manages game sound effects and audio using Web Audio API
 */

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.masterVolume = 0.7;
        this.isEnabled = true;
        this.isInitialized = false;
        
        this.initializeAudioContext();
        this.generateSounds();
    }
    
    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            this.isInitialized = true;
        } catch (error) {
            console.warn('Web Audio API not supported, audio disabled:', error);
            this.isEnabled = false;
        }
    }
    
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    generateSounds() {
        if (!this.isEnabled) return;
        
        this.generateThrusterSound();
        this.generateCollisionSound();
        this.generateAmbientHum();
    }
    
    generateThrusterSound() {
        const thrusterBuffer = this.createNoiseBuffer(0.3, (freq, time) => {
            const base = Math.sin(freq * 80 * time) * 0.4;
            const noise = (Math.random() - 0.5) * 0.3;
            const envelope = Math.exp(-time * 2);
            return (base + noise) * envelope * 0.8;
        });
        
        this.sounds.set('thruster', thrusterBuffer);
    }
    
    generateCollisionSound() {
        const collisionBuffer = this.createNoiseBuffer(0.5, (freq, time) => {
            const impact = Math.sin(freq * 200 * time) * Math.exp(-time * 8);
            const rumble = Math.sin(freq * 60 * time) * Math.exp(-time * 3);
            const noise = (Math.random() - 0.5) * 0.4 * Math.exp(-time * 6);
            return (impact * 0.7 + rumble * 0.3 + noise) * 0.9;
        });
        
        this.sounds.set('collision', collisionBuffer);
    }
    
    generateAmbientHum() {
        const ambientBuffer = this.createNoiseBuffer(2.0, (freq, time) => {
            const hum1 = Math.sin(freq * 40 * time) * 0.2;
            const hum2 = Math.sin(freq * 43 * time) * 0.15;
            const modulation = 1 + Math.sin(freq * 0.5 * time) * 0.1;
            return (hum1 + hum2) * modulation * 0.3;
        });
        
        this.sounds.set('ambient', ambientBuffer);
    }
    
    createNoiseBuffer(duration, waveFunction) {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const time = i / sampleRate;
            const freq = 2 * Math.PI / sampleRate;
            data[i] = waveFunction(freq, time);
        }
        
        return buffer;
    }
    
    play(soundName, options = {}) {
        if (!this.isEnabled || !this.isInitialized) return null;
        
        this.resumeAudioContext();
        
        const buffer = this.sounds.get(soundName);
        if (!buffer) {
            console.warn(`Sound '${soundName}' not found`);
            return null;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        gainNode.gain.value = options.volume || 1.0;
        
        if (options.loop) {
            source.loop = true;
        }
        
        if (options.playbackRate) {
            source.playbackRate.value = options.playbackRate;
        }
        
        source.start(0);
        
        if (!options.loop && options.duration) {
            source.stop(this.audioContext.currentTime + options.duration);
        }
        
        return {
            source,
            gainNode,
            stop: () => source.stop(),
            setVolume: (volume) => {
                gainNode.gain.value = volume;
            },
            fadeOut: (duration = 0.5) => {
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01, 
                    this.audioContext.currentTime + duration
                );
                setTimeout(() => source.stop(), duration * 1000);
            }
        };
    }
    
    playThruster(intensity = 1.0) {
        return this.play('thruster', {
            volume: intensity * 0.6,
            playbackRate: 0.8 + intensity * 0.4,
            loop: true
        });
    }
    
    playCollision(intensity = 1.0) {
        return this.play('collision', {
            volume: intensity * 0.8,
            playbackRate: 0.7 + Math.random() * 0.6
        });
    }
    
    playAmbient() {
        return this.play('ambient', {
            volume: 0.3,
            loop: true
        });
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    enable() {
        this.isEnabled = true;
        if (!this.isInitialized) {
            this.initializeAudioContext();
            this.generateSounds();
        }
    }
    
    disable() {
        this.isEnabled = false;
    }
    
    stopAll() {
        // Note: In a full implementation, you'd track active sounds and stop them
        // For this basic version, sounds will naturally end or can be stopped individually
    }
}