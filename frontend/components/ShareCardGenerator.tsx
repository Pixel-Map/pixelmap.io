import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import TileImage from './TileImage';
import { formatDistanceToNow } from 'date-fns';
import { shortenIfHex } from '../utils/misc';
import { getLargeImageUrl } from '../utils/tileImageUtils';

interface ShareCardGeneratorProps {
  tile: PixelMapTile;
  onClose: () => void;
}

type CardTemplate = 'classic' | 'brag' | 'forsale';

export default function ShareCardGenerator({ tile, onClose }: ShareCardGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>('classic');
  const [customText, setCustomText] = useState('');
  const [salePrice, setSalePrice] = useState('1.0');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCard = useCallback(async (template: CardTemplate, text?: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for Twitter card (1200x630)
    canvas.width = 1200;
    canvas.height = 630;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    switch (template) {
      case 'classic':
        await generateClassicCard(ctx);
        break;
      case 'brag':
        await generateBragCard(ctx, text || customText);
        break;
      case 'forsale':
        await generateForSaleCard(ctx, salePrice);
        break;
      default:
        await generateClassicCard(ctx);
    }
  }, [tile, customText, salePrice]);

  const generateClassicCard = async (ctx: CanvasRenderingContext2D) => {
    // PixelMap logo-inspired pixelated background
    const pixelSize = 20;
    const cols = Math.ceil(1200 / pixelSize);
    const rows = Math.ceil(630 / pixelSize);
    
    // More vibrant PixelMap logo colors
    const logoColors = [
      '#00ffff', // Pure cyan - very vibrant
      '#00e5e5', // Bright teal
      '#00cccc', // Medium cyan
      '#0099ff', // Bright blue
      '#0066ff', // Royal blue
      '#3366ff', // Blue-purple
      '#0080ff', // Light blue
      '#00b3ff', // Sky blue
      '#4da6ff', // Lighter blue
      '#66b3ff', // Very light blue
      '#004d99', // Dark blue (for contrast)
      '#003366', // Very dark blue (for depth)
    ];
    
    // Create pixelated background with logo colors
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * pixelSize;
        const y = row * pixelSize;
        
        // Create some pattern variety - more blue/cyan in center, darker on edges
        const distanceFromCenter = Math.sqrt(
          Math.pow((x + pixelSize/2) - 600, 2) + 
          Math.pow((y + pixelSize/2) - 315, 2)
        ) / 400;
        
        let colorIndex;
        if (distanceFromCenter < 0.3) {
          // Center area - bright cyans and teals
          colorIndex = Math.floor(Math.random() * 6);
        } else if (distanceFromCenter < 0.7) {
          // Middle area - mix of all colors
          colorIndex = Math.floor(Math.random() * logoColors.length);
        } else {
          // Edge area - darker blues and grays
          colorIndex = Math.floor(Math.random() * 4) + (logoColors.length - 4);
        }
        
        ctx.fillStyle = logoColors[colorIndex];
        ctx.fillRect(x, y, pixelSize, pixelSize);
        
        // Add slight random variation for more organic feel
        if (Math.random() < 0.1) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = logoColors[Math.floor(Math.random() * logoColors.length)];
          ctx.fillRect(x, y, pixelSize, pixelSize);
          ctx.globalAlpha = 1.0;
        }
      }
    }
    
    // Add subtle overlay to soften the background slightly
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, 1200, 630);

    // Tile image and text (centered as a group)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw tile image with pixelated scaling
      ctx.imageSmoothingEnabled = false;
      const size = 300;
      const textWidth = 480; // Wider to accommodate long addresses
      const gap = 40; // Slightly smaller gap
      const totalWidth = size + gap + textWidth;
      
      // Center the entire composition, shifted slightly left
      const startX = (1200 - totalWidth) / 2 - 30;
      const y = (630 - size) / 2;
      
      // Image positioning
      const imageX = startX;
      
      // Text content positioning
      const textX = imageX + size + gap;
      
      // FIRST: Draw full-width background bar (behind everything)
      const textBoxHeight = 380; // Much taller than tile for prominent background
      const textBoxY = y - 40; // Start well above tile
      const margin = 40; // Margin from edges
      const fullWidth = 1200 - (margin * 2); // Full width with margins
      const backgroundX = margin; // Start at margin
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; // Darker background for better text contrast
      ctx.fillRect(backgroundX, textBoxY, fullWidth, textBoxHeight);
      
      // Add classy border to the full background
      // Outer dark border
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 4;
      ctx.strokeRect(backgroundX - 2, textBoxY - 2, fullWidth + 4, textBoxHeight + 4);
      
      // Inner light border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(backgroundX, textBoxY, fullWidth, textBoxHeight);
      
      // SECOND: Draw tile image ON TOP of background
      // Classy border for tile image - multiple layers
      // Outer dark border
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(imageX - 15, y - 15, size + 30, size + 30);
      
      // Middle light border  
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(imageX - 12, y - 12, size + 24, size + 24);
      
      // Inner shadow border
      ctx.fillStyle = '#d0d0d0';
      ctx.fillRect(imageX - 8, y - 8, size + 16, size + 16);
      
      // Final white border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(imageX - 4, y - 4, size + 8, size + 8);
      
      // Draw the actual tile image
      ctx.drawImage(img, imageX, y, size, size);
      
      // High contrast text with shadows for maximum legibility
      const textStartX = textX + 15; // More padding from left edge
      
      // Add text shadow for all text
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;
      
      ctx.fillStyle = '#ffffff'; // Pure white
      ctx.font = 'bold 44px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Tile #${tile.id}`, textStartX, y + 50);
      
      ctx.font = 'bold 26px Arial'; // Made bold for better readability
      ctx.fillStyle = '#ffffff';
      // Longer owner text - don't shorten as much to accommodate wider box
      const ownerText = `Owner: ${tile.ens || shortenIfHex(tile.owner || '', 16)}`;
      ctx.fillText(ownerText, textStartX, y + 90);
      
      ctx.fillStyle = '#00ffff'; // Bright cyan to match logo
      ctx.font = 'bold 24px Arial';
      ctx.fillText(tile.wrapped ? 'Status: Wrapped' : 'Status: Original', textStartX, y + 125);
      
      // PixelMap branding - positioned in middle area
      ctx.font = 'bold 40px Arial'; // Slightly bigger for prominence
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PixelMap', textStartX, y + 180);
      
      ctx.font = 'bold 24px Arial'; // Made bold
      ctx.fillStyle = '#00ffff'; // Bright cyan for emphasis
      ctx.fillText('2nd NFT on Ethereum (2016)', textStartX, y + 215);
      
      ctx.font = 'bold 22px Arial'; // Made bold and slightly bigger
      ctx.fillStyle = '#ffffff';
      ctx.fillText('3,970 Tiles • 16x16 Pixels Each', textStartX, y + 245);
      
      // Add pixelmap.io at bottom
      ctx.font = 'bold 20px Arial'; // Made bold and bigger
      ctx.fillStyle = '#00ffff';
      ctx.fillText('pixelmap.io', textStartX, y + 275);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
    };
    img.src = getLargeImageUrl(tile.id || 0);
  };

  const generateBragCard = async (ctx: CanvasRenderingContext2D, customText?: string) => {
    // Black starry background with diamond stars
    const gradient = ctx.createLinearGradient(0, 0, 0, 630);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.5, '#0a0a0a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);
    
    // Function to draw a diamond star
    const drawDiamond = (x: number, y: number, size: number, brightness: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      
      // Diamond gradient
      const diamondGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      diamondGrad.addColorStop(0, `rgba(255, 255, 255, ${brightness})`);
      diamondGrad.addColorStop(0.5, `rgba(200, 255, 255, ${brightness * 0.8})`);
      diamondGrad.addColorStop(1, `rgba(150, 200, 255, 0)`);
      
      ctx.fillStyle = diamondGrad;
      ctx.fillRect(-size/2, -size/2, size, size);
      ctx.restore();
    };
    
    // Create sparkling diamond stars
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * 1200;
      const y = Math.random() * 630;
      const size = Math.random() * 4 + 2;
      const brightness = Math.random() * 0.8 + 0.2;
      drawDiamond(x, y, size, brightness);
    }
    
    // Add some larger, brighter diamonds
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 1200;
      const y = Math.random() * 630;
      const size = Math.random() * 8 + 6;
      const brightness = Math.random() * 0.5 + 0.5;
      drawDiamond(x, y, size, brightness);
    }
    
    // Add subtle glow effect for some diamonds
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * 1200;
      const y = Math.random() * 630;
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, 30);
      glowGrad.addColorStop(0, 'rgba(100, 200, 255, 0.5)');
      glowGrad.addColorStop(1, 'rgba(100, 200, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - 30, y - 30, 60, 60);
    }
    ctx.globalAlpha = 1.0;

    // Add text glow for diamond/star theme
    ctx.shadowColor = '#00ffff';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 20;
    
    // Main text - larger and bolder with gradient
    const textGradient = ctx.createLinearGradient(0, 100, 0, 180);
    textGradient.addColorStop(0, '#ffffff');
    textGradient.addColorStop(1, '#00ffff');
    ctx.fillStyle = textGradient;
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    const mainText = customText || `I own Tile #${tile.id}!`;
    ctx.fillText(mainText, 600, 150);
    
    // Reset shadow for subtitle
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    
    // Subtitle with holding time - diamond emoji
    ctx.font = 'bold 34px Arial';
    ctx.fillStyle = '#ffffff'; // White for contrast
    
    // Get the most recent activity date from both purchase and transfer history
    const backendPurchaseHistory = (tile as any).purchase_history || [];
    const backendTransferHistory = (tile as any).transfer_history || [];
    
    // Debug logging
    console.log('ShareCard - Tile ID:', tile.id);
    console.log('ShareCard - Purchase history:', backendPurchaseHistory);
    console.log('ShareCard - Transfer history:', backendTransferHistory);
    
    let lastActivityDate = new Date('2016-11-17'); // PixelMap launch date fallback
    
    // Check purchase history for most recent purchase
    if (backendPurchaseHistory.length > 0) {
      const lastPurchase = backendPurchaseHistory[backendPurchaseHistory.length - 1];
      const purchaseDate = new Date(lastPurchase.timestamp);
      if (purchaseDate > lastActivityDate) {
        lastActivityDate = purchaseDate;
      }
    }
    
    // Check transfer history for most recent transfer
    if (backendTransferHistory.length > 0) {
      const lastTransfer = backendTransferHistory[backendTransferHistory.length - 1];
      const transferDate = new Date(lastTransfer.timestamp);
      if (transferDate > lastActivityDate) {
        lastActivityDate = transferDate;
      }
    }
    
    console.log('ShareCard - Final last activity date:', lastActivityDate);
    const holdTime = formatDistanceToNow(lastActivityDate, { addSuffix: false });
    console.log('ShareCard - Calculated hold time:', holdTime);
    ctx.fillText(`💎 Holding for ${holdTime} 💎`, 600, 200);

    // Tile image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      const size = 220;
      const x = (1200 - size) / 2;
      const y = 240;
      
      // Diamond-style glowing border
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(x - 10, y - 10, size + 20, size + 20);
      
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
      
      // Draw the tile image
      ctx.drawImage(img, x, y, size, size);
      
      // Footer information with glow
      ctx.shadowColor = '#00ffff';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 10;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Arial';
      ctx.fillText('2nd NFT on Ethereum', 600, 500);
      
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#00ffff';
      ctx.fillText('3,970 Tiles • 16x16 Pixels Each', 600, 530);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Arial';
      ctx.fillText('pixelmap.io', 600, 565);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 0;
    };
    img.src = getLargeImageUrl(tile.id || 0);
  };

  const generateForSaleCard = async (ctx: CanvasRenderingContext2D, price: string) => {
    // Retro purple/pink gradient background (classic arcade style)
    const gradient = ctx.createLinearGradient(0, 0, 0, 630);
    gradient.addColorStop(0, '#2a0845'); // Deep purple
    gradient.addColorStop(0.5, '#5a1e6b'); // Mid purple-pink
    gradient.addColorStop(1, '#2a0845'); // Deep purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);
    
    // Retro grid lines (80s style)
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    // Horizontal lines with perspective
    for (let i = 400; i < 630; i += 20) {
      ctx.globalAlpha = (i - 400) / 230 * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1200, i);
      ctx.stroke();
    }
    
    // Vertical lines with perspective effect
    const centerX = 600;
    for (let i = -600; i <= 600; i += 40) {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(centerX + i * 0.3, 400);
      ctx.lineTo(centerX + i * 2, 630);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Pixelated "FOR SALE" banner
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 0; // No blur for pixel perfect
    
    // Yellow retro banner background
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(200, 40, 800, 80);
    
    // Red inner banner
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(210, 50, 780, 60);
    
    // Pixel font style text
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('★ FOR SALE ★', 600, 92);
    
    // Add blinking effect rectangles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(250, 65, 20, 30);
    ctx.fillRect(930, 65, 20, 30);

    // Tile image with retro frame
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      const size = 256; // Power of 2 for pixel perfect
      const imageX = centerX - size/2;
      const y = 150;
      
      // Multi-layer pixel border (NES style)
      // Outer black border
      ctx.fillStyle = '#000000';
      ctx.fillRect(imageX - 24, y - 24, size + 48, size + 48);
      
      // White border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(imageX - 16, y - 16, size + 32, size + 32);
      
      // Gray border
      ctx.fillStyle = '#808080';
      ctx.fillRect(imageX - 8, y - 8, size + 16, size + 16);
      
      // Inner white highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(imageX - 4, y - 4, size + 8, size + 8);
      
      // Draw the tile (pixelated)
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.drawImage(img, imageX, y, size, size);
      
      // Retro price display (arcade style)
      const priceY = y + size + 35;
      
      // Price background (coin style)
      ctx.shadowColor = '#000';
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      // Yellow coin background
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(centerX - 150, priceY - 30, 300, 60);
      
      // Dark inner
      ctx.fillStyle = '#000000';
      ctx.fillRect(centerX - 145, priceY - 25, 290, 50);
      
      // Price text in green (like old displays)
      ctx.shadowColor = '#00ff00';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowBlur = 8;
      
      ctx.fillStyle = '#00ff00';
      ctx.font = 'bold 42px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`${price} ETH`, centerX, priceY + 8);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowColor = '#000';
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Tile ID in pixel style
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 32px Courier New';
      ctx.fillText(`TILE #${String(tile.id).padStart(4, '0')}`, centerX, priceY + 55);
      
      // 8-bit style info boxes
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 20px Courier New';
      
      // Left info box
      ctx.fillStyle = '#000';
      ctx.fillRect(50, 520, 250, 80);
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(55, 525, 240, 70);
      ctx.fillStyle = '#000';
      ctx.fillRect(60, 530, 230, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText('> 2ND NFT EVER', 70, 555);
      ctx.fillText('> SINCE 2016', 70, 575);
      
      // Right info box
      ctx.fillStyle = '#000';
      ctx.fillRect(900, 520, 250, 80);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(905, 525, 240, 70);
      ctx.fillStyle = '#000';
      ctx.fillRect(910, 530, 230, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Courier New';
      ctx.textAlign = 'right';
      ctx.fillText('16x16 PIXELS <', 1130, 555);
      ctx.fillText('3,970 TILES <', 1130, 575);
      
      // Bottom URL in retro style
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 24px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('[ PIXELMAP.IO ]', centerX, 590);
      
      // Add corner decorations
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ff00ff';
      // Top left
      ctx.fillRect(20, 20, 40, 8);
      ctx.fillRect(20, 20, 8, 40);
      // Top right
      ctx.fillRect(1140, 20, 40, 8);
      ctx.fillRect(1172, 20, 8, 40);
      // Bottom left
      ctx.fillRect(20, 602, 40, 8);
      ctx.fillRect(20, 570, 8, 40);
      // Bottom right
      ctx.fillRect(1140, 602, 40, 8);
      ctx.fillRect(1172, 570, 8, 40);
      
      // Reset all shadows
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    };
    img.src = getLargeImageUrl(tile.id || 0);
  };


  const downloadCard = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `pixelmap-tile-${tile.id}-${selectedTemplate}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const shareToTwitter = async () => {
    if (!canvasRef.current) return;

    const texts = {
      classic: `Check out my @PixelMapNFT tile! 🎨 Tile #${tile.id} on the blockchain since 2016`,
      brag: `💎 Been hodling PixelMap Tile #${tile.id} like a true diamond hand! OG NFT from 2016`,
      forsale: `🔥 PixelMap Tile #${tile.id} is FOR SALE! ${salePrice} ETH for this piece of NFT history`
    };

    const text = `${texts[selectedTemplate]} #PixelMap #NFT #DigitalRealEstate`;
    const tileUrl = `https://pixelmap.io/tile/${tile.id}`;

    try {
      // Try to copy image to clipboard first
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          try {
            const clipboardItem = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([clipboardItem]);
            
            // Open Twitter and show success message
            fallbackTwitterShare(text, tileUrl);
            
            // Show notification that image is in clipboard
            setTimeout(() => {
              alert('✅ Image copied to clipboard! Paste it into your tweet with Ctrl+V (or Cmd+V on Mac).');
            }, 1000);
          } catch (clipboardError) {
            console.log('Clipboard copy failed, downloading instead:', clipboardError);
            // Fallback: Download image and open Twitter
            downloadCard();
            setTimeout(() => {
              fallbackTwitterShare(text, tileUrl);
              alert('Image downloaded! Please attach it manually to your tweet.');
            }, 500);
          }
        } else {
          // Fallback: Download image and open Twitter
          downloadCard();
          setTimeout(() => {
            fallbackTwitterShare(text, tileUrl);
            alert('Image downloaded! Please attach it manually to your tweet.');
          }, 500);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Share failed:', error);
      fallbackTwitterShare(text, tileUrl);
    }
  };

  const fallbackTwitterShare = (text: string, url: string) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
  };

  // Generate initial card
  React.useEffect(() => {
    generateCard(selectedTemplate, customText);
  }, [selectedTemplate, customText, salePrice, generateCard]);

  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Use React Portal to render modal at document body level
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto" 
         onClick={(e) => {
           // Only close if clicking the background overlay, not the modal content
           if (e.target === e.currentTarget) {
             onClose();
           }
         }}>
      <div className="share-card-generator nes-container is-dark with-title max-w-6xl w-full mx-auto my-8 relative">
        <p className="title">📸 Share Card Generator</p>
        <button 
          type="button"
          className="absolute right-4 top-4 text-white hover:text-gray-300 text-2xl z-10"
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="generator-content" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Canvas Preview */}
          <div className="preview-section" style={{ flex: '1 1 600px', minWidth: '300px' }}>
            <canvas 
              ref={canvasRef}
              style={{ 
                width: '100%', 
                maxWidth: '600px', 
                border: '2px solid #ccc',
                borderRadius: '8px'
              }}
            />
          </div>

          {/* Controls */}
          <div className="controls-section" style={{ flex: '1 1 400px', minWidth: '300px' }}>
          
          {/* Template Selection */}
          <div className="nes-field mb-4">
            <label htmlFor="template" className="text-white">Choose Template:</label>
            <div className="nes-select is-dark">
              <select 
                id="template"
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value as CardTemplate)}
              >
                <option value="classic">🎨 Classic - Clean & Professional</option>
                <option value="brag">💎 Brag - Show Off Your Hold</option>
                <option value="forsale">🔥 For Sale - Eye-catching Sales</option>
              </select>
            </div>
          </div>

          {/* Custom Text */}
          <div className="nes-field mb-4">
            <label htmlFor="customText" className="text-white">Custom Text (optional):</label>
            <input 
              type="text" 
              id="customText"
              className="nes-input is-dark"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Add your own message..."
              maxLength={50}
            />
          </div>

          {/* Price Input for For Sale */}
          {selectedTemplate === 'forsale' && (
            <div className="nes-field mb-4">
              <label htmlFor="salePrice" className="text-white">Sale Price (ETH):</label>
              <input 
                type="text" 
                id="salePrice"
                className="nes-input is-dark"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter price in ETH..."
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="button"
              className="nes-btn is-primary"
              onClick={downloadCard}
            >
              💾 Download Card
            </button>
            
            <button 
              type="button"
              className="nes-btn is-success"
              onClick={shareToTwitter}
            >
              📷 Copy Image & Share
            </button>
            
            <button 
              type="button"
              className="nes-btn is-primary"
              onClick={() => {
                const text = encodeURIComponent(`Check out my @PixelMapNFT tile! 🎨 Tile #${tile.id} #PixelMap #NFT`);
                const url = encodeURIComponent(`https://pixelmap.io/tile/${tile.id}`);
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
              }}
            >
              🐦 Share on X/Twitter (text only)
            </button>
            
            <button 
              type="button"
              className="nes-btn is-warning"
              onClick={() => generateCard(selectedTemplate, customText)}
            >
              🔄 Regenerate
            </button>
            
            <button 
              type="button"
              className="nes-btn"
              onClick={onClose}
            >
              ← Back
            </button>
          </div>

          {/* Tips */}
          <div className="nes-container is-rounded is-dark mt-4" style={{ fontSize: '12px' }}>
            <p className="text-gray-400">
              💡 <strong>Tips:</strong><br/>
              • "Copy Image & Share" copies to clipboard + opens Twitter<br/>
              • If clipboard fails, image downloads automatically<br/>
              • Paste with Ctrl+V (Cmd+V on Mac) in your tweet<br/>
              • Use "Brag" template for diamond hands flex<br/>
              • Custom text limited to 50 characters
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}