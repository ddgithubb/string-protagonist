import fetch from "node-fetch";

export async function searchSong(query, limit) {
  const songSearchURL = `https://www.songsterr.com/api/songs?size=${limit}&pattern=${query}`;
  const songSearchRes = await fetch(songSearchURL);

  if (!songSearchRes.ok) {
    return undefined;
  }

  const songSearchJSON = await songSearchRes.json();

  let searchResults = songSearchJSON.map((song) => {
    return {
      songId: song.songId,
      title: song.title,
      artist: song.artist,
    };
  });

  return searchResults;
}

export async function getSongMetadata(songId) {
  const songMetadataURL = `https://www.songsterr.com/api/meta/${songId}`;
  const songMetadataRes = await fetch(songMetadataURL);

  if (!songMetadataRes.ok) {
    return undefined;
  }

  const songMetadataJSON = await songMetadataRes.json();

  const songMetadata = {};
  songMetadata.songId = songMetadataJSON.songId;
  songMetadata.revisionId = songMetadataJSON.revisionId;
  songMetadata.image = songMetadataJSON.image;
  songMetadata.title = songMetadataJSON.title;
  songMetadata.artist = songMetadataJSON.artist;
  songMetadata.tracks = songMetadataJSON.tracks.map((track, index) => {
    return {
      trackNumber: index,
      name: track.name,
      instrument: track.instrument,
    };
  });

  return songMetadata;
}

export async function getSongData(songId, revisionId, image, trackNumber) {
  const songMetadataURL = `https://www.songsterr.com/api/meta/${songId}`;
  const measuresURL = `https://dqsljvtekg760.cloudfront.net/${songId}/${revisionId}/${image}/${trackNumber}.json`;
  const measureTimestampsURL = `https://www.songsterr.com/api/video-points/${songId}/${revisionId}/list`;

  const songMetadataRes = await fetch(songMetadataURL);

  if (!songMetadataRes.ok) {
    return undefined;
  }

  const songMetadataJSON = await songMetadataRes.json();

  const measuresRes = await fetch(measuresURL);

  if (!measuresRes.ok) {
    return undefined;
  }

  const measureTimestampsRes = await fetch(measureTimestampsURL);

  if (!measureTimestampsRes.ok) {
    return undefined;
  }

  const measuresJSON = await measuresRes.json();
  const measureTimestampsJSON = await measureTimestampsRes.json();

  if (measureTimestampsJSON.length === 0) {
    return undefined;
  }

  const songData = {};
  songData.songId = songMetadataJSON.songId;
  songData.title = songMetadataJSON.title;
  songData.artist = songMetadataJSON.artist;
  songData.trackName = measuresJSON.name;
  songData.instrument = measuresJSON.instrument;
  songData.capo = measuresJSON.capo;
  songData.frets = measuresJSON.frets;
  songData.strings = measuresJSON.strings;
  songData.tuning = measuresJSON.tuning ?? [40, 45, 50, 55, 59, 64];

  if (measureTimestampsJSON.length === 0) {
    return undefined;
  }

  const videoTimestamps =
    measureTimestampsJSON[measureTimestampsJSON.length - 1];

  songData.videoURL =
    "https://www.youtube.com/watch?v=" + videoTimestamps.videoId;

  const measureTimestamps = videoTimestamps.points;
  const lastNoteMap = [];
  let currentBPM = 120;
  let currentSignatureFactor = 1;
  let noteId = 0;
  songData.beats = measuresJSON.measures.flatMap((measure, index) => {
    if (!measure.voices || measure.voices.length === 0) {
      return [];
    }

    currentBPM = measure.voices[0].beats[0]?.bpm ?? currentBPM;
    currentSignatureFactor =
      measure.signature === undefined
        ? currentSignatureFactor
        : measure.signature[0] / measure.signature[1];

    let measureTimestamp = measureTimestamps[index];
    let measureDuration;
    if (index + 1 >= measureTimestamps.length) {
      measureDuration = (60 / currentBPM) * 4; // Get duration of measure
    } else {
      measureDuration = measureTimestamps[index + 1] - measureTimestamp; // Get duration of measure
      measureDuration /= currentSignatureFactor; // Adjust for time signature
    }

    const measureBeats = measure.voices[0].beats.reduce((beats, beat) => {
      const beatFraction = beat.duration[0] / beat.duration[1];
      const beatDuration = measureDuration * beatFraction;

      const notes = beat.notes.reduce((notes, note) => {
        if (note.rest === true) {
          return notes;
        }

        if (note.string === undefined || note.fret === undefined) {
          return notes;
        }

        const noteData = {
          id: noteId++,
          noteNumber: songData.tuning[note.string] + note.fret,
          fret: note.fret,
          string: note.string,
          holdTo: 0,
        };

        if (note.tie === true) {
          let lastNote = lastNoteMap[noteData.noteNumber];
          if (lastNote !== undefined) {
            lastNote.holdTo = measureTimestamp;
          }
          return notes;
        }

        lastNoteMap[noteData.noteNumber] = noteData;
        notes.push(noteData);
        return notes;
      }, []);

      const beatData = {
        notes: notes,
        timestamp: measureTimestamp,
        fraction: beatFraction,
      };

      measureTimestamp += beatDuration;

      beats.push(beatData);

      return beats;
    }, []);

    return measureBeats;
  });

  return songData;
}
