import { PitchDetectedCallback } from "./setupAudio";

export default class PitchNode extends AudioWorkletNode {
  onPitchDetectedCallback: PitchDetectedCallback | undefined;
  numAudioSamplesPerAnalysis: number = 0;

  init(
    wasmBytes: ArrayBuffer,
    onPitchDetectedCallback: PitchDetectedCallback,
    numAudioSamplesPerAnalysis: number
  ) {
    this.onPitchDetectedCallback = onPitchDetectedCallback;
    this.numAudioSamplesPerAnalysis = numAudioSamplesPerAnalysis;

    // Listen to messages sent from the audio processor.
    this.port.onmessage = (event) => this.onmessage(event.data);

    this.port.postMessage({
      type: "send-wasm-module",
      wasmBytes,
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
      if (this.onPitchDetectedCallback)
        this.onPitchDetectedCallback(event.pitch);
    }
  }
}
