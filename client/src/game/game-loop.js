const GAME_LOOP_INTERVAL = 10;
const MAX_MEASURES_PER_FRAME = document.documentElement.clientWidth / 600;
const RENDER_MEASURES_PER_FRAME = MAX_MEASURES_PER_FRAME * 1;
const TIME_WINDOW = document.documentElement.clientWidth / 300;
const RENDER_TIME_WINDOW = TIME_WINDOW * 1.1;
// const DURATION_LOCK_THRESHOLD = 0.1;

export const GAME_LOOP_TYPE = {
  NO_ADJUSTMENTS: 0,
  WITH_ADJUSTMENTS: 1,
  WITH_FRACTIONS: 2,
};

export class GameLoop {
  constructor(
    song,
    videoPlayer,
    setFrame,
    noteEvent,
    setScore,
    keyProbabilityRef,
    gameLoopType = GAME_LOOP_TYPE.NO_ADJUSTMENTS
  ) {
    this.song = song;
    this.videoPlayer = videoPlayer;
    this.setFrame = setFrame;
    this.noteEvent = noteEvent;
    this.gameLoopType = gameLoopType;
    this.started = false;
    this.nextBeat = 0;
    this.setScore = setScore;
    this.keyProbabilityRef = keyProbabilityRef;
  }

  getInitialFrame() {
    let nextBeat = 0;
    let beats = [];
    let frame = this.song.tuning.map((_) => []);
    while (
      nextBeat < this.song.beats.length &&
      this.song.beats[nextBeat].timestamp < RENDER_TIME_WINDOW
    ) {
      let beat = this.song.beats[nextBeat];
      beats.push(beat);
      nextBeat++;

      let timeToHit = beat.timestamp;
      if (timeToHit === 0) {
        timeToHit += 0.1;
      }
      let initial = 100 * (timeToHit / TIME_WINDOW);
      for (const note of beat.notes) {
        note.initial = initial;
        note.timeToHit = timeToHit;
        note.holdWidthPercentage = 0;

        if (note.holdTo !== 0) {
          note.holdWidthPercentage =
            (100 * (note.holdTo - beat.timestamp)) / TIME_WINDOW;
        }

        frame[note.string].push(note);
      }
    }

    return frame;
  }

  getCurrentBeat() {
    return this.nextBeat;
  }

  start(startBeat = 0) {
    if (this.started) {
      return;
    }

    this.nextBeat = startBeat;

    switch (this.gameLoopType) {
      case GAME_LOOP_TYPE.NO_ADJUSTMENTS:
        this.start_without_adjustments();
        break;
      case GAME_LOOP_TYPE.WITH_ADJUSTMENTS:
        this.start_with_adjustments();
        break;
      case GAME_LOOP_TYPE.WITH_FRACTIONS:
        this.start_with_fractions();
        break;
      default:
        throw new Error("Invalid game loop type");
    }

    this.started = true;
  }

  stop() {
    if (!this.started) {
      return;
    }

    clearInterval(this.gameLoop);
    this.started = false;
  }

  start_without_adjustments() {
    let currentBeats = [];
    let currentFrame = this.song.tuning.map((_) => []);
    this.gameLoop = setInterval(() => {
      if (this.videoPlayer === null) {
        return;
      }

      let currentTimestamp = this.videoPlayer.getCurrentTime();

      if (currentTimestamp === null) {
        return;
      }

      let changed = false;

      // Clear notes that have passed
      currentBeats = currentBeats.filter((beat) => {
        let passed = beat.timestamp > currentTimestamp;

        if (passed === false) {
          let notes = [];
          for (const note of beat.notes) {
            // Delete first note
            // if (curFrame[note.string].length === 0) {
            //     continue;
            // }
            if (currentFrame[note.string][0]?.id !== note.id) {
              console.log("Note mismatch");
              console.log(currentFrame[note.string][0]);
              console.log(note);
              continue;
            }

            currentFrame[note.string].shift();
            // TODO: Give duration
            notes.push({ pitch: note.noteNumber, duration: 1.0 });
            console.log(
              note,
              Math.max(
                this.keyProbabilityRef.current[note.noteNumber % 12] - 0.33333,
                0
              ) **
                2 *
                4,
              this.keyProbabilityRef.current
            );
            setTimeout(() => {
              this.setScore(
                (score) =>
                  Math.round(
                    100 *
                      Math.max(
                        this.keyProbabilityRef.current[note.noteNumber % 12] -
                          0.33333,
                        0
                      ) **
                        2 *
                      4
                  ) *
                    10 +
                  score
              );
            }, 300);
          }
          // set score based on probability of key being pressed
          this.noteEvent({
            notes,
            timestamp: Date.now(),
          });
          changed = true;
        }

        return passed;
      });

      // Add new notes that are within the time window
      while (
        this.nextBeat < this.song.beats.length &&
        this.song.beats[this.nextBeat].timestamp <
          currentTimestamp + RENDER_TIME_WINDOW
      ) {
        let beat = this.song.beats[this.nextBeat];
        currentBeats.push(beat);
        this.nextBeat++;

        let timeToHit = beat.timestamp - currentTimestamp;
        let initial = 100 * (timeToHit / TIME_WINDOW);
        for (const note of beat.notes) {
          note.initial = initial;
          note.timeToHit = timeToHit;
          note.holdWidthPercentage = 0;

          if (note.holdTo !== 0) {
            note.holdWidthPercentage =
              (100 * (note.holdTo - beat.timestamp)) / TIME_WINDOW;
          }

          currentFrame[note.string].push(note);
        }

        changed = true;
      }

      if (!changed) {
        return;
      }

      this.setFrame([...currentFrame]);
    }, GAME_LOOP_INTERVAL);
  }

  start_with_adjustments() {
    let currentBeats = [];
    let nextBeat = 0;
    let prevFrame = null;
    this.gameLoop = setInterval(() => {
      if (this.videoPlayer === null) {
        return;
      }

      let currentTimestamp = this.videoPlayer.getCurrentTime();

      if (currentTimestamp === null) {
        return;
      }

      let changed = false;

      // Clear notes that have passed
      currentBeats = currentBeats.filter((beat) => {
        let passed = beat.timestamp > currentTimestamp;

        if (passed === false) {
          changed = true;
          for (const note of beat.notes) {
            setTimeout(() => {
              this.setScore(
                (score) =>
                  Math.round(
                    Math.max(
                      this.keyProbabilityRef.current[note.noteNumber % 12] -
                        0.33333,
                      0
                    ) **
                      2 *
                      4 *
                      100
                  ) *
                    10 +
                  score
              );
            }, 300);
          }
        }

        return passed;
      });

      // Add new notes that are within the time window
      while (
        nextBeat < this.song.beats.length &&
        this.song.beats[nextBeat].timestamp <
          currentTimestamp + RENDER_TIME_WINDOW
      ) {
        let beat = this.song.beats[nextBeat];
        currentBeats.push(beat);
        nextBeat++;
        changed = true;
      }

      if (!changed) {
        return;
      }

      // Turn beats into frames
      let newFrame = this.song.tuning.map((_) => []);
      for (const beat of currentBeats) {
        if (beat.notes.length === 0) {
          continue;
        }

        let timeToHit = beat.timestamp - currentTimestamp;
        // if (timeToHit < DURATION_LOCK_THRESHOLD) {
        //     if (prevFrame !== null) {
        //         // Find a note in prevFrame with the same id as the first note in beat
        //         let note = prevFrame[beat.notes[0].string].find(note => note.id === beat.notes[0].id);
        //         timeToHit = note.timeToHit;
        //     }
        // }
        let initial = 100 * (timeToHit / TIME_WINDOW);

        for (const note of beat.notes) {
          note.initial = initial;
          note.timeToHit = timeToHit;
          note.holdWidthPercentage = 0;

          if (note.holdTo !== 0) {
            note.holdWidthPercentage =
              (100 * (note.holdTo - beat.timestamp)) / TIME_WINDOW;
          }

          newFrame[note.string].push(note);
        }
      }

      this.setFrame(newFrame);
      prevFrame = newFrame;
    }, GAME_LOOP_INTERVAL);
  }

  start_with_fractions() {
    let currentBeats = [];
    let nextBeat = 0;
    let currentFractionWindow = 0;
    this.gameLoop = setInterval(() => {
      if (this.videoPlayer === null) {
        return;
      }

      let currentTimestamp = this.videoPlayer.getCurrentTime();

      if (currentTimestamp === null) {
        return;
      }

      let changed = false;

      // Clear notes that have passed
      currentBeats = currentBeats.filter((beat) => {
        let passed = beat.timestamp > currentTimestamp;

        if (passed === false) {
          currentFractionWindow -= beat.fraction;
          changed = true;
        }

        return passed;
      });

      // Add new notes
      while (
        nextBeat < this.song.beats.length &&
        currentFractionWindow < RENDER_MEASURES_PER_FRAME
      ) {
        let beat = this.song.beats[nextBeat];
        currentBeats.push(beat);
        currentFractionWindow += beat.fraction;
        nextBeat++;
        changed = true;
      }

      if (!changed) {
        return;
      }

      // Turn beats into frames
      let newFrame = this.song.tuning.map((_) => []);
      let currentFraction = 0;
      for (const beat of currentBeats) {
        let timeToHit = beat.timestamp - currentTimestamp;
        let initial = 100 * (currentFraction / MAX_MEASURES_PER_FRAME);

        for (const note of beat.notes) {
          note.initial = initial;
          note.timeToHit = timeToHit;

          newFrame[note.string].push(note);
        }
        currentFraction += beat.fraction;
      }

      this.setFrame(newFrame);
    }, GAME_LOOP_INTERVAL);
  }
}
