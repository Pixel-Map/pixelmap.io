import React, { useRef, useEffect } from "react";
import type { RefObject } from "react";
import { decompressTileCode } from "../utils/ImageUtils";

interface TileImageProps {
  image?: string;
  className?: string;
}

export default function TileImage({image, className = ''}: TileImageProps) {
  const canvasRef: RefObject<HTMLCanvasElement> = useRef(null);
  
  useEffect(() => {
    const draw = (ctx: CanvasRenderingContext2D) => {
      if (!image) return;
      
      const hex = decompressTileCode(image);
      if (!hex || hex.length !== 768) {
        return;
      }

      const pixels = hex.match(/.{1,3}/g);
      if (!pixels || pixels.length !== 256) {
        return;
      }

      let index = 0;
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          try {
            ctx.fillStyle = `#${pixels[index]}`;
            ctx.fillRect(x, y, 1, 1);
          } catch (error) {
            console.error('Error drawing pixel:', error);
          }
          index++;
        }
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext('2d', { alpha: false });
    } catch (error) {
      console.error('Failed to get canvas context:', error);
      return;
    }
    
    if (!context) return;

    try {
      context.clearRect(0, 0, canvas.width, canvas.height);
      draw(context);
    } catch (error) {
      console.error('Error drawing to canvas:', error);
    }
  }, [image])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`img-pixel ${className}`.trim()} 
      width={16} 
      height={16} 
    />
  );
}
