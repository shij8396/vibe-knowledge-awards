export class AudioManager {
    private context?: AudioContext;
    private gain?: GainNode;
    private oscillators: OscillatorNode[] = [];
    enabled = false;
    async toggle() {
        if (!this.context) {
            this.context = new AudioContext();
            this.gain = this.context.createGain();
            this.gain.gain.value = 0;
            this.gain.connect(this.context.destination);
            [55, 82.41, 110.15].forEach(frequency => { const o = this.context!.createOscillator(); o.frequency.value = frequency; o.type = 'sine'; o.connect(this.gain!); o.start(); this.oscillators.push(o); });
        }
        await this.context.resume();
        this.enabled = !this.enabled;
        this.gain!.gain.setTargetAtTime(this.enabled ? .026 : 0, this.context.currentTime, .4);
        return this.enabled;
    }
    suspend() { if (this.context?.state === 'running')
        void this.context.suspend().catch(() => {}); }
    resume() { if (this.enabled)
        void this.context?.resume().catch(() => {}); }
    dispose() { this.oscillators.forEach(o => { o.stop(); o.disconnect(); }); this.gain?.disconnect(); void this.context?.close().catch(() => {}); }
}
