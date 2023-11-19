import "/TextEncoder.js";
import init, { PitchDetector } from "/audio/audio.js";

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = Float32Array.of(0);
    this.totalSamples = 0;
    this.numAudioSamplesPerAnalysis = 0;
    this.port.onmessage = (event) => this.onmessage(event.data);
    this.detector = null;
  }

  onmessage(event) {
    if (event.type === "send-wasm-module") {
      init(WebAssembly.compile(event.wasmBytes)).then(() => {
        this.port.postMessage({ type: "wasm-module-loaded" });
      });
    } else if (event.type === "init-detector") {
      const { sampleRate, numAudioSamplesPerAnalysis } = event;

      this.numAudioSamplesPerAnalysis = numAudioSamplesPerAnalysis;

      this.detector = PitchDetector.new(sampleRate, numAudioSamplesPerAnalysis);

      this.samples = new Float32Array(numAudioSamplesPerAnalysis).fill(0);
      this.totalSamples = 0;
    }
  }

  process(inputs, outputs, parameters) {
    const inputChannels = inputs[0];
    const inputSamples = inputChannels[0];

    if (this.totalSamples < this.numAudioSamplesPerAnalysis) {
      for (const sampleValue of inputSamples) {
        this.samples[this.totalSamples++] = sampleValue;
      }
    } else {
      const numNewSamples = inputSamples.length;
      const numExistingSamples = this.samples.length - numNewSamples;
      for (let i = 0; i < numExistingSamples; i++) {
        this.samples[i] = this.samples[i + numNewSamples];
      }
      for (let i = 0; i < numNewSamples; i++) {
        this.samples[numExistingSamples + i] = inputSamples[i];
      }
      this.totalSamples += inputSamples.length;
    }

    if (this.totalSamples >= this.numAudioSamplesPerAnalysis && this.detector) {
      const result = this.detector.get_pitch(this.samples);

      if (result !== 0) {
        this.port.postMessage({ type: "pitch", pitch: result });
      }
    }
    return true;
  }
}

registerProcessor("PitchProcessor", PitchProcessor);
