import { useState, useEffect } from "react";
import { TimePadder } from "../../../utilities/helpers";
import ButtonPanel from "../../ButtonPanel/ButtonPanel";
import TimerDisplay from "./TimerDisplay";
import { TimerProps } from "../types/TimerTypes";
import styles from "../styles/Timer.module.css";

import useTimerEffect from "@hooks/useTimerEffect";
import SciFiAlarm from "@assets/sciFiAlarm.mp3";
import { getParsedSettings } from "@components/Setting/utils/Settings";

const alarmSounds = {
  sciFiAlarm: SciFiAlarm,
};

const Timer = ({
  isAlertOn,
  isAutoSwitchOn,
  count,
  setCount,
  breakDuration,
  setBreakDuration,
}: TimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isBreak, setIsBreak] = useState(false);
  const [initialState, setInitialState] = useState(true);
  const [alarmSound, setAlarmSound] = useState(alarmSounds.sciFiAlarm);

  useEffect(() => {
    const settings = getParsedSettings("appSettings");
    if (settings) {
      if (settings.alarmName) {
        const alert = settings.alarmName;
        const sound = alarmSounds[alert as keyof typeof alarmSounds];
        setAlarmSound(sound || alarmSounds.sciFiAlarm);
      }
    }
  }, []);

  useEffect(() => {
    const timerWorker = new Worker("worker.js");
    setWorker(timerWorker);

    timerWorker.onmessage = (event) => {
      const currentTime = event.data;

      if (isRunning && !isBreak) {
        setCount(currentTime);
      }
      if (isRunning && isBreak) {
        setBreakDuration(currentTime);
      }
    };

    return () => timerWorker.terminate();
  }, [isRunning, isBreak]);

  useEffect(() => {
    let title = "Diamond Focus - Ready";

    if (isRunning && !initialState) {
      const timeLeft = isBreak ? TimePadder(breakDuration) : TimePadder(count);
      title = `${timeLeft} - ${isBreak ? "☕ Break Time" : "⏰ Focus Time"}`;
    } else if (!initialState) {
      title = `${isBreak ? TimePadder(breakDuration) : TimePadder(count)} - ⏸️ Paused`;
    } else {
      document.title = title;
      setInitialState(false);
    }

    document.title = title;
  }, [isRunning, isBreak, count, breakDuration]);

  const completeReset = () => {
    const settings = getParsedSettings("appSettings");
    if (!settings) return;

    const initialCount = parseInt(`${settings.count}` || "1500");
    const initialBreakDuration = parseInt(`${settings.breakDuration}` || "300");

    if (isBreak) {
      if (isAutoSwitchOn) setIsBreak(false);
      setBreakDuration(initialBreakDuration);
      worker?.postMessage({ command: "reset", seconds: initialBreakDuration });
    } else {
      if (isAutoSwitchOn) setIsBreak(true);
      setCount(initialCount);
      worker?.postMessage({ command: "reset", seconds: initialCount });
    }
    setIsRunning(false);
  };

  const changeIsBreak = () => {
    const settings = getParsedSettings("appSettings");
    if (!settings) return;

    if (isBreak) {
      setIsBreak(false);
      setCount(parseInt(`${settings.count}` || "1500"));
    } else {
      setIsBreak(true);
      setBreakDuration(parseInt(`${settings.breakDuration}` || "300"));
    }
  };

  useTimerEffect({
    isRunning,
    worker,
    count,
    isBreak,
    breakDuration,
    isAlertOn,
    completeReset,
    alarmSound,
  });

  return (
    <div
      className={`${styles.timerContainer} ${isBreak ? styles.breakTimer : styles.focusTimer}`}
    >
      <TimerDisplay
        isRunning={isRunning}
        isBreak={isBreak}
        breakDuration={breakDuration}
        count={count}
      />
      <ButtonPanel
        isBreak={isBreak}
        isRunning={isRunning}
        handlePlayPause={() => setIsRunning(!isRunning)}
        changeIsBreak={changeIsBreak}
        onReset={completeReset}
      />
    </div>
  );
};

export default Timer;
