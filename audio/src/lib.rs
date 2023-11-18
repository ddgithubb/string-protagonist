use std::sync::Arc;

use realfft::{RealFftPlanner, RealToComplex};
use wasm_bindgen::prelude::*;
use web_sys::{
    window, AudioContext, MediaDevices, MediaStreamAudioSourceNode, MediaStreamConstraints,
    Navigator,
};

use crate::music::key_from_freq;

pub mod music;
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
    //session: wonnx::Session,
}

#[wasm_bindgen]
impl PitchDetector {
    pub fn new(sample_rate: usize, fft_size: usize) -> PitchDetector {
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();
        log("Hello from wasm");

        let mut planner = RealFftPlanner::<f32>::new();

        //let model_path = Path::new("/freq_predictor.onnx");
        //let session = wonnx::Session::from_path(model_path).await.unwrap();

        PitchDetector {
            sample_rate,
            fft_size: fft_size,
            fft_plan: planner.plan_fft_forward(fft_size),
            //       session: session,
        }
    }

    pub fn get_pitch(&self, audio_data: &[f32]) -> Vec<f32> {
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

        let mut magnitudes = fft_result
            .iter_mut()
            .map(|complex| (complex.re * complex.re + complex.im * complex.im).sqrt())
            .collect::<Vec<_>>();

        /*let mut input_data = HashMap::new();
        input_data.insert("arg0".to_string(), magnitudes.collect::<Vec<_>>().into());*/

        //let result = self.session.run(&input_data).await.unwrap();

        /*let mut keys = result
        .get("sigmoid_1")
        .unwrap()
        .as_slice::<f32>()
        .unwrap()
        .iter()
        .map(|x| key_from_freq(*x))
        .collect::<Vec<_>>();*/

        // subtract harmonic overtones

        for (i, x) in magnitudes.clone().iter().enumerate() {
            if i == 0 {
                continue;
            }
            for j in (i..magnitudes.len()).step_by(i) {
                magnitudes[j] -= *x / j as f32;
            }
        }

        let mut keys = [0.0f32; 88].to_vec();
        let mut hi = 10.0f32;
        for (i, x) in magnitudes.iter().enumerate() {
            let hz = i as f32 * self.sample_rate as f32 / self.fft_size as f32;
            keys[key_from_freq(hz) % 12] += x;
            hi = hi.max(keys[key_from_freq(hz) % 12]);
        }

        let mut vals = keys.clone();
        vals.sort_by(|a, b| b.partial_cmp(a).unwrap());

        // divide by highest note,
        keys.iter_mut().for_each(|x| *x /= vals[1]);

        keys
    }
}
