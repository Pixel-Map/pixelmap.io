import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import useAssetData from '../../hooks/useAssetData';
import AssetStatus from '../../components/AssetStatus';
import { fetchSingleTile } from '../../utils/api';
import { MARIO_PALETTE, paintPixels, readMarioRom } from '../../utils/marioPaint';
import styles from '../../styles/paint.module.css';

function PalettePreview({ pixels }: { pixels: number[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    pixels.forEach((color, i) => {
      context.fillStyle = `rgb(${MARIO_PALETTE[color].join(',')})`;
      context.fillRect(i % 16, Math.floor(i / 16), 1, 1);
    });
  }, [pixels]);
  return <canvas ref={canvas} width={16} height={16} className={styles.preview} role="img" aria-label="Tile approximated with Mario Paint’s 15 colors" />;
}

function PaintTile({ id }: { id: string }) {
  const { data: tile, loading, error: tileError, retry } = useAssetData<PixelMapTile | undefined>(id, fetchSingleTile, undefined);
  const [rom, setRom] = useState<ArrayBuffer>();
  const [error, setError] = useState('');
  const [reading, setReading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState({ state: 'loading', detail: 'Loading emulator…', painted: 0 });
  const iframe = useRef<HTMLIFrameElement>(null);
  const selection = useRef(0);
  const conversion = useMemo(() => {
    if (!tile) return { pixels: undefined, error: '' };
    try { return { pixels: paintPixels(tile.image || ''), error: '' }; }
    catch (e) { return { pixels: undefined, error: (e as Error).message }; }
  }, [tile]);

  useEffect(() => {
    return () => { selection.current = -1; };
  }, []);
  useEffect(() => {
    if (rom || !conversion.pixels) return;
    const controller = new AbortController();
    const request = ++selection.current;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let active = true;
    setReading(true);
    async function loadRom() {
      try {
        const response = await fetch('/mario.sfc', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return; // Manual selection remains available if the hosted ROM is missing.
        const file = new File([await response.blob()], 'mario.sfc');
        const bytes = await readMarioRom(file);
        if (active && request === selection.current) { setError(''); setRom(bytes); }
      } catch (e) {
        if (active && request === selection.current && !controller.signal.aborted) setError((e as Error).message);
      } finally {
        window.clearTimeout(timeout);
        if (active && request === selection.current) setReading(false);
      }
    }
    void loadRom();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [rom, conversion.pixels]);
  useEffect(() => {
    if (!rom || !conversion.pixels) return;
    const timeout = window.setTimeout(() => setStatus(previous => previous.state === 'loading'
      ? { state: 'error', detail: 'The emulator did not load. Please restart to try again.', painted: 0 } : previous), 45000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframe.current?.contentWindow) return;
      if (event.data?.type === 'paint-frame-ready') {
        iframe.current.contentWindow?.postMessage({ type: 'paint-init', rom, pixels: conversion.pixels, palette: MARIO_PALETTE }, window.location.origin);
      } else if (event.data?.type === 'paint-status' && typeof event.data.detail === 'string') {
        setStatus({ state: event.data.state, detail: event.data.detail, painted: Number(event.data.painted) || 0 });
      }
    };
    window.addEventListener('message', receive);
    return () => { window.clearTimeout(timeout); window.removeEventListener('message', receive); };
  }, [rom, conversion.pixels, attempt]);

  async function selectRom(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const request = ++selection.current;
    setReading(true); setError('');
    try {
      const bytes = await readMarioRom(file);
      if (request === selection.current) { setRom(bytes); setStatus({ state: 'loading', detail: 'Loading emulator…', painted: 0 }); }
    } catch (e) {
      if (request === selection.current) setError((e as Error).message);
    } finally {
      if (request === selection.current) setReading(false);
    }
  }
  function restart() {
    setStatus({ state: 'loading', detail: 'Loading emulator…', painted: 0 });
    setAttempt(value => value + 1);
  }
  function takeOver() {
    iframe.current?.contentWindow?.postMessage({ type: 'paint-takeover' }, window.location.origin);
    iframe.current?.focus();
  }

  return <main className={styles.page}>
    <Head>
      <title>{`Paint tile #${id} · PixelMap`}</title>
      <meta name="description" content={`Watch the real Mario Paint draw PixelMap tile #${id}, then take the mouse and play.`} />
      <link rel="canonical" href={`https://pixelmap.io/paint/${id}`} />
    </Head>
    <header className={styles.header}>
      <Link href={`/tile/${id}`} className={styles.back}>← Tile #{id}</Link>
      <span className={styles.tag}>PIXELMAP × MARIO PAINT</span>
      <h1>A little tile.<br /><span>A whole lot of nostalgia.</span></h1>
      <p>Watch the original SNES game paint tile #{id}, one pixel at a time. Then pick up the mouse.</p>
    </header>
    {loading ? <p role="status">Loading tile…</p> : tileError ? <AssetStatus error={tileError} retry={retry} /> : conversion.error ? <p role="alert">{conversion.error}</p> : conversion.pixels && <>
      <div className={styles.artwork}>
        <figure>
          {/* The published tile image is already scaled with nearest-neighbor pixels. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://pixelmap.art/${id}/latest.png`} width={80} height={80} className={styles.preview} alt={`Original PixelMap tile ${id}`} />
          <figcaption>Original tile</figcaption>
        </figure>
        <span aria-hidden="true">→</span>
        <figure><PalettePreview pixels={conversion.pixels} /><figcaption>Mario Paint colors</figcaption></figure>
        <p>Same 16 × 16 pixels.<br />Reimagined in the game’s 15 colors.</p>
      </div>
      {!rom ? <section className={styles.setup} aria-label="Load Mario Paint">
        {reading ? <p role="status">Loading Mario Paint…</p> : <>
          <h2>Mario Paint could not load automatically.</h2>
          <p>Choose your Mario Paint (Japan, USA) ROM to start. The file stays on your device and is used only in this tab.</p>
          <label className={styles.fileLabel} htmlFor="paint-rom">Choose Mario Paint ROM</label>
          <input id="paint-rom" type="file" accept=".sfc,.smc" onChange={selectRom} />
        </>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <small>A mouse or trackpad on a desktop browser works best.</small>
      </section> : <section className={styles.player} aria-label="Mario Paint">
        <div className={styles.status}>
          <p role={status.state === 'error' ? 'alert' : 'status'} aria-live="polite">{status.detail}</p>
          <div className={styles.controls}>
            {status.state === 'drawing' && <button onClick={takeOver}>Take over</button>}
            {['complete', 'playing', 'error', 'drawing', 'ready'].includes(status.state) && <button onClick={restart}>Restart drawing</button>}
          </div>
        </div>
        {status.state === 'drawing' && <progress value={status.painted} max={256} aria-label="Pixels painted" />}
        <iframe key={attempt} ref={iframe} src="/paint/emulator.html" title={`Mario Paint drawing tile ${id}`} className={styles.emulator} allow="autoplay; fullscreen" allowFullScreen />
        <p className={styles.hint}>After painting, click inside the game to play. Use its Save State button to keep your session. Restart drawing begins a fresh game.</p>
      </section>}
    </>}
    <footer className={styles.footer}>Powered by <a href="https://emulatorjs.org/">EmulatorJS</a> and <a href="https://github.com/snes9xgit/snes9x">Snes9x</a>. Mario Paint belongs to Nintendo.</footer>
  </main>;
}

export default function PaintPage({ id }: { id: string }) {
  // Static props keep route identity available on the first render.
  const router = useRouter();
  const tileId = typeof router.query.id === 'string' ? router.query.id : id;
  return <PaintTile key={tileId} id={tileId} />;
}

export function getStaticPaths() {
  return { paths: Array.from({ length: 3970 }, (_, id) => ({ params: { id: String(id) } })), fallback: false };
}

export function getStaticProps({ params }: { params: { id: string } }) {
  return { props: { id: params.id } };
}
