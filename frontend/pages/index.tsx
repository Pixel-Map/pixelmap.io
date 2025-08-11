import Head from 'next/head'

import Map from '../components/Map';
import { fetchTiles } from '../utils/api';
import Layout from "../components/Layout";
import {useEffect, useState, useRef} from "react";
import {PixelMapTile} from "@pixelmap/common/types/PixelMapTile";
import MoonEasterEgg from '../components/MoonEasterEgg';

function Home() {
  const [tiles, setTiles] = useState<PixelMapTile[]>([]);
  const [moonEasterEggActive, setMoonEasterEggActive] = useState(false);
  const typedSequence = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchTiles().then((_tiles) => {
      setTiles(_tiles);
    });
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Add the typed character to sequence
      typedSequence.current += e.key.toLowerCase();

      // Check if "moon" was typed
      if (typedSequence.current.includes('moon')) {
        setMoonEasterEggActive(true);
        typedSequence.current = '';
        // No auto-disable - it will run forever until ESC is pressed
      }

      // Reset sequence after 2 seconds of no typing
      timeoutRef.current = setTimeout(() => {
        typedSequence.current = '';
      }, 2000);
    };

    // Add escape key to exit easter egg
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && moonEasterEggActive) {
        setMoonEasterEggActive(false);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keydown', handleEscape);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [moonEasterEggActive]);

  return (
    <>
      <Layout>
        <Head>
          <title>PixelMap.io: Own a piece of Blockchain History!</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="py-8 md:py-12 lg:py-16">
          {tiles && <Map tiles={tiles} />}
        </main>
        
        <MoonEasterEgg isActive={moonEasterEggActive} tiles={tiles} />
      </Layout>
    </>
  )
}

export default Home;
