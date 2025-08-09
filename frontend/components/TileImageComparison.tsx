import React, { useState, useRef, useEffect } from 'react';
import TileImage from './TileImage';
import { PixelMapImage } from '@pixelmap/common/types/PixelMapImage';
import { formatDistanceToNow } from 'date-fns';

interface TileImageComparisonProps {
  images: PixelMapImage[];
  currentImage?: string;
}

export default function TileImageComparison({ images, currentImage }: TileImageComparisonProps) {
  // Handle empty or null images array
  const safeImages = images || [];
  
  const [leftIndex, setLeftIndex] = useState(Math.max(0, safeImages.length - 1));
  const [rightIndex, setRightIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackInterval = useRef<NodeJS.Timeout>();

  const allImages = currentImage ? 
    [{ image: currentImage, image_url: '', blockNumber: 0, date: new Date() }, ...safeImages] : 
    safeImages;

  useEffect(() => {
    if (isPlaying && allImages.length > 0) {
      playbackInterval.current = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % allImages.length);
      }, playbackSpeed);
    } else {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    }
    
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, [isPlaying, playbackSpeed, allImages.length]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const getPixelDifferences = () => {
    if (leftIndex === rightIndex) return 0;
    
    const leftImage = allImages[leftIndex].image;
    const rightImage = allImages[rightIndex].image;
    
    if (!leftImage || !rightImage) return 0;
    
    let differences = 0;
    const minLength = Math.min(leftImage.length, rightImage.length);
    
    for (let i = 0; i < minLength; i += 3) {
      const leftPixel = leftImage.substr(i, 3);
      const rightPixel = rightImage.substr(i, 3);
      if (leftPixel !== rightPixel) differences++;
    }
    
    return differences;
  };

  const pixelDifferences = getPixelDifferences();
  const percentChanged = ((pixelDifferences / 256) * 100).toFixed(1);

  // Handle case where there are no images
  if (allImages.length === 0) {
    return (
      <div className="nes-container is-dark is-rounded text-center py-8">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="nes-container is-dark is-rounded">
        <h3 className="text-lg font-bold text-white mb-4" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>🎮 Image Evolution Viewer</h3>
        
        <div className="mb-4 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`nes-btn ${isPlaying ? 'is-error' : 'is-success'}`}
          >
            {isPlaying ? '⏸ Stop' : '▶ Play'}
          </button>
          
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="nes-select is-dark"
          >
            <option value={2000}>Slow</option>
            <option value={1000}>Normal</option>
            <option value={500}>Fast</option>
            <option value={250}>Turbo</option>
          </select>
        </div>

        {isPlaying ? (
          <div className="space-y-4">
            <div className="relative w-full max-w-md mx-auto">
              <TileImage 
                image={allImages[currentFrame].image} 
                className="w-64 h-64 mx-auto border-4 border-gray-300"
              />
              <div className="text-center mt-4">
                <p className="font-semibold">Frame {currentFrame + 1} of {allImages.length}</p>
                <p className="text-sm text-gray-600">
                  {formatDistanceToNow(allImages[currentFrame].date, { addSuffix: true })}
                </p>
                <p className="text-xs text-gray-500">
                  Block #{allImages[currentFrame].blockNumber.toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentFrame + 1) / allImages.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Left Image (Older)
                </label>
                <select
                  value={leftIndex}
                  onChange={(e) => setLeftIndex(Number(e.target.value))}
                  className="w-full p-2 border rounded mb-2"
                >
                  {allImages.map((img, idx) => (
                    <option key={idx} value={idx}>
                      {idx === 0 && currentImage ? 'Current' : `${formatDistanceToNow(img.date, { addSuffix: true })}`}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  Block #{allImages[leftIndex].blockNumber.toLocaleString()}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Right Image (Newer)
                </label>
                <select
                  value={rightIndex}
                  onChange={(e) => setRightIndex(Number(e.target.value))}
                  className="w-full p-2 border rounded mb-2"
                >
                  {allImages.map((img, idx) => (
                    <option key={idx} value={idx}>
                      {idx === 0 && currentImage ? 'Current' : `${formatDistanceToNow(img.date, { addSuffix: true })}`}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500">
                  Block #{allImages[rightIndex].blockNumber.toLocaleString()}
                </div>
              </div>
            </div>

            <div 
              ref={containerRef}
              className="relative w-full max-w-2xl mx-auto h-64 md:h-96 cursor-ew-resize select-none"
              onMouseMove={handleMouseMove}
              onTouchMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchEnd={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="absolute inset-0 overflow-hidden">
                <TileImage 
                  image={allImages[leftIndex].image} 
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <TileImage 
                  image={allImages[rightIndex].image} 
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {leftIndex !== rightIndex && (
              <div className="nes-container is-dark is-rounded mt-4">
                <h4 className="text-lg font-bold text-cyan-400 mb-3" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>📊 COMPARISON STATS</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Pixels</p>
                    <p className="text-2xl font-bold text-green-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{pixelDifferences}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Changed</p>
                    <p className="text-2xl font-bold text-yellow-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{percentChanged}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Time Gap</p>
                    <p className="text-lg font-bold text-purple-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>
                      {formatDistanceToNow(allImages[leftIndex].date, { 
                        addSuffix: false 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase">Blocks</p>
                    <p className="text-2xl font-bold text-red-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>
                      {Math.abs(allImages[rightIndex].blockNumber - allImages[leftIndex].blockNumber).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="nes-container is-dark is-rounded">
        <h3 className="text-lg font-bold text-white mb-4" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>🖼️ Image History Gallery</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {allImages.map((img, idx) => (
            <div 
              key={idx}
              className="relative group cursor-pointer transform transition-transform hover:scale-110"
              onClick={() => {
                if (idx < allImages.length / 2) {
                  setLeftIndex(idx);
                } else {
                  setRightIndex(idx);
                }
              }}
            >
              <TileImage 
                image={img.image} 
                className="w-full h-auto border-2 border-gray-600 hover:border-cyan-400 transition-all img-pixel"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-80 transition-all flex items-center justify-center">
                <p className="text-cyan-400 text-xs opacity-0 group-hover:opacity-100 text-center p-1 font-mono">
                  {idx === 0 && currentImage ? 'NOW' : formatDistanceToNow(img.date, { addSuffix: true })}
                </p>
              </div>
              {(idx === leftIndex || idx === rightIndex) && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 ${idx === leftIndex ? 'bg-purple-500' : 'bg-green-500'} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {idx === leftIndex ? 'L' : 'R'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}