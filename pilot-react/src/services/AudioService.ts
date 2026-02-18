export class AudioService {
  private ctx: AudioContext;

  constructor() {
    this.ctx = new AudioContext();
  }

  playEngineSound(isBoosted: boolean): void {
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.frequency.value = 80 + (isBoosted ? 40 : 0);
    oscillator.type = 'sawtooth';

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    oscillator.start(this.ctx.currentTime);
    oscillator.stop(this.ctx.currentTime + 0.1);
  }

  playShootSound(): void {
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.frequency.setValueAtTime(800, this.ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    oscillator.type = 'square';

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    oscillator.start(this.ctx.currentTime);
    oscillator.stop(this.ctx.currentTime + 0.15);
  }

  playExplosionSound(): void {
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    const oscillator = this.ctx.createOscillator();
    oscillator.frequency.setValueAtTime(100, this.ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.5);
    oscillator.type = 'sine';

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    oscillator.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noise.start(this.ctx.currentTime);
    oscillator.start(this.ctx.currentTime);
    noise.stop(this.ctx.currentTime + 0.5);
    oscillator.stop(this.ctx.currentTime + 0.5);
  }

  playRollSound(): void {
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscillator.connect(gain);
    gain.connect(this.ctx.destination);

    oscillator.frequency.setValueAtTime(400, this.ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.3);
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

    oscillator.start(this.ctx.currentTime);
    oscillator.stop(this.ctx.currentTime + 0.3);
  }

  destroy(): void {
    this.ctx.close();
  }
}
