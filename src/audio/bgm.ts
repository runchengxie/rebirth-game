type OscillatorPair = {
  osc: OscillatorNode;
  gain: GainNode;
};

const chordProgression = [
  [261.63, 329.63, 392.0],
  [293.66, 349.23, 440.0],
  [246.94, 329.63, 392.0],
  [220.0, 277.18, 329.63],
];

export class ProceduralBgm {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active: OscillatorPair[] = [];
  private timer: number | null = null;
  private step = 0;
  private volume = 0.22;

  async start() {
    if (this.context) {
      await this.context.resume();
      return;
    }

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.context.destination);
    this.playStep();
  }

  stop() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.releaseActive();
    if (this.context) {
      void this.context.close();
      this.context = null;
      this.master = null;
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(0.7, volume));
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.08);
    }
  }

  private playStep() {
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    const now = context.currentTime;
    const chord = chordProgression[this.step % chordProgression.length];
    this.releaseActive(now);
    this.active = chord.map((frequency, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.value = frequency / (index === 0 ? 2 : 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(index === 0 ? 0.12 : 0.055, now + 0.24);
      gain.gain.setTargetAtTime(0.035, now + 1.2, 0.9);
      osc.connect(gain).connect(master);
      osc.start(now);
      return { osc, gain };
    });

    this.step += 1;
    this.timer = window.setTimeout(() => this.playStep(), 2600);
  }

  private releaseActive(at = this.context?.currentTime ?? 0) {
    this.active.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(at);
        gain.gain.setTargetAtTime(0, at, 0.08);
        osc.stop(at + 0.35);
      } catch {
        // Oscillators may already be stopped during rapid remounts.
      }
    });
    this.active = [];
  }
}
