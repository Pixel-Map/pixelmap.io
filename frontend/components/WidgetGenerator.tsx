import React, { useState } from 'react';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

interface WidgetGeneratorProps {
  tile: PixelMapTile;
  onClose: () => void;
}

type WidgetStyle = 'minimal' | 'card' | 'detailed' | 'banner';

export default function WidgetGenerator({ tile, onClose }: WidgetGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<WidgetStyle>('card');
  const [liveUpdates, setLiveUpdates] = useState(false);
  const [customWidth, setCustomWidth] = useState('300');
  const [customHeight, setCustomHeight] = useState('400');

  const generateIframeCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pixelmap.io';
    const params = new URLSearchParams({
      style: selectedStyle,
      live: liveUpdates.toString()
    });
    
    return `<iframe 
  src="${baseUrl}/widget/${tile.id}?${params.toString()}" 
  width="${customWidth}" 
  height="${customHeight}"
  frameborder="0"
  style="border-radius: 8px; overflow: hidden;"
  title="PixelMap Tile #${tile.id}">
</iframe>`;
  };

  const generateJavaScriptCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pixelmap.io';
    
    return `<script>
(function() {
  const script = document.createElement('script');
  script.src = '${baseUrl}/widget.js';
  script.onload = function() {
    PixelMapWidget.embed({
      tileId: ${tile.id},
      style: '${selectedStyle}',
      live: ${liveUpdates},
      width: '${customWidth}px',
      height: '${customHeight}px',
      container: '#pixelmap-widget-${tile.id}'
    });
  };
  document.head.appendChild(script);
})();
</script>
<div id="pixelmap-widget-${tile.id}"></div>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const previewUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/widget/${tile.id}?style=${selectedStyle}&live=${liveUpdates}`
    : '';

  const styleDescriptions = {
    minimal: {
      name: '🔹 Minimal',
      description: 'Simple tile image with basic info',
      size: '200×150px',
      use: 'Sidebar, footer, or compact spaces'
    },
    card: {
      name: '🎴 Card',
      description: 'Standard card with owner and price info',
      size: '300×400px',
      use: 'Blog posts, articles, general embedding'
    },
    detailed: {
      name: '✨ Detailed',
      description: 'Premium card with gradient background',
      size: '400×500px',
      use: 'Feature presentations, portfolio sites'
    },
    banner: {
      name: '📊 Banner',
      description: 'Horizontal layout for headers',
      size: '600×100px',
      use: 'Website headers, email signatures'
    }
  };

  return (
    <div className="widget-generator nes-container is-dark with-title">
      <p className="title">🔧 Widget Generator</p>
      
      <div className="generator-content" style={{ display: 'flex', gap: '20px' }}>
        
        {/* Preview */}
        <div className="preview-section" style={{ flex: 1 }}>
          <h3 className="text-white mb-3">Preview:</h3>
          <div className="preview-container" style={{
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {previewUrl && (
              <iframe
                src={previewUrl}
                width={Math.min(parseInt(customWidth), 500)}
                height={Math.min(parseInt(customHeight), 400)}
                frameBorder="0"
                style={{ borderRadius: '8px', overflow: 'hidden' }}
                title={`PixelMap Tile #${tile.id} Widget Preview`}
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="controls-section" style={{ flex: 1, minWidth: '400px' }}>
          
          {/* Style Selection */}
          <div className="nes-field mb-4">
            <label className="text-white mb-2 block">Widget Style:</label>
            <div className="style-options space-y-2">
              {Object.entries(styleDescriptions).map(([key, info]) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer p-3 border border-gray-600 rounded hover:border-cyan-400">
                  <input
                    type="radio"
                    name="style"
                    value={key}
                    checked={selectedStyle === key}
                    onChange={(e) => setSelectedStyle(e.target.value as WidgetStyle)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm">{info.name}</div>
                    <div className="text-gray-300 text-xs">{info.description}</div>
                    <div className="text-gray-400 text-xs">
                      Recommended: {info.size} • {info.use}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="dimensions mb-4">
            <label className="text-white mb-2 block">Custom Dimensions:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="nes-field">
                <label className="text-gray-300 text-sm">Width (px):</label>
                <input
                  type="number"
                  className="nes-input is-dark"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  min="200"
                  max="800"
                />
              </div>
              <div className="nes-field">
                <label className="text-gray-300 text-sm">Height (px):</label>
                <input
                  type="number"
                  className="nes-input is-dark"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  min="150"
                  max="600"
                />
              </div>
            </div>
          </div>

          {/* Live Updates */}
          <div className="nes-field mb-4">
            <label>
              <input
                type="checkbox"
                className="nes-checkbox is-dark"
                checked={liveUpdates}
                onChange={(e) => setLiveUpdates(e.target.checked)}
              />
              <span className="text-white ml-2">Enable live updates (polls every 30s)</span>
            </label>
            <p className="text-gray-400 text-xs mt-1">
              Widget will automatically refresh when tile data changes
            </p>
          </div>

          {/* Generated Code */}
          <div className="generated-code mb-4">
            <h4 className="text-white mb-2">📋 Embed Code:</h4>
            
            {/* Iframe Code */}
            <div className="code-section mb-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm">HTML Iframe (Recommended):</label>
                <button
                  type="button"
                  className="nes-btn is-success"
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                  onClick={() => copyToClipboard(generateIframeCode())}
                >
                  📋 Copy
                </button>
              </div>
              <textarea
                className="nes-textarea is-dark"
                rows={8}
                value={generateIframeCode()}
                readOnly
                style={{ fontSize: '11px', fontFamily: 'monospace' }}
              />
            </div>

            {/* JavaScript Code */}
            <div className="code-section mb-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm">JavaScript (Advanced):</label>
                <button
                  type="button"
                  className="nes-btn is-primary"
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                  onClick={() => copyToClipboard(generateJavaScriptCode())}
                >
                  📋 Copy
                </button>
              </div>
              <textarea
                className="nes-textarea is-dark"
                rows={6}
                value={generateJavaScriptCode()}
                readOnly
                style={{ fontSize: '11px', fontFamily: 'monospace' }}
              />
            </div>

            {/* Direct Link */}
            <div className="code-section">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm">Direct Link:</label>
                <button
                  type="button"
                  className="nes-btn is-warning"
                  style={{ fontSize: '10px', padding: '3px 8px' }}
                  onClick={() => copyToClipboard(previewUrl)}
                >
                  📋 Copy
                </button>
              </div>
              <input
                type="text"
                className="nes-input is-dark"
                value={previewUrl}
                readOnly
                style={{ fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="nes-container is-rounded is-dark mb-4" style={{ fontSize: '12px' }}>
            <h4 className="text-cyan-400 mb-2">📖 Usage Instructions:</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• <strong>WordPress:</strong> Use HTML iframe code in HTML block</li>
              <li>• <strong>React/Next.js:</strong> Use iframe with dangerouslySetInnerHTML</li>
              <li>• <strong>Static Sites:</strong> Paste HTML code directly</li>
              <li>• <strong>Email:</strong> Use direct link or image fallback</li>
              <li>• <strong>Social Media:</strong> Share direct link</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="nes-btn is-success"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              👁️ Open Preview in New Tab
            </button>
            
            <button
              type="button"
              className="nes-btn is-primary"
              onClick={() => copyToClipboard(generateIframeCode())}
            >
              📋 Copy Iframe Code
            </button>
            
            <button
              type="button"
              className="nes-btn"
              onClick={onClose}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}