import { KeysCallback } from "./setupAudio";

export default class PitchNode extends AudioWorkletNode {
  keysCallback: KeysCallback | undefined;
  numAudioSamplesPerAnalysis: number = 0;

  init(
    wasmBytes: ArrayBuffer,
    modelBytes: ArrayBuffer,
    keysCallback: KeysCallback,
    numAudioSamplesPerAnalysis: number
  ) {
    this.keysCallback = keysCallback;
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
    } else if (event.type === "keys") {
      if (this.keysCallback) this.keysCallback(event.probabilities);
    }
  }
}
