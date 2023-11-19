use std::{
    f32::consts::PI,
    fs::{self, OpenOptions},
    sync::Arc,
};

use hound;
use rand::Rng;
use realfft::RealToComplex;

use std::fs::*;
use std::io::*;
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

pub fn augment(window: Vec<f32>) -> Vec<f32> {
    // bandpass filter from random lb to random ub
    let mut rng = rand::thread_rng();
    let lb = rng.gen_range(0..window.len() / 6);
    let ub = rng.gen_range(lb.max((window.len() * 4) / 5)..window.len());

    let f = |x: f32| {
        1.0f32 / (1.0f32 + (1.1f32).powf(lb as f32 - x))
            - 1.0f32 / (1.0f32 + (1.1f32).powf(ub as f32 - x))
    };

    window
        .iter()
        .enumerate()
        .map(|(i, x)| x * f(i as f32))
        .collect::<Vec<_>>()
}

fn main() {
    let window_size = 1 << 11;
    let fft_plan: Arc<dyn RealToComplex<f32>> =
        realfft::RealFftPlanner::<f32>::new().plan_fft_forward(window_size);
    let step = window_size;

    fs::write("data.csv", "").unwrap();
    fs::write("out.csv", "").unwrap();

    for audio_file in fs::read_dir("audio").unwrap() {
        let file = audio_file.unwrap();
        println!("file {:?}", file.path());
        let path = file.path();
        let name = path
            .file_stem()
            .unwrap()
            .to_str()
            .unwrap()
            .replace("_mic", "");
        let mut reader = hound::WavReader::open(file.path()).unwrap();
        println!("reader {:?}", reader.spec());
        let obj: serde_json::Value = serde_json::from_str(
            &fs::read_to_string(format!("annotation/{}.jams", name).as_str()).unwrap(),
        )
        .unwrap();
        println!("file {:?} {:?}", file, obj["file_metadata"]);
        let samples = reader
            .samples::<i16>()
            .map(|x| x.unwrap())
            .collect::<Vec<i16>>()
            .as_slice()
            .windows(window_size)
            .enumerate()
            .step_by(step)
            .map(|(i, x)| {
                let time = (i) as f32 / reader.spec().sample_rate as f32;
                let mut notes = [0; 12];
                // find all notes in that time
                for annot in obj["annotations"].as_array().unwrap() {
                    if annot["namespace"] != "note_midi" {
                        continue;
                    }
                    for note in annot["data"].as_array().unwrap() {
                        let start = note["time"].as_f64().unwrap() as f32;
                        let end = start + note["duration"].as_f64().unwrap() as f32;
                        if start <= time && time <= end {
                            notes[((note["value"].as_f64().unwrap().round() as usize) as usize)
                                % 12] = 1;
                        }
                    }
                }

                let notes = notes.iter().map(|x| *x as f32).collect::<Vec<_>>();
                let mut processed: Vec<f32> =
                    augment(process_window(x.clone().to_vec(), fft_plan.clone()));
                (processed, notes)
            })
            .collect::<Vec<_>>();

        // write to file
        let mut file = OpenOptions::new()
            .write(true)
            .append(true)
            .open("data.csv")
            .unwrap();
        let mut out = OpenOptions::new()
            .write(true)
            .append(true)
            .open("out.csv")
            .unwrap();
        for (sound, notes) in samples {
            writeln!(
                file,
                "{}",
                &sound
                    .iter()
                    .map(|x| x.to_string())
                    .collect::<Vec<_>>()
                    .join(","),
            )
            .unwrap();
            writeln!(
                out,
                "{}",
                &notes
                    .iter()
                    .map(|x| x.to_string())
                    .collect::<Vec<_>>()
                    .join(","),
            )
            .unwrap();
        }
    }
}
