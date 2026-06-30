export class AudioCapture {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  async start(
    deviceId: string | undefined,
    onAudioData: (data: ArrayBuffer) => void,
  ): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    });

    this.context = new AudioContext({ sampleRate: 16000 });
    const source = this.context.createMediaStreamSource(this.stream);

    // Use ScriptProcessorNode for raw PCM access
    this.processor = this.context.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16 PCM
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      onAudioData(int16.buffer);
    };

    source.connect(this.processor);
    this.processor.connect(this.context.destination);
  }

  stop(): void {
    this.processor?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.context?.close();
    this.processor = null;
    this.stream = null;
    this.context = null;
  }
}
