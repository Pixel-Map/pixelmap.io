import React, { useState, useEffect } from "react";
import Resizer from "../utils/ImageResizer";
import { generateWebSafeImage, rgbToHexTriplet, dimensionToPixels, compressTileCode } from "../utils/ImageUtils";
import { getBytesFromCanvas, lowerBytesColorCount, lowerBytesColorDepth } from "../utils/ImageUtils";

type Props = {
  image: string;
  cols: number;
  rows: number;
  maxColors: number;
  colorDepth: number;
  pixelSize: number;
  handleTileSelect;
}

export default function ImageDisplay({image, cols, rows, maxColors, colorDepth, pixelSize, handleTileSelect}: Props) {
  const defaultPixelMapImageSize = 16;
  const [resizedImage, setResizedImage] = useState<any>();
  const [imageColors, setImageColors] = useState<any>([]);
  const [tileCode, setTileCode] = useState<any>([]);
  const [dataSize, setDataSize] = useState<any>([0,0]);

  function processColours(canvas: any, width: number, height: number): Array<string> {
    let rgbBytes = getBytesFromCanvas(canvas, width, height);
    
    //reduce total colors
    rgbBytes = lowerBytesColorCount(rgbBytes, cols, rows, maxColors);
    
    //lower color bit depth
    rgbBytes = lowerBytesColorDepth(rgbBytes, colorDepth);
    
    //convert computed byte array to color array of hex triplets
    let colorArray = [];
    for( let i = 0; i < width * height * 3; i+=3 ) {
        colorArray.push(rgbToHexTriplet(rgbBytes[i+0], rgbBytes[i+1], rgbBytes[i+2]));
    }
    return colorArray;
  }
  
  function processTileCode(colorArray: Array<string>, width: number, height: number): Array<string[]> {
    let tileArray = new Array(rows * cols).fill([]);

    //split data into array of hex triplets broken down for each grid
    let pixelRowIndex = 0;
    let rowIndex = 0;
    for( let pixelSliceIndex = 0; pixelSliceIndex < colorArray.length; pixelSliceIndex += width ) {
      let pixelSlice = colorArray.slice(pixelSliceIndex, pixelSliceIndex + width);

      for( let i = 0; i < cols; i++ ) {
        let index = i + (rowIndex * cols);
        let arr = tileArray[index];
        let slice = pixelSlice.slice(i * defaultPixelMapImageSize, (i + 1) * defaultPixelMapImageSize);

        tileArray[index] = arr.concat(slice);
      }

      pixelRowIndex++;

      if( (pixelRowIndex) % (height / rows) === 0 ) {
        rowIndex++;
      }
    }
    return tileArray;
  }
  
  function processDataSize(tileCodes: Array<string[]>): number[] {
    let dataSizeBytes = 0;
    let dataSizeStorage = 0;
	for(let i=0; i<tileCodes.length; i++) {
		let tileCodeString = tileCodes[i].join('');
		tileCodeString = compressTileCode(tileCodeString);
		dataSizeBytes += tileCodeString.length;
		dataSizeStorage += Math.ceil(tileCodeString.length / 32);
	}
    return [dataSizeBytes, dataSizeStorage];
  }

  useEffect( () => {
    if( image === "" ) return;

    //canvas size can differ from normal target size due to pixelSize prop (targeting an 8x8 gird instead of 16x16 for example)
    const height = dimensionToPixels(rows);
    const width = dimensionToPixels(cols);
    const sizeRatio = Math.floor(defaultPixelMapImageSize / pixelSize);
    const canvasHeight = height / sizeRatio;
    const canvasWidth = width / sizeRatio;

    try {
      Resizer.imageFileResizer(
        image,
        canvasWidth,
        canvasHeight,
        "PNG",
        100,
        0,
        (rawCanvas: any) => {
          let colors = processColours(rawCanvas, width, height);
          let tileCode = processTileCode(colors, width, height);
		  let dataSize = processDataSize(tileCode);
          setImageColors(colors);
          setTileCode(tileCode);
          setDataSize(dataSize);
        },
        "base64",
        canvasWidth,
        canvasHeight,
        true
      );
    } catch (err) {
      //console.log(err);
    }
  }, [image, cols, rows, maxColors, colorDepth, pixelSize] );

  useEffect( () => { 
    const height = dimensionToPixels(rows);
    const width = dimensionToPixels(cols);
    let websafeImage = generateWebSafeImage(imageColors, width, height);
    
    setResizedImage(websafeImage);
  }, [imageColors]);
  
  const gridSelect = () => {
    let gridBoxes = [];

    for( let grid = 0; grid < tileCode.length; grid++) {
      gridBoxes.push(
        <button
          key={grid}
          onClick={() => { handleTileSelect(tileCode[grid].join(''))}}
          className="group bg-gray-900 bg-opacity-70 opacity-0 hover:opacity-100 nes-pointer transition duration-150"
          style={{
            width: `${100 / cols}%`,
            height: `${100 / rows}%`
          }}
        >
          <span className="text-white">Select</span>
        </button>
      )
    }

    return gridBoxes;
  }

  return (
    <div>
      <div className="grid grid-cols-3 justify-center items-center">
        <div className="relative col-span-2">
          <div 
            className="absolute inset-0 z-20 grid-background"
            style={{
              backgroundSize: `${100 / cols}% ${100 / rows}%`,
            }}
          >
          </div>

          <div 
            className="absolute inset-0 z-30"
          >
            { gridSelect() }
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="block relative w-full h-auto z-10 pixel-image" src={resizedImage} alt="Pixelmap" />
        </div>
        <div>
          <p className="text-sm text-gray-300 mb-4 font-bold text-center">Actual size</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="block w-auto h-auto mx-auto pixel-image" src={resizedImage} alt="Pixelmap" />
        </div>
      </div>
	  <div>{'Data Size: ' + dataSize[0] + ' bytes   |   ' + dataSize[1] + ' EVM Storage Slots'}</div>
    </div>
  );
}