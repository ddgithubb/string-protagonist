const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function tuningToNoteName(tuning) {
    return tuning.map(note => noteNames[note % 12]);
}

export function noteNumberToName(noteNumber) {
    return noteNames[noteNumber % 12];
}