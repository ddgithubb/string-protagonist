use std::{path::Path, sync::Arc};

use tract_onnx::{pb::ModelProto, prelude::*, tract_hir::internal::InferenceOp};

use crate::log;

pub fn process_window(
    window: Vec<i16>,
    fft_plan: Arc<dyn realfft::RealToComplex<f32>>,
) -> Vec<f32> {
    let mut window = window
        .iter()
        .copied()
        .enumerate()
        .map(|(i, x)| {
            let x = x as f32 / std::i16::MAX as f32;
            x * f32::sin(i as f32 * std::f32::consts::PI / window.len() as f32).powf(2.0)
        })
        .collect::<Vec<_>>();

    let mut fft_result: Vec<_> = vec![Default::default(); &window.len() / 2 + 1];
    fft_plan.process(&mut window, &mut fft_result).unwrap();
    fft_result.iter().map(|x| x.norm()).collect::<Vec<_>>()
}

pub fn get_model(
    bytes: Vec<u8>,
) -> SimplePlan<TypedFact, Box<dyn TypedOp>, tract_onnx::prelude::Graph<TypedFact, Box<dyn TypedOp>>>
{
    let onnx = tract_onnx::onnx();
    log(format!("Loading model... bytes: {:?}", bytes).as_str());
    let onnx = onnx
        .model_for_read(&mut std::io::Cursor::new(bytes))
        .unwrap()
        .into_optimized()
        .unwrap()
        .into_runnable()
        .unwrap();
    onnx
}

pub fn get_keys(
    model: &SimplePlan<
        TypedFact,
        Box<dyn TypedOp>,
        tract_onnx::prelude::Graph<TypedFact, Box<dyn TypedOp>>,
    >,
    magnitudes: Vec<f32>,
) -> Vec<f32> {
    // start a timer
    //let start = js_sys::Date::now();

    let input: Tensor = tract_ndarray::Array2::from_shape_vec((1, magnitudes.len()), magnitudes)
        .unwrap()
        .into();
    let result = model.run(tvec![input.into()]).unwrap();
    let keys = result[0].to_array_view::<f32>().unwrap();
    keys.iter().copied().collect::<Vec<_>>()
}
