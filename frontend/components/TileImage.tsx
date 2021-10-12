import React, { useRef, useEffect } from "react";
import { decompressTileCode } from "../utils/ImageUtils";

export default function TileImage({image, className}) {

  const canvasRef = useRef(null)
  
  useEffect(() => {
    const draw = (ctx: any) => {
      let hex = decompressTileCode(image);

      if( hex.length != 768 ) {
        return;
      }

      hex = hex.match(/.{1,3}/g);

      let index = 0;

      for( let y = 0; y < 16; y++ ) {
        for( let x = 0; x < 16; x++ ) {
          ctx.fillStyle = `#${hex[index]}`;
          ctx.fillRect(x, y, 1, 1);
          index++;
        }
      }
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { alpha: false })
    
    context.clearRect(0,0, canvas.width, canvas.height);
    //Our draw come here
    draw(context)
  }, [image])
  
  return (
    <canvas ref={canvasRef} className={`img-pixel ${className}`} width={16} height={16} />
  );
}