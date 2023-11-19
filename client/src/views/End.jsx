import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import './End.css';
import { Button, Input } from "@mui/joy";
import { addToLeaderboard, getLeaderboard } from "../game/api";

export function End() {
    const { state } = useLocation();
    const { songId, revisionId, image, trackNumber } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [isTop10, setIsTop10] = useState(false);
    const [name, setName] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        // if (state?.score === undefined) {
        //     navigate("/");
        // }

        getLeaderboard(songId, revisionId, image, trackNumber).then((leaderboard) => {
            if (leaderboard === undefined) {
                return;
            }

            if (state?.score !== undefined && state.score !== 0) {
                if (leaderboard.length < 10) {
                    setIsTop10(true);
                } else {
                    for (let i = 0; i < leaderboard.length; i++) {
                        if (state?.score >= leaderboard[i].score) {
                            setIsTop10(true);
                            break;
                        }
                    }
                }
            }

            setLeaderboard(leaderboard);
        });
        drawConfetti();
    }, []);

    function addToLeaderboardOnClick() {
        if (name === "") {
            return;
        }

        addToLeaderboard(songId, revisionId, image, trackNumber, name, state.score).then((leaderboard) => {
            if (leaderboard === undefined) {
                return;
            }
            
            setLeaderboard(leaderboard);
            setIsTop10(false);
        });
    }

    return (
        <div className="end-container">
            <canvas id="confetti"></canvas>
            <h1 className="end-title">Finished!</h1>
            <p className="score-text">Score: {state?.score}</p>
            {
                isTop10 ? (
                    <p className="top-10-text">Congrats! You are in the Top 10. Enter your name to be added to the leaderboards!</p>
                ) : null
            }
            <div className="action-container">
                {
                    isTop10 ? (
                        <>
                            <Input placeholder="Enter Name" onChange={(event) => setName(event.target.value)} value={name} />
                            <Button onClick={addToLeaderboardOnClick}>Add To Leaderboard</Button>
                        </>
                    ) : null
                }
                <Button onClick={() => navigate("/")}>Back to Start</Button>
            </div>
            {
                leaderboard.length === 0 ? null : (
                    <div className="leaderboard-container">
                        <h2 className="leaderboard-title">Leaderboard</h2>
                        {leaderboard.map((entry, index) => {
                            return (
                                <div className="leaderboard-entry">
                                    <p className="leaderboard-entry-name">{entry.name}</p>
                                    <p className="leaderboard-entry-score">{entry.score}</p>
                                </div>
                            )
                        })}
                    </div>
                )
            }
        </div>
    )
}

function drawConfetti() {
    let W = window.innerWidth;
    let H = document.getElementById('confetti').clientHeight;
    const canvas = document.getElementById('confetti');
    const context = canvas.getContext("2d");
    const maxConfettis = 25;
    const particles = [];

    const possibleColors = [
        "#ff7336",
        "#f9e038",
        "#02cca4",
        "#383082",
        "#fed3f5",
        "#b1245a",
        "#f2733f"
    ];

    function randomFromTo(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    }

    function confettiParticle() {
        this.x = Math.random() * W; // x
        this.y = Math.random() * H - H; // y
        this.r = randomFromTo(11, 33); // radius
        this.d = Math.random() * maxConfettis + 11;
        this.color =
            possibleColors[Math.floor(Math.random() * possibleColors.length)];
        this.tilt = Math.floor(Math.random() * 33) - 11;
        this.tiltAngleIncremental = Math.random() * 0.07 + 0.05;
        this.tiltAngle = 0;

        this.draw = function () {
            context.beginPath();
            context.lineWidth = this.r / 2;
            context.strokeStyle = this.color;
            context.moveTo(this.x + this.tilt + this.r / 3, this.y);
            context.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 5);
            return context.stroke();
        };
    }

    function Draw() {
        const results = [];

        // Magical recursive functional love
        requestAnimationFrame(Draw);

        context.clearRect(0, 0, W, window.innerHeight);

        for (var i = 0; i < maxConfettis; i++) {
            results.push(particles[i].draw());
        }

        let particle = {};
        let remainingFlakes = 0;
        for (var i = 0; i < maxConfettis; i++) {
            particle = particles[i];

            particle.tiltAngle += particle.tiltAngleIncremental;
            particle.y += (Math.cos(particle.d) + 3 + particle.r / 2) / 2;
            particle.tilt = Math.sin(particle.tiltAngle - i / 3) * 15;

            if (particle.y <= H) remainingFlakes++;

            // If a confetti has fluttered out of view,
            // bring it back to above the viewport and let if re-fall.
            if (particle.x > W + 30 || particle.x < -30 || particle.y > H) {
                particle.x = Math.random() * W;
                particle.y = -30;
                particle.tilt = Math.floor(Math.random() * 10) - 20;
            }
        }

        return results;
    }

    window.addEventListener(
        "resize",
        function () {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        },
        false
    );

    // Push new confetti objects to `particles[]`
    for (var i = 0; i < maxConfettis; i++) {
        particles.push(new confettiParticle());
    }

    // Initialize
    canvas.width = W;
    canvas.height = H;
    Draw();
}