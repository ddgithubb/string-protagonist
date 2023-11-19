import { OnScoreTickCallback } from "./setupAudio";

export default class PitchNode extends AudioWorkletNode {
  onScoreTickCallback: OnScoreTickCallback | undefined;
  numAudioSamplesPerAnalysis: number = 0;

  init(
    wasmBytes: ArrayBuffer,
    modelBytes: ArrayBuffer,
    onPitchDetectedCallback: OnScoreTickCallback,
    numAudioSamplesPerAnalysis: number
  ) {
    this.onScoreTickCallback = onPitchDetectedCallback;
    this.numAudioSamplesPerAnalysis = numAudioSamplesPerAnalysis;

    // Listen to messages sent from the audio processor.
    this.port.onmessage = (event) => this.onmessage(event.data);

    this.port.postMessage({
      type: "send-wasm-module",
      wasmBytes,
      modelBytes,
    });
  }

  onmessage(event: any) {
    if (event.type === "wasm-module-loaded") {
      this.port.postMessage({
        type: "init-detector",
        sampleRate: this.context.sampleRate,
        numAudioSamplesPerAnalysis: this.numAudioSamplesPerAnalysis,
      });
    } else if (event.type === "pitch") {
      if (this.onScoreTickCallback) this.onScoreTickCallback(event.pitch);
    }
  }
}
