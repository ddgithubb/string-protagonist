pub fn key_from_freq(frequency: f32) -> usize {
    let key = (12.0 * (frequency / 440.0).log2() + 49.0).round() as usize;
    key
}
