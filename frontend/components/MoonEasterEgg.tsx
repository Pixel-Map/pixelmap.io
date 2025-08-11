import React, { useEffect, useState, useRef } from 'react';
import styles from '../styles/components/MoonEasterEgg.module.scss';

interface FloatingTile {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  speed: number;
  targetScale: number;
  scaleSpeed: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  hue: number;
  hueShift: number;
  brightness: number;
  opacity: number;
  targetOpacity: number;
}

interface MoonEasterEggProps {
  isActive: boolean;
  tiles: any[];
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  opacity: number;
  isShootingStar?: boolean;
  trail?: Array<{x: number, y: number}>;
}

export default function MoonEasterEgg({ isActive, tiles }: MoonEasterEggProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [floatingTiles, setFloatingTiles] = useState<FloatingTile[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCredits, setShowCredits] = useState(false);
  const [saturnMode, setSaturnMode] = useState(false);
  const [nyanMode, setNyanMode] = useState(false);
  const [warpMode, setWarpMode] = useState(false);
  const [meteorShower, setMeteorShower] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const animationRef = useRef<number>();
  const typedSequence = useRef('');

  // Handle mouse movement
  useEffect(() => {
    if (!isActive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e: MouseEvent) => {
      // Spawn a shooting star at click position
      setStars(prev => [...prev, {
        x: e.clientX,
        y: e.clientY,
        z: 10,
        size: 4,
        speed: 8,
        opacity: 1,
        isShootingStar: true,
        trail: []
      }]);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomLevel(prev => Math.max(0.5, Math.min(2, prev + e.deltaY * -0.001)));
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for 'h' key for help
      if (e.key.toLowerCase() === 'h') {
        setShowHelp(prev => !prev);
        return;
      }
      
      typedSequence.current += e.key.toLowerCase();
      
      // Check for special commands
      if (typedSequence.current.includes('saturn')) {
        setSaturnMode(true);
        typedSequence.current = '';
      } else if (typedSequence.current.includes('nyan')) {
        setNyanMode(true);
        typedSequence.current = '';
      } else if (typedSequence.current.includes('warp')) {
        setWarpMode(true);
        setTimeout(() => setWarpMode(false), 3000);
        typedSequence.current = '';
      } else if (typedSequence.current.includes('credits')) {
        setShowCredits(true);
        setTimeout(() => setShowCredits(false), 300000); // Auto-hide after 5 minutes
        typedSequence.current = '';
      }
      
      // Reset after 2 seconds
      setTimeout(() => { typedSequence.current = ''; }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [isActive]);

  // Trigger meteor showers every 30 seconds
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setMeteorShower(true);
      // Add 10 shooting stars
      const newStars: Star[] = [];
      for (let i = 0; i < 10; i++) {
        newStars.push({
          x: Math.random() * window.innerWidth * 0.5,
          y: Math.random() * window.innerHeight * 0.5,
          z: 10,
          size: 2 + Math.random() * 3,
          speed: 5 + Math.random() * 5,
          opacity: 1,
          isShootingStar: true,
          trail: []
        });
      }
      setStars(prev => [...prev, ...newStars]);
      
      setTimeout(() => setMeteorShower(false), 5000);
    }, 30000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Handle audio playback
  useEffect(() => {
    if (isActive) {
      // Create and play audio
      if (!audioRef.current) {
        audioRef.current = new Audio('/assets/music/oolonghats.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5; // Set to 50% volume
      }
      
      // Play the audio
      audioRef.current.play().catch(err => {
        console.log('Audio playback failed:', err);
      });
    } else {
      // Stop and reset audio when easter egg is deactivated
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Generate 3D star field with depth
    const newStars: Star[] = [];
    
    // Background stars (distant)
    for (let i = 0; i < 150; i++) {
      newStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        z: Math.random() * 1000 + 500, // Far away
        size: Math.random() * 1.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
    
    // Mid-field stars coming toward viewer
    for (let i = 0; i < 100; i++) {
      newStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        z: Math.random() * 500,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
    
    // Shooting stars
    for (let i = 0; i < 5; i++) {
      newStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        z: Math.random() * 100,
        size: Math.random() * 3 + 2,
        speed: Math.random() * 5 + 3,
        opacity: 1,
        isShootingStar: true,
        trail: []
      });
    }
    
    setStars(newStars);

    // Generate floating mooncat tiles with varied properties
    // Adding more mooncat tiles from the collection
    const mooncatTiles = [3785, 3570, 2997, 2722, 2803, 2483, 2402, 1979, 1978, 1970, 1851, 768, 686];
    const newFloatingTiles: FloatingTile[] = [];
    
    // Create multiple instances with dynamic properties - SLOWER SPEEDS
    for (let i = 0; i < 15; i++) {
      const tileId = mooncatTiles[Math.floor(Math.random() * mooncatTiles.length)];
      const initialScale = 0.3 + Math.random() * 0.8;
      newFloatingTiles.push({
        id: tileId,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + Math.random() * 800,
        rotation: Math.random() * 360,
        scale: initialScale,
        targetScale: initialScale,
        scaleSpeed: 0.005 + Math.random() * 0.01,
        speed: 0.2 + Math.random() * 0.8, // Much slower base speed
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        hue: Math.random() * 360,
        hueShift: (Math.random() - 0.5) * 0.5,
        brightness: 0.8 + Math.random() * 0.4,
        opacity: 0.5 + Math.random() * 0.5,
        targetOpacity: 0.5 + Math.random() * 0.5
      });
    }
    setFloatingTiles(newFloatingTiles);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId: number;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      // Create fade effect instead of clear for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      setStars(prevStars => {
        const updatedStars = prevStars.map((star, index) => {
          let newStar = { ...star };
          
          if (star.isShootingStar) {
            // Shooting star behavior
            newStar.x += star.speed * 2;
            newStar.y += star.speed * 0.5;
            
            // Add to trail
            if (star.trail) {
              newStar.trail = [...star.trail, { x: star.x, y: star.y }].slice(-20);
            }
            
            // Reset if off screen
            if (newStar.x > canvas.width + 100 || newStar.y > canvas.height + 100) {
              newStar.x = -50;
              newStar.y = Math.random() * canvas.height;
              newStar.trail = [];
            }
            
            // Draw shooting star with trail
            if (star.trail) {
              star.trail.forEach((point, i) => {
                const opacity = (i / star.trail.length) * star.opacity * 0.5;
                ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, star.size * (i / star.trail.length), 0, Math.PI * 2);
                ctx.fill();
              });
            }
            
            // Draw main star
            const gradient = ctx.createRadialGradient(newStar.x, newStar.y, 0, newStar.x, newStar.y, star.size * 3);
            gradient.addColorStop(0, `rgba(255, 255, 200, ${star.opacity})`);
            gradient.addColorStop(0.4, `rgba(255, 255, 255, ${star.opacity * 0.8})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(newStar.x, newStar.y, star.size * 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // 3D star field effect - stars coming toward viewer
            newStar.z -= star.speed * 2;
            
            // Reset star if it gets too close
            if (newStar.z <= 0) {
              newStar.z = 1500;
              newStar.x = Math.random() * canvas.width;
              newStar.y = Math.random() * canvas.height;
            }
            
            // Calculate 3D projection
            const scale = 800 / newStar.z;
            const x = (newStar.x - centerX) * scale + centerX;
            const y = (newStar.y - centerY) * scale + centerY;
            const size = star.size * scale;
            const opacity = star.opacity * (1 - newStar.z / 1500);
            
            // Draw star with depth-based opacity and twinkling
            const twinkle = Math.sin(Date.now() * 0.001 + index) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * twinkle})`;
            ctx.beginPath();
            ctx.arc(x, y, Math.max(0.1, size), 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow for nearby stars
            if (newStar.z < 300) {
              const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
              glowGradient.addColorStop(0, `rgba(200, 200, 255, ${opacity * 0.5})`);
              glowGradient.addColorStop(1, 'rgba(200, 200, 255, 0)');
              ctx.fillStyle = glowGradient;
              ctx.beginPath();
              ctx.arc(x, y, size * 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          
          return newStar;
        });
        
        return updatedStars;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive]);

  // Animate floating tiles with dynamic effects
  useEffect(() => {
    if (!isActive) return;

    let time = 0;
    const animateTiles = () => {
      time += 0.016; // ~60fps
      
      setFloatingTiles(prevTiles => 
        prevTiles.map(tile => {
          // Calculate wobble for horizontal movement
          const wobbleX = Math.sin(time * tile.wobbleSpeed + tile.wobbleOffset) * 50;
          
          // Mouse attraction effect
          const dx = mousePos.x - tile.x;
          const dy = mousePos.y - tile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 300;
          
          let attractionX = 0;
          let attractionY = 0;
          if (distance < maxDistance) {
            const force = (1 - distance / maxDistance) * 0.3;
            attractionX = (dx / distance) * force * 50;
            attractionY = (dy / distance) * force * 30;
          }
          
          // Animate scale with smooth transitions
          let newScale = tile.scale;
          if (Math.abs(tile.scale - tile.targetScale) > 0.01) {
            newScale += (tile.targetScale - tile.scale) * tile.scaleSpeed;
          } else {
            // Pick new target scale occasionally
            if (Math.random() < 0.01) {
              tile.targetScale = 0.3 + Math.random() * 1.5;
            }
          }
          
          // Animate opacity
          let newOpacity = tile.opacity;
          if (Math.abs(tile.opacity - tile.targetOpacity) > 0.01) {
            newOpacity += (tile.targetOpacity - tile.opacity) * 0.02;
          } else {
            // Pick new target opacity occasionally
            if (Math.random() < 0.01) {
              tile.targetOpacity = 0.4 + Math.random() * 0.6;
            }
          }
          
          // Change speed occasionally - SLOWER
          let newSpeed = tile.speed;
          if (Math.random() < 0.003) {
            newSpeed = 0.2 + Math.random() * 0.8;
          }
          
          // Shift hue over time
          const newHue = (tile.hue + tile.hueShift) % 360;
          
          // Vary brightness
          const newBrightness = tile.brightness + Math.sin(time * 0.5 + tile.wobbleOffset) * 0.1;
          
          return {
            ...tile,
            y: tile.y - newSpeed + attractionY * 0.1,
            x: tile.x + wobbleX * 0.01 + attractionX * 0.1,
            rotation: tile.rotation + 1 + Math.sin(time + tile.wobbleOffset) * 0.5,
            scale: newScale,
            speed: newSpeed,
            hue: newHue,
            brightness: newBrightness,
            opacity: newOpacity,
            // Reset tile when it goes off screen
            ...(tile.y < -250 ? {
              y: window.innerHeight + 100 + Math.random() * 300,
              x: Math.random() * window.innerWidth,
              rotation: Math.random() * 360,
              speed: 0.2 + Math.random() * 0.8,
              scale: 0.3 + Math.random() * 0.8,
              targetScale: 0.3 + Math.random() * 0.8,
              hue: Math.random() * 360,
              opacity: 0.5 + Math.random() * 0.5,
              targetOpacity: 0.5 + Math.random() * 0.5
            } : {})
          };
        })
      );
      animationRef.current = requestAnimationFrame(animateTiles);
    };

    animateTiles();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, mousePos]);

  if (!isActive) return null;

  return (
    <div className={`${styles.moonEasterEgg} ${warpMode ? styles.warpMode : ''}`} style={{ transform: `scale(${zoomLevel})` }}>
      {/* Full overlay to hide the map - goes first/bottom layer */}
      <div className={styles.fullOverlay} />
      
      {/* Galaxy spiral background */}
      <div className={styles.galaxySpiral} />
      
      {/* Nebula clouds for atmosphere */}
      <div className={styles.nebulaContainer}>
        <div className={styles.nebula1} />
        <div className={styles.nebula2} />
        <div className={styles.nebula3} />
      </div>
      
      {/* Stars canvas - on top of black overlay */}
      <canvas ref={canvasRef} className={styles.starfield} />
      
      {/* Cosmic dust particles */}
      <div className={styles.cosmicDust}>
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className={styles.dustParticle}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>
      
      {/* Floating Mooncat Tiles */}
      <div className={styles.floatingTilesContainer}>
        {floatingTiles.map((tile, index) => (
          <div 
            key={`${tile.id}-${index}`} 
            className={styles.tileWrapper}
            style={{
              left: `${tile.x}px`,
              top: `${tile.y}px`,
            }}
          >
            <img
              src={`https://pixelmap.art/${tile.id}/large.png`}
              alt={`Mooncat tile ${tile.id}`}
              className={`${styles.floatingTile} ${nyanMode && index === 0 ? styles.nyanCat : ''}`}
              style={{
                transform: `rotate(${tile.rotation}deg) scale(${tile.scale})`,
                filter: `hue-rotate(${tile.hue}deg) brightness(${tile.brightness})`,
                opacity: tile.opacity,
              }}
            />
            {/* Sparkle trail */}
            <div className={styles.sparkleTrail}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.sparkle} style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            {nyanMode && index === 0 && (
              <div className={styles.nyanRainbow} style={{ left: '-100px' }} />
            )}
          </div>
        ))}
      </div>
      
      {/* Animated Moon - on top */}
      <div className={styles.moonContainer}>
        <div className={styles.moon}>
          <div className={styles.crater1}></div>
          <div className={styles.crater2}></div>
          <div className={styles.crater3}></div>
          {/* Lens flare */}
          <div className={styles.lensFlare} />
        </div>
        {/* Saturn rings */}
        {saturnMode && <div className={styles.saturnRings} />}
      </div>
      
      {/* Star Wars Credits */}
      {showCredits && (
        <div className={styles.creditsContainer}>
          <div className={styles.credits}>
            <h1>MOONCATS OF PIXELMAP</h1>
            <p>A long time ago in a blockchain far, far away...</p>
            <br />
            <h2>Featured Tiles</h2>
            {[3785, 3570, 2997, 2722, 2803, 2483, 2402, 1979, 1978, 1970, 1851, 768, 686].map(id => (
              <p key={id}>Mooncat Tile #{id}</p>
            ))}
            <br />
            <p>Music: Oolonghats</p>
            <br />
            <h3>THE END</h3>
            <p>May the pixels be with you</p>
          </div>
        </div>
      )}
      
      {/* Meteor shower notification */}
      {meteorShower && (
        <div className={styles.meteorShowerAlert}>METEOR SHOWER!</div>
      )}
      
      {/* Help Instructions */}
      <div className={styles.helpPrompt}>Press H for Help • ESC to Exit</div>
      
      {/* Help Menu */}
      {showHelp && (
        <div className={styles.helpMenu}>
          <h2>🌙 Secret Commands 🌙</h2>
          <div className={styles.commandList}>
            <div className={styles.command}>
              <span className={styles.commandKey}>saturn</span>
              <span className={styles.commandDesc}>Add golden rings to the moon</span>
            </div>
            <div className={styles.command}>
              <span className={styles.commandKey}>nyan</span>
              <span className={styles.commandDesc}>Transform a mooncat into Nyan Cat</span>
            </div>
            <div className={styles.command}>
              <span className={styles.commandKey}>warp</span>
              <span className={styles.commandDesc}>Engage hyperdrive!</span>
            </div>
            <div className={styles.command}>
              <span className={styles.commandKey}>credits</span>
              <span className={styles.commandDesc}>View the mooncats credits</span>
            </div>
          </div>
          <h3>Interactive Controls</h3>
          <div className={styles.commandList}>
            <div className={styles.command}>
              <span className={styles.commandKey}>Click</span>
              <span className={styles.commandDesc}>Spawn shooting star</span>
            </div>
            <div className={styles.command}>
              <span className={styles.commandKey}>Scroll</span>
              <span className={styles.commandDesc}>Zoom in/out</span>
            </div>
            <div className={styles.command}>
              <span className={styles.commandKey}>Mouse</span>
              <span className={styles.commandDesc}>Attract mooncats</span>
            </div>
          </div>
          <p className={styles.helpClose}>Press H to close</p>
        </div>
      )}
      
      {/* Aurora-like light effect at bottom */}
      <div className={styles.aurora} />
      
      {/* Pixelated grid representing PixelMap - reduced for performance */}
      <div className={styles.pixelGrid}>
        <div className={styles.gridContainer}>
          {[...Array(81)].map((_, i) => {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const delay = (row + col) * 0.1;
            const hue = (row * 40 + col * 40) % 360;
            
            return (
              <div
                key={i}
                className={styles.pixelSquare}
                style={{
                  gridColumn: col + 1,
                  gridRow: row + 1,
                  animationDelay: `${delay}s`,
                  '--hue': `${hue}deg`
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}