use std::sync::Arc;

use realfft::{RealFftPlanner, RealToComplex};
use tract_onnx::{prelude::*, tract_hir::internal::InferenceOp};
use wasm_bindgen::prelude::*;
use web_sys::{
    window, AudioContext, MediaDevices, MediaStreamAudioSourceNode, MediaStreamConstraints,
    Navigator,
};

use crate::{
    music::key_from_freq,
    nn::{get_keys, get_model},
};

pub mod music;
pub mod nn;
#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

#[wasm_bindgen]
pub struct PitchDetector {
    sample_rate: usize,
    fft_size: usize,
    fft_plan: Arc<dyn RealToComplex<f32>>,
    model: SimplePlan<
        TypedFact,
        Box<dyn TypedOp>,
        tract_onnx::prelude::Graph<TypedFact, Box<dyn TypedOp>>,
    >,
    score_cb: js_sys::Function,
}

#[wasm_bindgen]
impl PitchDetector {
    pub fn new(
        sample_rate: usize,
        fft_size: usize,
        model_bytes: Vec<u8>,
        score_cb: js_sys::Function,
    ) -> PitchDetector {
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();
        log("Hello from wasm");

        log(format!(
            "sample_rate: {}, model bytes: {:?}",
            sample_rate,
            model_bytes.len()
        )
        .as_str());

        let mut planner = RealFftPlanner::<f32>::new();

        PitchDetector {
            sample_rate,
            fft_size: fft_size,
            fft_plan: planner.plan_fft_forward(fft_size),
            model: get_model(model_bytes),
            score_cb,
        }
    }

    pub fn put_pitch(&self, audio_data: &[f32]) {
        log("Pitch upd");
        let mut padded_audio_data = audio_data
            .iter()
            .copied()
            .enumerate()
            .map(|(i, x)| {
                x * f32::sin(i as f32 * std::f32::consts::PI / self.fft_size as f32).powf(2.0)
            })
            .collect::<Vec<_>>();

        let mut fft_result: Vec<_> = vec![Default::default(); self.fft_size / 2 + 1];
        self.fft_plan
            .process(&mut padded_audio_data, &mut fft_result)
            .unwrap();

        let magnitudes = fft_result
            .iter_mut()
            .map(|complex| (complex.re * complex.re + complex.im * complex.im).sqrt())
            .collect::<Vec<_>>();

        self.score_cb
            .call1(&JsValue::NULL, &JsValue::from(1))
            .unwrap();
    }
}
