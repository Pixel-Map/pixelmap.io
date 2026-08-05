import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { decompressTileCode } from "../utils/ImageUtils";
import styles from "../styles/pages/Timelapse.module.scss";

const MAP_WIDTH = 81 * 16;
const MAP_HEIGHT = 49 * 16;
const FIRST_YEAR = 2021;
const LAST_YEAR = 2026;
const YEARS = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, index) => FIRST_YEAR + index,
);
const START_TIME = Date.parse("2021-08-22T23:31:48Z");
const END_TIME = Date.UTC(LAST_YEAR + 1, 0, 1) - 1;

type HistoricalImage = {
  blockNumber: number;
  date: string;
  image: string;
  image_url?: string;
  updatedBy?: string;
};

type WrappingHistory = {
  timestamp: string;
  block_number: number;
  tx?: string;
  wrapped: boolean;
  updated_by?: string;
};

type TimelapseTile = {
  id?: number;
  image?: string;
  historical_images?: HistoricalImage[];
  wrapping_history?: WrappingHistory[];
};

export type TimelapseEvent = {
  kind: "image" | "wrap" | "unwrap";
  tileId: number;
  timestamp: number;
  blockNumber: number;
  updatedBy?: string;
  pixels?: string;
  tx?: string;
};

type PreparedTimeline = {
  baseFrame: ImageData;
  events: TimelapseEvent[];
  yearlyCounts: Record<number, number>;
  changedTileCount: number;
};

const SPEEDS = [
  { label: "1×", delay: 700 },
  { label: "2×", delay: 300 },
  { label: "4×", delay: 110 },
];

function formatDate(timestamp: number, includeTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime
      ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" }
      : {}),
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function shortAddress(value?: string) {
  if (!value) return "unknown artist";
  if (!value.startsWith("0x") || value.length < 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function decodePixels(encodedImage?: string) {
  const decoded = encodedImage ? decompressTileCode(encodedImage) : "";
  return typeof decoded === "string" && /^[0-9a-f]{768}$/i.test(decoded)
    ? decoded
    : "";
}

function drawTile(frame: ImageData, tileId: number, encodedImage?: string) {
  const hex = encodedImage ? decompressTileCode(encodedImage) : "";
  const validImage = typeof hex === "string" && /^[0-9a-f]{768}$/i.test(hex);
  const originX = (tileId % 81) * 16;
  const originY = Math.floor(tileId / 81) * 16;

  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const output = ((originY + y) * MAP_WIDTH + originX + x) * 4;
      const input = (y * 16 + x) * 3;
      if (validImage) {
        frame.data[output] = parseInt(hex[input], 16) * 17;
        frame.data[output + 1] = parseInt(hex[input + 1], 16) * 17;
        frame.data[output + 2] = parseInt(hex[input + 2], 16) * 17;
      } else {
        frame.data[output] = 18;
        frame.data[output + 1] = 20;
        frame.data[output + 2] = 28;
      }
      frame.data[output + 3] = 255;
    }
  }
}

function visibleEventsForTile(tile: TimelapseTile): TimelapseEvent[] {
  const tileId = tile.id;
  if (typeof tileId !== "number") return [];

  const history = [...(tile.historical_images || [])].sort(
    (a, b) =>
      Date.parse(a.date) - Date.parse(b.date) || a.blockNumber - b.blockNumber,
  );
  let previousPixels = "";
  const events: TimelapseEvent[] = [];

  history.forEach((entry) => {
    const timestamp = Date.parse(entry.date);
    const pixels = decodePixels(entry.image);
    const changedPixels = pixels !== previousPixels;
    if (
      changedPixels &&
      Number.isFinite(timestamp) &&
      timestamp >= START_TIME &&
      timestamp <= END_TIME
    ) {
      events.push({
        kind: "image",
        tileId,
        timestamp,
        blockNumber: entry.blockNumber,
        updatedBy: entry.updatedBy,
        pixels,
      });
    }
    previousPixels = pixels;
  });

  (tile.wrapping_history || []).forEach((entry) => {
    const timestamp = Date.parse(entry.timestamp);
    if (
      Number.isFinite(timestamp) &&
      timestamp >= START_TIME &&
      timestamp <= END_TIME
    ) {
      events.push({
        kind: entry.wrapped ? "wrap" : "unwrap",
        tileId,
        timestamp,
        blockNumber: entry.block_number,
        updatedBy: entry.updated_by,
        tx: entry.tx,
      });
    }
  });

  return events;
}

export function buildTimeline(
  sourceFrame: ImageData,
  tiles: TimelapseTile[],
): PreparedTimeline {
  const baseFrame = new ImageData(
    new Uint8ClampedArray(sourceFrame.data),
    sourceFrame.width,
    sourceFrame.height,
  );
  const events = tiles
    .flatMap(visibleEventsForTile)
    .sort(
      (a, b) =>
        a.timestamp - b.timestamp ||
        a.blockNumber - b.blockNumber ||
        a.tileId - b.tileId,
    );

  const changedTiles = new Set(events.map((event) => event.tileId));
  changedTiles.forEach((tileId) => {
    const tile = tiles.find((candidate) => candidate.id === tileId);
    const stateAtStart = [...(tile?.historical_images || [])]
      .filter((entry) => Date.parse(entry.date) < START_TIME)
      .sort(
        (a, b) =>
          Date.parse(b.date) - Date.parse(a.date) ||
          b.blockNumber - a.blockNumber,
      )[0];
    drawTile(baseFrame, tileId, stateAtStart?.image);
  });

  const yearlyCounts = events.reduce<Record<number, number>>((counts, event) => {
    const year = new Date(event.timestamp).getUTCFullYear();
    counts[year] = (counts[year] || 0) + 1;
    return counts;
  }, {});

  return {
    baseFrame,
    events,
    yearlyCounts,
    changedTileCount: changedTiles.size,
  };
}

function drawFrame(
  context: CanvasRenderingContext2D,
  timeline: PreparedTimeline,
  frame: number,
) {
  const pixels = new ImageData(
    new Uint8ClampedArray(timeline.baseFrame.data),
    timeline.baseFrame.width,
    timeline.baseFrame.height,
  );
  for (let index = 0; index < frame; index += 1) {
    const event = timeline.events[index];
    if (event.kind === "image") {
      drawTile(pixels, event.tileId, event.pixels);
    }
  }
  context.putImageData(pixels, 0, 0);
}

function playTone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playEventSound(context: AudioContext, event: TimelapseEvent) {
  const now = context.currentTime;
  if (event.kind === "image") {
    playTone(context, 220 + (event.tileId % 12) * 18, now, 0.065, 0.028, "square");
    return;
  }

  const notes = event.kind === "wrap" ? [196, 329.63, 523.25] : [440, 293.66, 174.61];
  notes.forEach((frequency, index) => {
    playTone(
      context,
      frequency,
      now + index * 0.055,
      0.24,
      0.06 - index * 0.008,
      event.kind === "wrap" ? "triangle" : "sawtooth",
    );
  });
}

export default function TimelapsePlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundFrameRef = useRef(0);
  const [timeline, setTimeline] = useState<PreparedTimeline | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState("");

  const unlockAudio = useCallback(async () => {
    let context = audioContextRef.current;
    if (!context || context.state === "closed") {
      context = new AudioContext();
      audioContextRef.current = context;
    }
    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        // The next direct control interaction will retry the browser audio unlock.
      }
    }
    return context;
  }, []);

  const prepareTimeline = useCallback(async () => {
    setError("");
    setTimeline(null);
    setFrame(0);
    lastSoundFrameRef.current = 0;
    setPlaying(false);

    try {
      const response = await fetch("https://pixelmap.art/tiledata.json");
      if (!response.ok) throw new Error("The archive did not respond.");
      const tiles = (await response.json()) as TimelapseTile[];

      const sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The current map image did not load."));
        image.src = `https://pixelmap.art/tilemap.png?v=${Date.now()}`;
      });

      const scratch = document.createElement("canvas");
      scratch.width = MAP_WIDTH;
      scratch.height = MAP_HEIGHT;
      const context = scratch.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas is unavailable in this browser.");
      context.drawImage(sourceImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);
      setTimeline(buildTimeline(context.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT), tiles));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The archive could not be loaded.");
    }
  }, []);

  useEffect(() => {
    prepareTimeline();
  }, [prepareTimeline]);

  useEffect(() => {
    if (!timeline || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d", { alpha: false });
    if (!context) return;
    const animation = requestAnimationFrame(() => drawFrame(context, timeline, frame));
    return () => cancelAnimationFrame(animation);
  }, [frame, timeline]);

  useEffect(() => {
    if (!soundEnabled || !timeline || frame === 0 || frame === lastSoundFrameRef.current) {
      return;
    }
    const context = audioContextRef.current;
    const event = timeline.events[frame - 1];
    if (context && event) {
      if (context.state === "running") {
        playEventSound(context, event);
      } else {
        void context
          .resume()
          .then(() => playEventSound(context, event))
          .catch(() => undefined);
      }
    }
    lastSoundFrameRef.current = frame;
  }, [frame, soundEnabled, timeline]);

  useEffect(
    () => () => {
      if (audioContextRef.current) void audioContextRef.current.close();
    },
    [],
  );

  useEffect(() => {
    if (!playing || !timeline) return;
    if (frame >= timeline.events.length) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setFrame((current) => Math.min(current + 1, timeline.events.length)),
      SPEEDS[speedIndex].delay,
    );
    return () => window.clearTimeout(timer);
  }, [frame, playing, speedIndex, timeline]);

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if (!timeline || event.target instanceof HTMLInputElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (soundEnabled) void unlockAudio();
        setPlaying((value) => !value);
      } else if (event.key === "ArrowRight") {
        if (soundEnabled) void unlockAudio();
        setPlaying(false);
        setFrame((value) => Math.min(value + 1, timeline.events.length));
      } else if (event.key === "ArrowLeft") {
        if (soundEnabled) void unlockAudio();
        setPlaying(false);
        setFrame((value) => Math.max(value - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [soundEnabled, timeline, unlockAudio]);

  const currentEvent = frame > 0 ? timeline?.events[frame - 1] : undefined;
  const displayTime = currentEvent?.timestamp || START_TIME;
  const selectedYear = new Date(displayTime).getUTCFullYear();
  const recentEvents = useMemo(
    () => timeline?.events.slice(Math.max(0, frame - 4), frame).reverse() || [],
    [frame, timeline],
  );

  const jumpToYear = (year: number) => {
    if (!timeline) return;
    if (soundEnabled) void unlockAudio();
    const firstEvent = timeline.events.findIndex(
      (event) => event.timestamp >= Date.UTC(year, 0, 1),
    );
    setPlaying(false);
    setFrame(firstEvent < 0 ? timeline.events.length : firstEvent);
  };

  const togglePlayback = () => {
    if (!timeline) return;
    if (soundEnabled) void unlockAudio();
    if (!playing && frame >= timeline.events.length) setFrame(0);
    setPlaying((value) => !value);
  };

  const toggleSound = () => {
    if (soundEnabled) {
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      void unlockAudio();
    }
  };

  const saveFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `pixelmap-${new Date(displayTime).toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <section className={styles.player} aria-label="PixelMap timelapse player">
      <div className={styles.playerTopline}>
        <div>
          <span className={styles.eyebrow}>PIXELMAP HISTORY</span>
          <h2>{formatDate(displayTime)}</h2>
        </div>
        <div className={styles.liveReadout} aria-live="polite">
          <span className={playing ? styles.liveDot : styles.pausedDot} />
          {playing ? "PLAYING" : frame === timeline?.events.length ? "LATEST" : "PAUSED"}
        </div>
      </div>

      <div className={styles.viewport}>
        <canvas
          ref={canvasRef}
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          className={styles.mapCanvas}
          aria-label={`PixelMap as of ${formatDate(displayTime, true)}`}
        />
        <div className={styles.scanlines} aria-hidden="true" />
        {currentEvent && (
          <div
            key={`${currentEvent.kind}-${currentEvent.tileId}-${currentEvent.blockNumber}`}
            className={`${styles.focusMarker} ${
              currentEvent.kind === "wrap"
                ? styles.wrappedMarker
                : currentEvent.kind === "unwrap"
                  ? styles.unwrappedMarker
                  : ""
            }`}
            style={{
              left: `${((currentEvent.tileId % 81) / 81) * 100}%`,
              top: `${(Math.floor(currentEvent.tileId / 81) / 49) * 100}%`,
              width: `${100 / 81}%`,
              height: `${100 / 49}%`,
            }}
            aria-hidden="true"
          />
        )}
        {currentEvent && currentEvent.kind !== "image" && (
          <div
            key={`burst-${currentEvent.kind}-${currentEvent.tileId}-${currentEvent.blockNumber}`}
            className={`${styles.wrapBurst} ${
              currentEvent.kind === "unwrap" ? styles.unwrapBurst : ""
            }`}
            style={{
              left: `${(((currentEvent.tileId % 81) + 0.5) / 81) * 100}%`,
              top: `${((Math.floor(currentEvent.tileId / 81) + 0.5) / 49) * 100}%`,
            }}
            aria-hidden="true"
          />
        )}

        {!timeline && !error && (
          <div className={styles.loadingState}>
            <span className={styles.loader} />
            <strong>Loading…</strong>
            <small>Starting August 22, 2021</small>
          </div>
        )}
        {error && (
          <div className={styles.loadingState}>
            <strong>Couldn&apos;t load history</strong>
            <small>{error}</small>
            <button type="button" onClick={prepareTimeline} className={styles.textButton}>
              Retry
            </button>
          </div>
        )}
      </div>

      <div
        className={styles.controls}
        onPointerDown={() => {
          if (soundEnabled) void unlockAudio();
        }}
      >
        <div className={styles.transport}>
          <button
            type="button"
            className={styles.playButton}
            onClick={togglePlayback}
            disabled={!timeline}
            aria-label={playing ? "Pause timelapse" : "Play timelapse"}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
          <button
            type="button"
            className={styles.skipButton}
            onClick={() => {
              setPlaying(false);
              setFrame((value) => Math.max(0, value - 1));
            }}
            disabled={!timeline || frame === 0}
            aria-label="Previous change"
          >
            ←
          </button>
          <button
            type="button"
            className={styles.skipButton}
            onClick={() => {
              if (!timeline) return;
              setPlaying(false);
              setFrame((value) => Math.min(timeline.events.length, value + 1));
            }}
            disabled={!timeline || frame === timeline.events.length}
            aria-label="Next change"
          >
            →
          </button>
        </div>

        <div className={styles.scrubberWrap}>
          <input
            className={styles.scrubber}
            type="range"
            min="0"
            max={timeline?.events.length || 1}
            value={frame}
            onChange={(event) => {
              setPlaying(false);
              setFrame(Number(event.target.value));
            }}
            disabled={!timeline}
            aria-label="Timelapse position"
          />
          <div className={styles.yearLabels}>
            {YEARS.map((year) => (
              <button
                type="button"
                key={year}
                onClick={() => jumpToYear(year)}
                className={selectedYear === year ? styles.activeYear : ""}
                disabled={!timeline}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlActions}>
          <button
            type="button"
            className={`${styles.soundButton} ${soundEnabled ? styles.soundActive : ""}`}
            onClick={toggleSound}
            disabled={!timeline}
            aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
            aria-pressed={soundEnabled}
          >
            SFX
          </button>
          <button
            type="button"
            className={styles.speedButton}
            onClick={() => setSpeedIndex((value) => (value + 1) % SPEEDS.length)}
            disabled={!timeline}
            aria-label={`Playback speed ${SPEEDS[speedIndex].label}`}
          >
            {SPEEDS[speedIndex].label}
          </button>
        </div>
      </div>

      <div className={styles.metadataBar}>
        <div>
          <span>CHANGE</span>
          {currentEvent ? (
            <strong>
              Tile #{currentEvent.tileId}
              {currentEvent.kind === "wrap"
                ? " wrapped"
                : currentEvent.kind === "unwrap"
                  ? " unwrapped"
                  : ""}{" "}
              by {shortAddress(currentEvent.updatedBy)}
            </strong>
          ) : (
            <strong>Start</strong>
          )}
        </div>
        <div>
          <span>BLOCK</span>
          <strong>
            {currentEvent ? currentEvent.blockNumber.toLocaleString() : "13,078,126"}
          </strong>
        </div>
        <div>
          <span>FRAME</span>
          <strong>
            {frame.toLocaleString()} / {(timeline?.events.length || 0).toLocaleString()}
          </strong>
        </div>
        <div className={styles.metadataActions}>
          {currentEvent && (
            <Link href={`/tile/${currentEvent.tileId}`}>View tile ↗</Link>
          )}
          <button type="button" onClick={saveFrame} disabled={!timeline}>
            Save PNG ↓
          </button>
        </div>
      </div>

      {timeline && (
        <div className={styles.archiveGrid}>
          <div className={styles.archiveIntro}>
            <h3>{timeline.events.length.toLocaleString()} changes</h3>
            <div className={styles.bigStat}>
              <strong>{timeline.changedTileCount.toLocaleString()}</strong>
              <span>tiles</span>
            </div>
          </div>

          <div className={styles.yearCards}>
            {YEARS.map((year) => (
              <button type="button" key={year} onClick={() => jumpToYear(year)}>
                <span>{year}</span>
                <strong>{timeline.yearlyCounts[year] || 0}</strong>
                <small>changes</small>
              </button>
            ))}
          </div>

          <div className={styles.eventLog}>
            <div className={styles.eventLogTitle}>
              <span>RECENT</span>
              <small>UTC</small>
            </div>
            {recentEvents.length ? (
              recentEvents.map((event) => {
                const eventIndex = timeline.events.indexOf(event) + 1;
                return (
                  <button
                    type="button"
                    key={`${event.kind}-${event.tileId}-${event.blockNumber}`}
                    onClick={() => {
                      setPlaying(false);
                      setFrame(eventIndex);
                    }}
                  >
                    <span
                      className={`${styles.tileBadge} ${
                        event.kind === "wrap"
                          ? styles.wrappedBadge
                          : event.kind === "unwrap"
                            ? styles.unwrappedBadge
                            : ""
                      }`}
                    >
                      {event.kind === "wrap" ? "WRAP" : event.kind === "unwrap" ? "OPEN" : `#${event.tileId}`}
                    </span>
                    <span>
                      <strong>
                        {event.kind === "image" ? "" : `#${event.tileId} · `}
                        {shortAddress(event.updatedBy)}
                      </strong>
                      <small>{formatDate(event.timestamp, true)}</small>
                    </span>
                    <span className={styles.logBlock}>{event.blockNumber.toLocaleString()}</span>
                  </button>
                );
              })
            ) : (
              <div className={styles.emptyLog}>Press play.</div>
            )}
          </div>
        </div>
      )}

      <p className={styles.keyboardHint}>
        Space: play/pause · ← →: step
      </p>
    </section>
  );
}
