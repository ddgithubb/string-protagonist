import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Game.css';
import { getSongData } from '../game/song-tabs';
import { noteNumberToName } from '../helpers/tunings';
import Button from '@mui/joy/Button';
import { Note } from './Note';
import ReactPlayer from 'react-player';
import { GameLoop } from '../game/game-loop';
import { AnimatePresence } from 'framer-motion';

const GAME_STATES = {
    LOADING: "loading",
    NOT_STARTED: "not-started",
    STARTED: "started",
    PAUSED: "paused",
}

// TODO Hook up to backend

// TODO cutoff width for holdTo notes
//  Can do this by keeping another array just for holdTo notes

export function Game() {

    const { songId, revisionId, image, trackNumber } = useParams();
    const [song, setSong] = useState(null);
    const [gameState, setGameState] = useState(GAME_STATES.LOADING);
    const [frame, setFrame] = useState([]);
    const [initialFrame, setInitialFrame] = useState([]);
    const [timer, setTimer] = useState(0);
    const [score, setScore] = useState(0);
    const videoPlayerRef = useRef(null);
    const gameLoop = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        getSongData(songId, revisionId, image, trackNumber).then((song) => {
            console.log(song);
            setFrame(song.tuning.map(() => []));
            setSong(song);
            setGameState(GAME_STATES.NOT_STARTED);
        });
    }, []);

    useEffect(() => {
        if (videoPlayerRef.current === null || gameLoop.current !== null) return;

        gameLoop.current = new GameLoop(song, videoPlayerRef.current, setFrame, addScore);
        setInitialFrame(gameLoop.current.getInitialFrame());
    }, [song]);

    function addScore(s) {
        setScore(score + s);
    }

    function endGame() {
        navigate("/end", {
            state: {
                score
            }
        });
    }

    function pressStartGame() {
        if (gameState === GAME_STATES.STARTED || gameState === GAME_STATES.LOADING) return;

        let counter = 5;
        setTimer(counter);
        counter--;
        let startGameInterval = setInterval(() => {
            setTimer(counter);
            if (counter === 0) {
                clearInterval(startGameInterval);
                startGame();
                return;
            }
            counter--;
        }, 1000);
    }

    function startGame() {
        if (gameLoop.current !== null) {
            gameLoop.current.stop();
        }

        gameLoop.current = new GameLoop(song, videoPlayerRef.current, setFrame, addScore);
        gameLoop.current.start();
        setGameState(GAME_STATES.STARTED);
    }

    function pauseGame() {
        setGameState(GAME_STATES.PAUSED);
    }

    function bufferingGame() {
        setGameState(GAME_STATES.LOADING);
    }

    return (
        <div className="game-container">
            <div className="game-header-container">
                <div className="game-header-title">{song?.title}</div>
                <div className="game-header-artist">{song?.artist}</div>
            </div>
            <div className="song-info-container">
                <div><b>Track Name:</b> {song?.trackName}</div>
                <div><b>Instrument:</b> {song?.instrument}</div>
                <div><b>Capo:</b> {song?.capo}</div>
                {/* <div><b>Frets:</b> {song?.frets}</div> */}
            </div>
            <div className="game-controls-container">
                <Button onClick={pressStartGame} disabled={gameState === GAME_STATES.STARTED || gameState === GAME_STATES.LOADING || timer !== 0}>Start</Button>
                <Button onClick={pauseGame} disabled={gameState !== GAME_STATES.STARTED || gameState === GAME_STATES.LOADING}>Pause</Button>
                {
                    timer !== 0 ? (
                        <div className="game-timer-container">
                            {timer}
                        </div>
                    ) : null
                }
            </div>
            <div className="tabs-container">
                {
                    song?.tuning?.map((tuning, index) => (
                        <div className="tab-line-container" key={index}>
                            <div className="tab-line-string-name">{noteNumberToName(tuning)}</div>
                            <div className="tab-line-string-line"></div>
                            {
                                gameState === GAME_STATES.NOT_STARTED ? (
                                    initialFrame[index]?.map((note) => (
                                        <Note 
                                            initial={note.initial} 
                                            fret={note.fret} 
                                            duration={note.timeToHit} 
                                            key={note.id} 
                                            width={note.holdWidthPercentage}
                                            pause 
                                        />
                                    ))
                                ) : null
                            }
                            <AnimatePresence>
                                {
                                    frame[index].map((note) => (
                                        <Note 
                                            initial={note.initial} 
                                            fret={note.fret} 
                                            duration={note.timeToHit} 
                                            key={note.id} 
                                            width={note.holdWidthPercentage}
                                            pause={ gameState !== GAME_STATES.STARTED } 
                                        />
                                    ))
                                }
                            </AnimatePresence>
                        </div>
                    ))
                }
            </div>
            {
                song?.videoURL ? (
                    <ReactPlayer 
                        url={song.videoURL} 
                        playing={gameState === GAME_STATES.STARTED} 
                        onPlay={startGame} 
                        onBuffer={bufferingGame}
                        onEnded={endGame}
                        ref={videoPlayerRef} 
                        loop={false} 
                        style={{ pointerEvents: "none" }} 
                    />
                ) : null
            }
        </div>
    );
}