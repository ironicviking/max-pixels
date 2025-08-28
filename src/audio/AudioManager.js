/**
 * Audio Manager for Max-Pixels
 * Manages game sound effects and audio using Web Audio API
 */

import { AUDIO } from '../constants.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.masterVolume = 0.7;
        this.isEnabled = this.loadAudioPreference();
        this.isInitialized = false;
        
        // Audio visualization properties
        this.analyser = null;
        this.visualizationCallbacks = new Set();
        
        if (this.isEnabled) {
            this.initializeAudioContext();
            this.generateSounds();
            this.setupAudioVisualization();
        }
    }
    
    initializeAudioContext() {
        // Check if we're in a browser environment with AudioContext support
        if (typeof window === 'undefined' || (!window.AudioContext && !window.webkitAudioContext)) {
            this.isEnabled = false;
            return;
        }
        
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
        this.generateLaserSound();
        this.generateWeaponRechargeSound();
    }
    
    generateThrusterSound() {
        const thrusterBuffer = this.createNoiseBuffer(AUDIO.AMBIENT_VOLUME, (freq, time) => {
            const base = Math.sin(freq * AUDIO.FREQUENCY_MID * time) * AUDIO.VOLUME_LOW;
            const noise = (Math.random() - AUDIO.FADE_DURATION) * AUDIO.AMBIENT_VOLUME;
            const envelope = Math.exp(-time * AUDIO.ENVELOPE_DECAY);
            return (base + noise) * envelope * AUDIO.THRUSTER_VOLUME;
        });
        
        this.sounds.set('thruster', thrusterBuffer);
    }
    
    generateCollisionSound() {
        const collisionBuffer = this.createNoiseBuffer(AUDIO.FADE_DURATION, (freq, time) => {
            const impact = Math.sin(freq * AUDIO.FREQUENCY_HIGH * time) * Math.exp(-time * AUDIO.IMPACT_DECAY);
            const rumble = Math.sin(freq * AUDIO.FREQUENCY_MID * time) * Math.exp(-time * AUDIO.RUMBLE_DECAY);
            const noise = (Math.random() - AUDIO.FADE_DURATION) * AUDIO.NOISE_MIX * Math.exp(-time * AUDIO.NOISE_DECAY);
            return (impact * AUDIO.IMPACT_MIX + rumble * AUDIO.AMBIENT_VOLUME + noise) * AUDIO.SOUND_MIX;
        });
        
        this.sounds.set('collision', collisionBuffer);
    }
    
    generateAmbientHum() {
        const ambientBuffer = this.createNoiseBuffer(2.0, (freq, time) => {
            const hum1 = Math.sin(freq * AUDIO.FREQUENCY_LOW * time) * AUDIO.HUM_MIX;
            const hum2 = Math.sin(freq * AUDIO.HUM_FREQUENCY * time) * AUDIO.FADE_DURATION;
            const modulation = 1 + Math.sin(freq * AUDIO.FADE_DURATION * time) * AUDIO.VOLUME_LOW;
            return (hum1 + hum2) * modulation * AUDIO.AMBIENT_VOLUME;
        });
        
        this.sounds.set('ambient', ambientBuffer);
    }
    
    generateLaserSound() {
        const laserBuffer = this.createNoiseBuffer(AUDIO.VOLUME_HIGH, (freq, time) => {
            const beam = Math.sin(freq * AUDIO.FREQUENCY_HIGH * AUDIO.LASER_FREQUENCY_MULT * time) * Math.exp(-time * AUDIO.LASER_BEAM_DECAY);
            const zap = Math.sin(freq * AUDIO.FREQUENCY_HIGH * AUDIO.LASER_ZAP_FREQUENCY_MULT * time) * Math.exp(-time * AUDIO.LASER_ZAP_DECAY);
            const energy = (Math.random() - AUDIO.FADE_DURATION) * AUDIO.VOLUME_LOW * Math.exp(-time * AUDIO.LASER_ENERGY_DECAY);
            return (beam * AUDIO.SOUND_MIX + zap * AUDIO.VOLUME_HIGH + energy) * AUDIO.LASER_VOLUME;
        });
        
        this.sounds.set('laser', laserBuffer);
    }
    
    generateWeaponRechargeSound() {
        const rechargeBuffer = this.createNoiseBuffer(AUDIO.WEAPON_RECHARGE_DURATION, (freq, time) => {
            const chargeUp = Math.sin(freq * AUDIO.FREQUENCY_MID * time * (1 + time * AUDIO.WEAPON_RECHARGE_FREQUENCY_MULT)) * (time * AUDIO.WEAPON_RECHARGE_SPARKLE_MULT);
            const sparkle = Math.sin(freq * AUDIO.FREQUENCY_HIGH * time * AUDIO.WEAPON_RECHARGE_SPARKLE_MULT) * Math.sin(freq * AUDIO.WEAPON_RECHARGE_SPARKLE_WIDTH * time) * AUDIO.WEAPON_RECHARGE_SPARKLE_DECAY;
            const hum = Math.sin(freq * AUDIO.FREQUENCY_LOW * time) * AUDIO.WEAPON_RECHARGE_HUM_VOLUME * (1 - Math.exp(-time * AUDIO.WEAPON_RECHARGE_HUM_DECAY));
            return (chargeUp * AUDIO.WEAPON_RECHARGE_VOLUME + sparkle + hum) * Math.min(1, time * AUDIO.WEAPON_RECHARGE_FADEOUT_RATE) * AUDIO.VOLUME_MEDIUM;
        });
        
        this.sounds.set('weaponRecharge', rechargeBuffer);
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
            fadeOut: (duration = AUDIO.FADE_DURATION) => {
                gainNode.gain.exponentialRampToValueAtTime(
                    AUDIO.RAMP_TIME, 
                    this.audioContext.currentTime + duration
                );
                setTimeout(() => source.stop(), duration * AUDIO.SUSTAIN_TIME);
            }
        };
    }
    
    playThruster(intensity = 1.0) {
        return this.play('thruster', {
            volume: intensity * AUDIO.VOLUME_HIGH,
            playbackRate: AUDIO.THRUSTER_VOLUME + intensity * AUDIO.PLAYBACK_MIN,
            loop: true
        });
    }
    
    playCollision(intensity = 1.0) {
        return this.play('collision', {
            volume: intensity * AUDIO.COLLISION_VOLUME,
            playbackRate: AUDIO.PLAYBACK_BASE + Math.random() * AUDIO.VOLUME_HIGH
        });
    }
    
    playAmbient() {
        return this.play('ambient', {
            volume: AUDIO.AMBIENT_VOLUME,
            loop: true
        });
    }
    
    playLaser(intensity = 1.0) {
        return this.play('laser', {
            volume: intensity * AUDIO.LASER_VOLUME,
            playbackRate: AUDIO.PLAYBACK_BASE + Math.random() * AUDIO.VOLUME_LOW
        });
    }
    
    playWeaponRecharge() {
        return this.play('weaponRecharge', {
            volume: AUDIO.VOLUME_MEDIUM,
            playbackRate: AUDIO.PLAYBACK_BASE + Math.random() * AUDIO.PLAYBACK_VARIATION
        });
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    enable() {
        if (!this.isInitialized) {
            this.initializeAudioContext();
            this.generateSounds();
            this.setupAudioVisualization();
        }
        // Always set enabled to true after initialization attempt
        // This ensures the enabled state reflects the user's intent, even in headless environments
        this.isEnabled = true;
        this.saveAudioPreference();
    }
    
    disable() {
        this.isEnabled = false;
        this.saveAudioPreference();
    }
    
    get enabled() {
        return this.isEnabled;
    }
    
    loadAudioPreference() {
        try {
            const saved = localStorage.getItem('maxPixels.audio.enabled');
            return saved !== null ? JSON.parse(saved) : true; // Default to enabled
        } catch (error) {
            console.warn('Failed to load audio preference:', error);
            return true; // Default to enabled
        }
    }
    
    saveAudioPreference() {
        try {
            localStorage.setItem('maxPixels.audio.enabled', JSON.stringify(this.isEnabled));
        } catch (error) {
            console.warn('Failed to save audio preference:', error);
        }
    }
    
    stopAll() {
        // Note: In a full implementation, you'd track active sounds and stop them
        // For this basic version, sounds will naturally end or can be stopped individually
    }
    
    setupAudioVisualization() {
        if (!this.audioContext) return;
        
        try {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect master gain to analyser
            if (this.masterGain) {
                this.masterGain.connect(this.analyser);
            }
            
            this.startVisualizationLoop();
        } catch (error) {
            console.warn('Audio visualization setup failed:', error);
        }
    }
    
    startVisualizationLoop() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVisualization = () => {
            if (!this.isEnabled || !this.analyser) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            
            // Notify all visualization callbacks with frequency data
            this.visualizationCallbacks.forEach(callback => {
                try {
                    callback(dataArray, bufferLength);
                } catch (error) {
                    console.warn('Visualization callback error:', error);
                }
            });
            
            requestAnimationFrame(updateVisualization);
        };
        
        updateVisualization();
    }
    
    addVisualizationCallback(callback) {
        if (typeof callback === 'function') {
            this.visualizationCallbacks.add(callback);
            return () => this.visualizationCallbacks.delete(callback);
        }
        return null;
    }
    
    removeVisualizationCallback(callback) {
        return this.visualizationCallbacks.delete(callback);
    }
    
    getAudioData() {
        if (!this.analyser) return null;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);
        const waveformData = new Uint8Array(bufferLength);
        
        this.analyser.getByteFrequencyData(frequencyData);
        this.analyser.getByteTimeDomainData(waveformData);
        
        return {
            frequency: frequencyData,
            waveform: waveformData,
            bufferLength
        };
    }
}