import PitchNode from "./PitchNode";

async function getWebAudioMediaStream() {
  if (!window.navigator.mediaDevices) {
    throw new Error(
      "This browser does not support web audio or it is not enabled."
    );
  }

  try {
    const result = await window.navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    });

    return result;
  } catch (e: any) {
    switch (e.name) {
      case "NotAllowedError":
        throw new Error(
          "A recording device was found but has been disallowed for this application. Enable the device in the browser settings."
        );

      case "NotFoundError":
        throw new Error(
          "No recording device was found. Please attach a microphone and click Retry."
        );

      default:
        throw e;
    }
  }
}

export type PitchDetectedCallback = (pitch: number[]) => void;

export async function setupAudio(
  onPitchDetectedCallback: PitchDetectedCallback
) {
  // Get the browser audio. Awaits user "allowing" it for the current tab.
  const mediaStream = await getWebAudioMediaStream();

  const context = new window.AudioContext({
    latencyHint: "interactive",
    sampleRate: 44100,
  });
  const audioSource = context.createMediaStreamSource(mediaStream);

  let node;

  try {
    const response = await window.fetch("/audio/audio_bg.wasm");
    const wasmBytes = await response.arrayBuffer();

    const processorUrl = "/PitchProcessor.js";
    try {
      await context.audioWorklet.addModule(processorUrl);
    } catch (e: any) {
      throw new Error(
        `Failed to load audio analyzer worklet at url: ${processorUrl}. Further info: ${e.message}`
      );
    }

    node = new PitchNode(context, "PitchProcessor");

    const numAudioSamplesPerAnalysis = 1 << 14;

    node.init(wasmBytes, onPitchDetectedCallback, numAudioSamplesPerAnalysis);

    audioSource.connect(node);

    node.connect(context.destination);
  } catch (err: any) {
    throw new Error(
      `Failed to load audio analyzer WASM module. Further info: ${err.message}`
    );
  }

  return { context, node };
}
