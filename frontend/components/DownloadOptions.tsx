import React, { useState, useRef, useCallback } from 'react';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import TileImage from './TileImage';
import { getLargeImageUrl } from '../utils/tileImageUtils';

interface DownloadOptionsProps {
  tile: PixelMapTile;
  onClose: () => void;
}

type DownloadFormat = 'wallpaper' | 'pattern' | 'widget' | 'avatar' | 'background' | 'hd';
type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

interface DownloadPreset {
  name: string;
  width: number;
  height: number;
  description: string;
}

const PRESETS: Record<string, DownloadPreset[]> = {
  wallpaper: [
    { name: '4K Desktop', width: 3840, height: 2160, description: '4K monitor wallpaper' },
    { name: 'HD Desktop', width: 1920, height: 1080, description: 'Standard HD wallpaper' },
    { name: 'MacBook Pro', width: 2880, height: 1800, description: 'MacBook Pro Retina' },
    { name: 'iPad', width: 2732, height: 2048, description: 'iPad Pro wallpaper' },
    { name: 'iPhone', width: 1170, height: 2532, description: 'iPhone wallpaper' }
  ],
  pattern: [
    { name: 'Desktop Pattern', width: 1920, height: 1080, description: 'Tiled pattern desktop' },
    { name: 'Mobile Pattern', width: 1080, height: 1920, description: 'Tiled pattern mobile' },
    { name: 'Square Pattern', width: 1080, height: 1080, description: 'Square tiled pattern' }
  ],
  widget: [
    { name: 'Small Widget', width: 300, height: 300, description: 'Small embed widget' },
    { name: 'Medium Widget', width: 600, height: 400, description: 'Medium embed widget' },
    { name: 'Large Widget', width: 800, height: 600, description: 'Large display widget' }
  ],
  avatar: [
    { name: 'Twitter/X Avatar', width: 400, height: 400, description: 'Profile picture' },
    { name: 'Discord Avatar', width: 256, height: 256, description: 'Discord profile' },
    { name: 'Favicon', width: 64, height: 64, description: 'Website favicon' }
  ],
  background: [
    { name: 'Zoom Background', width: 1920, height: 1080, description: 'Video call background' },
    { name: 'Teams Background', width: 1920, height: 1080, description: 'Microsoft Teams' },
    { name: 'Presentation', width: 1600, height: 900, description: 'Presentation backdrop' }
  ],
  hd: [
    { name: 'Original HD', width: 512, height: 512, description: 'High-res tile image' },
    { name: 'Print Quality', width: 2048, height: 2048, description: 'Print-ready quality' },
    { name: 'Ultra HD', width: 4096, height: 4096, description: 'Maximum resolution' }
  ]
};

export default function DownloadOptions({ tile, onClose }: DownloadOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>('wallpaper');
  const [selectedPreset, setSelectedPreset] = useState<DownloadPreset>(PRESETS.wallpaper[0]);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [useCustom, setUseCustom] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateDownload = useCallback(async (format: DownloadFormat, preset: DownloadPreset | null = null) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = useCustom ? customWidth : (preset?.width || 1920);
    const height = useCustom ? customHeight : (preset?.height || 1080);

    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.imageSmoothingEnabled = false; // Maintain pixel art style

      switch (format) {
        case 'wallpaper':
          generateWallpaper(ctx, img, width, height);
          break;
        case 'pattern':
          generatePattern(ctx, img, width, height);
          break;
        case 'widget':
          generateWidget(ctx, img, width, height);
          break;
        case 'avatar':
          generateAvatar(ctx, img, width, height);
          break;
        case 'background':
          generateBackground(ctx, img, width, height);
          break;
        case 'hd':
          generateHD(ctx, img, width, height);
          break;
      }
    };
    img.src = getLargeImageUrl(tile.id || 0);
  }, [tile.id, useCustom, customWidth, customHeight]);

  const generateWallpaper = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Center the tile image
    const size = Math.min(width, height) * 0.6;
    const x = (width - size) / 2;
    const y = (height - size) / 2;

    // Subtle glow effect
    ctx.shadowColor = '#4ecdc4';
    ctx.shadowBlur = 50;
    ctx.drawImage(img, x, y, size, size);
    
    ctx.shadowBlur = 0;

    // Add subtle PixelMap branding
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = `${Math.max(width * 0.02, 16)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('PixelMap.io', width / 2, height - 50);
  };

  const generatePattern = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    const tileSize = 100; // Size of each repeated tile
    const cols = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.drawImage(img, col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }

    // Add subtle overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);
  };

  const generateWidget = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    // Widget background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Tile image
    const imageSize = Math.min(width, height) * 0.7;
    const imageX = (width - imageSize) / 2;
    const imageY = 20;
    
    ctx.drawImage(img, imageX, imageY, imageSize, imageSize);

    // Info text
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(width * 0.06, 12)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`Tile #${tile.id}`, width / 2, imageY + imageSize + 30);
    
    ctx.fillStyle = '#aaa';
    ctx.font = `${Math.max(width * 0.04, 10)}px Arial`;
    ctx.fillText(`${tile.price} ETH`, width / 2, imageY + imageSize + 50);
    
    ctx.fillStyle = '#4ecdc4';
    ctx.font = `${Math.max(width * 0.035, 9)}px Arial`;
    ctx.fillText('PixelMap.io', width / 2, height - 15);
  };

  const generateAvatar = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    // Circular crop for avatar
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.clip();

    // Draw tile image to fill circle
    ctx.drawImage(img, 0, 0, width, height);

    // Add circular border
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 5, 0, 2 * Math.PI);
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 10;
    ctx.stroke();
  };

  const generateBackground = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    // Blurred background pattern
    const pattern = ctx.createPattern(img, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }

    // Blur overlay effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, width, height);

    // Center focus tile
    const focusSize = Math.min(width, height) * 0.3;
    const focusX = (width - focusSize) / 2;
    const focusY = (height - focusSize) / 2;

    // White border for focus
    ctx.fillStyle = '#fff';
    ctx.fillRect(focusX - 5, focusY - 5, focusSize + 10, focusSize + 10);
    
    ctx.drawImage(img, focusX, focusY, focusSize, focusSize);
  };

  const generateHD = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    // Simple high-resolution version
    ctx.drawImage(img, 0, 0, width, height);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const preset = useCustom ? null : selectedPreset;
    const filename = `pixelmap-tile-${tile.id}-${selectedFormat}${preset ? `-${preset.name.toLowerCase().replace(/\s+/g, '-')}` : ''}.png`;
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  // Generate preview when settings change
  React.useEffect(() => {
    generateDownload(selectedFormat, selectedPreset);
  }, [selectedFormat, selectedPreset, useCustom, customWidth, customHeight, generateDownload]);

  return (
    <div className="download-options nes-container is-dark with-title">
      <p className="title">💾 Download Options</p>
      
      <div className="download-content" style={{ display: 'flex', gap: '20px' }}>
        {/* Preview */}
        <div className="preview-section" style={{ flex: 1 }}>
          <canvas 
            ref={canvasRef}
            style={{ 
              width: '100%', 
              maxWidth: '500px',
              maxHeight: '400px',
              border: '2px solid #ccc',
              borderRadius: '8px',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Controls */}
        <div className="controls-section" style={{ flex: 1, minWidth: '350px' }}>
          
          {/* Format Selection */}
          <div className="nes-field mb-4">
            <label htmlFor="format" className="text-white">Download Format:</label>
            <div className="nes-select is-dark">
              <select 
                id="format"
                value={selectedFormat} 
                onChange={(e) => {
                  const format = e.target.value as DownloadFormat;
                  setSelectedFormat(format);
                  setSelectedPreset(PRESETS[format][0]);
                  setUseCustom(false);
                }}
              >
                <option value="wallpaper">🖼️ Wallpaper - Desktop/Mobile backgrounds</option>
                <option value="pattern">🔄 Pattern - Repeating tile patterns</option>
                <option value="widget">📱 Widget - Embeddable displays</option>
                <option value="avatar">👤 Avatar - Profile pictures</option>
                <option value="background">🎥 Background - Video call backgrounds</option>
                <option value="hd">🔍 HD - High resolution images</option>
              </select>
            </div>
          </div>

          {/* Preset Selection */}
          {!useCustom && (
            <div className="nes-field mb-4">
              <label htmlFor="preset" className="text-white">Size Preset:</label>
              <div className="nes-select is-dark">
                <select 
                  id="preset"
                  value={PRESETS[selectedFormat].findIndex(p => p === selectedPreset)} 
                  onChange={(e) => setSelectedPreset(PRESETS[selectedFormat][parseInt(e.target.value)])}
                >
                  {PRESETS[selectedFormat].map((preset, index) => (
                    <option key={index} value={index}>
                      {preset.name} ({preset.width}x{preset.height}) - {preset.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Custom Size Toggle */}
          <div className="nes-field mb-4">
            <label>
              <input 
                type="checkbox" 
                className="nes-checkbox is-dark"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
              />
              <span className="text-white ml-2">Use custom dimensions</span>
            </label>
          </div>

          {/* Custom Size Inputs */}
          {useCustom && (
            <div className="custom-size mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="nes-field">
                <label htmlFor="width" className="text-white">Width:</label>
                <input 
                  type="number" 
                  id="width"
                  className="nes-input is-dark"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1920)}
                  min="100"
                  max="8192"
                />
              </div>
              <div className="nes-field">
                <label htmlFor="height" className="text-white">Height:</label>
                <input 
                  type="number" 
                  id="height"
                  className="nes-input is-dark"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1080)}
                  min="100"
                  max="8192"
                />
              </div>
            </div>
          )}

          {/* Current Selection Info */}
          <div className="nes-container is-rounded is-dark mb-4" style={{ fontSize: '14px' }}>
            <p className="text-gray-300">
              <strong>Selected:</strong> {selectedFormat} format<br/>
              <strong>Size:</strong> {useCustom ? `${customWidth}x${customHeight}` : `${selectedPreset.width}x${selectedPreset.height}`}<br/>
              <strong>File:</strong> pixelmap-tile-{tile.id}-{selectedFormat}.png
            </p>
          </div>

          {/* Action Buttons */}
          <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="button"
              className="nes-btn is-success"
              onClick={downloadImage}
            >
              💾 Download Now
            </button>
            
            <button 
              type="button"
              className="nes-btn is-primary"
              onClick={() => generateDownload(selectedFormat, selectedPreset)}
            >
              🔄 Regenerate Preview
            </button>
            
            <button 
              type="button"
              className="nes-btn"
              onClick={onClose}
            >
              ← Back
            </button>
          </div>

          {/* Quick Presets */}
          <div className="quick-presets mt-4">
            <p className="text-white text-sm mb-2">⚡ Quick Downloads:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '12px' }}>
              <button 
                type="button"
                className="nes-btn is-primary"
                style={{ fontSize: '10px', padding: '5px' }}
                onClick={() => {
                  setSelectedFormat('wallpaper');
                  setSelectedPreset(PRESETS.wallpaper[1]);
                  setTimeout(downloadImage, 100);
                }}
              >
                HD Wallpaper
              </button>
              <button 
                type="button"
                className="nes-btn is-success"
                style={{ fontSize: '10px', padding: '5px' }}
                onClick={() => {
                  setSelectedFormat('avatar');
                  setSelectedPreset(PRESETS.avatar[0]);
                  setTimeout(downloadImage, 100);
                }}
              >
                Profile Pic
              </button>
              <button 
                type="button"
                className="nes-btn is-warning"
                style={{ fontSize: '10px', padding: '5px' }}
                onClick={() => {
                  setSelectedFormat('background');
                  setSelectedPreset(PRESETS.background[0]);
                  setTimeout(downloadImage, 100);
                }}
              >
                Zoom BG
              </button>
              <button 
                type="button"
                className="nes-btn is-error"
                style={{ fontSize: '10px', padding: '5px' }}
                onClick={() => {
                  setSelectedFormat('hd');
                  setSelectedPreset(PRESETS.hd[2]);
                  setTimeout(downloadImage, 100);
                }}
              >
                Ultra HD
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}