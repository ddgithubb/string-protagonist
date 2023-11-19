import React, { useEffect } from "react";
import { motion, useMotionValue, animate, useTransform } from "framer-motion";
import { useKeyProbabilities } from "../state.tsx";

function fillForProbability(probability) {
  if (probability < 0.33) return "#ff0000";
  else if (probability < 0.66) return "#0000ff";
  else return "#00ff00";
}

export function Note({ initial, fret, duration, width, pause, pitch }) {
  let isHold = width !== 0;
  width = isHold ? width + "%" : "40px";
  initial = initial || 100;
  const left = useMotionValue(initial); // the animating motion value
  const left_transform = useTransform(left, (value) => `${value}%`); // the x value as a string with a % at the end (for CSS
  const [keyProbabilities, setKeyProbabilities] = useKeyProbabilities();

  useEffect(() => {
    let controls;
    controls = animate(left, 0, {
      ease: "linear",
      duration: duration,
    });
    return controls.stop;
  }, [left, duration]);

  useEffect(() => {
    if (pause) {
      left.stop();
    } else {
      left.set(left.get());
    }
  }, [pause]);

  return (
    <motion.div
      className={"base-note " + (isHold ? "base-note-long" : "")}
      style={{
        left: left_transform,
        width,
      }}
      exit={{
        opacity: 0,
        background: fillForProbability(keyProbabilities?.[pitch % 12] ?? 0),
      }}
      transition={{ opacity: { duration: 0.6 }, background: { duration: 0.6 } }}
    >
      <div className={isHold ? "base-note-fret-long" : ""}>{fret}</div>
    </motion.div>
  );
}
