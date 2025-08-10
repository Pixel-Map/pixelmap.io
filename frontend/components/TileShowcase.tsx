import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TileImage from './TileImage';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import { formatDistanceToNow } from 'date-fns';
import { shortenIfHex } from '../utils/misc';
import { getLargeImageUrl } from '../utils/tileImageUtils';

interface TileShowcaseProps {
  tile: PixelMapTile;
  mode?: 'gallery' | 'museum' | 'billboard' | 'nft' | 'evolution' | 'minimal';
  onClose?: () => void;
}

const SHOWCASE_MODES = ['gallery', 'museum', 'billboard', 'nft', 'minimal'] as Array<'gallery' | 'museum' | 'billboard' | 'nft' | 'minimal'>;

export default function TileShowcase({ tile, mode = 'gallery', onClose }: TileShowcaseProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [showControls, setShowControls] = useState(true);
  const router = useRouter();

  // Auto-hide controls after 5 seconds with debouncing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const showControlsOnMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowControls(false), 5000);
    };

    // Initial timer
    timer = setTimeout(() => setShowControls(false), 5000);
    
    document.addEventListener('mousemove', showControlsOnMove);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', showControlsOnMove);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === '1') setCurrentMode('gallery');
      if (e.key === '2') setCurrentMode('museum');
      if (e.key === '3') setCurrentMode('billboard');
      if (e.key === '4') setCurrentMode('nft');
      if (e.key === '5') setCurrentMode('evolution');
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/showcase/${tile.id}`;
    const title = `Check out my PixelMap Tile #${tile.id}!`;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ' 🎨 #PixelMap #NFT')}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    };
    
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/showcase/${tile.id}`;
    await navigator.clipboard.writeText(url);
    // TODO: Add toast notification
  };

  const downloadImage = () => {
    // TODO: Generate high-res version and trigger download
    const link = document.createElement('a');
    link.href = `https://pixelmap.art/${tile.id}/latest.png`;
    link.download = `pixelmap-tile-${tile.id}.png`;
    link.click();
  };

  return (
    <div className={`tile-showcase ${currentMode}`} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: currentMode === 'gallery' ? '#000' : 
                 currentMode === 'museum' ? '#1a1a1a' :
                 currentMode === 'billboard' ? 'linear-gradient(45deg, #ff6b6b, #4ecdc4)' :
                 '#121212',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      
      {/* Main Content */}
      <div className="showcase-content" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '90vw',
        maxHeight: '90vh'
      }}>
        
        {currentMode === 'gallery' && (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={getLargeImageUrl(tile.id || 0)} 
              alt={`PixelMap Tile #${tile.id}`}
              style={{
                width: 'min(80vmin, 600px)',
                height: 'min(80vmin, 600px)',
                imageRendering: 'pixelated',
                border: '4px solid #fff',
                boxShadow: '0 0 50px rgba(255,255,255,0.3)'
              }}
            />
          </div>
        )}

        {currentMode === 'museum' && (
          <div className="museum-frame" style={{
            background: '#8B4513',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 0 30px rgba(0,0,0,0.7)'
          }}>
            <img 
              src={getLargeImageUrl(tile.id || 0)} 
              alt={`PixelMap Tile #${tile.id}`}
              style={{
                width: '400px',
                height: '400px',
                imageRendering: 'pixelated',
                border: '8px solid #DAA520'
              }}
            />
            <div className="museum-plaque" style={{
              background: '#DAA520',
              color: '#000',
              padding: '20px',
              marginTop: '20px',
              fontFamily: 'serif',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Tile #{tile.id}</h2>
              <p style={{ margin: '5px 0', fontSize: '16px' }}>Owner: {shortenIfHex(tile.owner || '', 12)}</p>
              <p style={{ margin: '5px 0', fontSize: '16px' }}>Price: {tile.price} ETH</p>
              <p style={{ margin: '5px 0', fontSize: '14px', fontStyle: 'italic' }}>
                Part of PixelMap Collection (Est. 2016)
              </p>
            </div>
          </div>
        )}

        {currentMode === 'billboard' && (
          <div className="billboard-container" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '60px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ color: '#fff', marginBottom: '30px' }}>
              <h1 style={{ 
                fontSize: '4rem', 
                margin: '0', 
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontFamily: 'vcr_osd_monoregular, monospace'
              }}>
                TILE #{tile.id}
              </h1>
              <p style={{ fontSize: '1.5rem', opacity: 0.9 }}>
                PREMIUM DIGITAL REAL ESTATE
              </p>
            </div>
            <img 
              src={getLargeImageUrl(tile.id || 0)} 
              alt={`PixelMap Tile #${tile.id}`}
              style={{
                width: '300px',
                height: '300px',
                imageRendering: 'pixelated',
                border: '6px solid #fff',
                borderRadius: '10px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
              }}
            />
            <div style={{ color: '#fff', marginTop: '30px' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {tile.price} ETH
              </p>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                pixelmap.io
              </p>
            </div>
          </div>
        )}

        {currentMode === 'nft' && (
          <div className="nft-card" style={{
            background: 'linear-gradient(145deg, #2d3748, #1a202c)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #4a5568',
            maxWidth: '400px'
          }}>
            <img 
              src={getLargeImageUrl(tile.id || 0)} 
              alt={`PixelMap Tile #${tile.id}`}
              style={{
                width: '100%',
                height: '300px',
                imageRendering: 'pixelated',
                borderRadius: '15px',
                marginBottom: '20px'
              }}
            />
            <div style={{ color: '#fff' }}>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                PixelMap Tile #{tile.id}
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                fontSize: '14px',
                color: '#a0aec0'
              }}>
                <div>
                  <p style={{ margin: '0', color: '#718096' }}>Owner</p>
                  <p style={{ margin: '0', color: '#fff', fontWeight: 'bold' }}>
                    {tile.ens || shortenIfHex(tile.owner || '', 8)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#718096' }}>Price</p>
                  <p style={{ margin: '0', color: '#fff', fontWeight: 'bold' }}>
                    {tile.price} ETH
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#718096' }}>Status</p>
                  <p style={{ margin: '0', color: tile.wrapped ? '#48bb78' : '#ed8936', fontWeight: 'bold' }}>
                    {tile.wrapped ? '🎁 Wrapped' : '📦 Original'}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0', color: '#718096' }}>Collection</p>
                  <p style={{ margin: '0', color: '#fff', fontWeight: 'bold' }}>
                    PixelMap
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentMode === 'minimal' && (
          <img 
            src={getLargeImageUrl(tile.id || 0)} 
            alt={`PixelMap Tile #${tile.id}`}
            style={{
              width: '100vmin',
              height: '100vmin',
              imageRendering: 'pixelated',
              maxWidth: '100vw',
              maxHeight: '100vh'
            }}
          />
        )}
      </div>

      {/* Controls Overlay */}
      {showControls && (
        <div className="showcase-controls" style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="nes-btn is-error"
            style={{ fontSize: '12px' }}
          >
            ✕ Close
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="nes-btn"
            style={{ fontSize: '12px' }}
          >
            ⛶ Fullscreen
          </button>
          <button
            type="button"
            onClick={() => handleShare('twitter')}
            className="nes-btn is-primary"
            style={{ fontSize: '12px' }}
          >
            🐦 Tweet
          </button>
          <button
            type="button"
            onClick={downloadImage}
            className="nes-btn is-success"
            style={{ fontSize: '12px' }}
          >
            💾 Download
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            className="nes-btn is-warning"
            style={{ fontSize: '12px' }}
          >
            🔗 Copy Link
          </button>
        </div>
      )}

      {/* Mode Selector */}
      {showControls && (
        <div className="mode-selector" style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          background: 'rgba(0,0,0,0.8)',
          padding: '10px',
          borderRadius: '10px'
        }}>
          {SHOWCASE_MODES.map((modeOption) => (
            <button
              type="button"
              key={modeOption}
              onClick={() => setCurrentMode(modeOption as any)}
              className={`mode-btn ${currentMode === modeOption ? 'active' : ''}`}
              style={{
                background: currentMode === modeOption ? '#0066cc' : 'transparent',
                color: '#fff',
                border: '1px solid #333',
                padding: '8px 12px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {modeOption}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showControls && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: '#fff',
          fontSize: '12px',
          opacity: 0.7
        }}>
          <p style={{ margin: '0' }}>Press ESC to close • 1-5 to change modes</p>
        </div>
      )}
    </div>
  );
}