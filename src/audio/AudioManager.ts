export class AudioManager {
  private audioContext: AudioContext | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bgmBuffer: AudioBuffer | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = this.volume;
    
    this.isInitialized = true;
  }

  async loadBGM(url: string): Promise<void> {
    if (!this.audioContext) await this.init();
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load audio: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      this.bgmBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('🎵 Soundtrack loaded successfully!');
    } catch (error) {
      console.error('Failed to load BGM:', error);
    }
  }

  playBGM(loop: boolean = true): void {
    if (!this.audioContext || !this.bgmBuffer) {
      console.warn('Audio not ready yet');
      return;
    }
    
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.stopBGM();
    
    this.bgmSource = this.audioContext.createBufferSource();
    this.bgmSource.buffer = this.bgmBuffer;
    this.bgmSource.loop = loop;
    this.bgmSource.connect(this.gainNode!);
    this.bgmSource.start(0);
    
    console.log('🎵 Playing soundtrack');
  }

  stopBGM(): void {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch (e) {
        // Source might already be stopped
      }
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
    }
    console.log(this.isMuted ? '🔇 Muted' : '🔊 Unmuted');
    return this.isMuted;
  }

  isAudioMuted(): boolean {
    return this.isMuted;
  }

  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  suspend(): void {
    this.audioContext?.suspend();
  }
}
