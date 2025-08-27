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