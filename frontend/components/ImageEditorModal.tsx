import { useState } from 'react'

import { Dialog, Switch } from '@headlessui/react'

import ImageUpload from "./ImageUpload";
import GridSelect from "./GridSelect";
import ImageDisplay from "./ImageDisplay";

export default function ImageEditorModal({isOpen, setIsOpen, tile, changeImage}) {
  const [img, setImg] = useState();

  const [{col, row}, setGrid] = useState({
    col: 1,
    row: 1
  });
  
  const [{maxColors, colorDepth, pixelSize}, setCompression] = useState({
    maxColors: 64,
    colorDepth: 12,
    pixelSize: 16
  });

  const handleImageChange = (src: any) => {
    setImg(src);
  }

  const handleGridSelect = (col: number, row: number) => {
    setGrid({
      col: col,
      row: row
    });
  }

  const handleTileSelect = (code: string) => {
    changeImage(code);
    closeModal();
  }

  function closeModal() {
    setIsOpen(false)
  }

  function openModal() {
    setIsOpen(true)
  }

  function updateMaxColors(newMaxColors) {
    if(!newMaxColors || isNaN(newMaxColors)) newMaxColors = null;
    else if(newMaxColors > 256) newMaxColors = 256;
    else if(newMaxColors < 1) newMaxColors = 1;
    setCompression({
      maxColors: newMaxColors,
      colorDepth: colorDepth,
      pixelSize: pixelSize
    });
  }

  function updateColorDepth(newColorDepth) {
    setCompression({
      maxColors: maxColors,
      colorDepth: newColorDepth,
      pixelSize: pixelSize
    });
  }

  function updatePixelSize(newPixelSize) {
    setCompression({
      maxColors: maxColors,
      colorDepth: colorDepth,
      pixelSize: newPixelSize
    });
  }

  return (
    <Dialog
      as="div"
      className="fixed inset-0 z-10 overflow-y-auto"
      open={isOpen}
      onClose={closeModal}
    >
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-60" />

      <div className="min-h-screen px-4 text-center">

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden lg:inline-block lg:h-screen lg:align-middle"
          aria-hidden="true"
        >
          &#8203;
        </span>
        
        <div className="nes-container is-dark inline-block w-full max-w-4xl p-6 sm:p-8 my-8 overflow-hidden text-left align-middle transition-all transform">
          <Dialog.Title
            as="h3"
            className="title font-bold text-2xl mb-4"
          >
            Tile #{tile.id || ""} image
          </Dialog.Title>
          <div className="mt-2">
            <div className="lg:flex lg:space-between space-y-4 lg:space-y-0 lg:space-x-6 nes-container is-rounded is-dark">
              <ImageUpload changeImage={handleImageChange} />
              <GridSelect changeGrid={handleGridSelect} col={col} row={row} />
            </div>
          </div>

          <div className="my-5">
            <ImageDisplay 
              image={img} 
              cols={col} 
              rows={row} 
              maxColors={(!maxColors) ? 256 : maxColors} 
              colorDepth={colorDepth} 
              pixelSize={pixelSize} 
              handleTileSelect={handleTileSelect} 
            />
          </div>

          <div className="mt-2">
            <button type="button" className={"mx-2 comp-inp" + (pixelSize==4 ? " comp-inp-sel" : "")} onClick={() => { updatePixelSize(4); }}>4x4</button>
            <button type="button" className={"mx-2 comp-inp" + (pixelSize==8 ? " comp-inp-sel" : "")} onClick={() => { updatePixelSize(8); }}>8x8</button>
            <button type="button" className={"mx-2 comp-inp" + (pixelSize==16 ? " comp-inp-sel" : "")} onClick={() => { updatePixelSize(16); }}>16x16</button>
            <div className="mx-4 lg:inline-block"></div>
            
            <button type="button" className={"mx-2 comp-inp" + (colorDepth==4 ? " comp-inp-sel" : "")} onClick={() => { updateColorDepth(4); }}>4bit</button>
            <button type="button" className={"mx-2 comp-inp" + (colorDepth==8 ? " comp-inp-sel" : "")} onClick={() => { updateColorDepth(8); }}>8bit</button>
            <button type="button" className={"mx-2 comp-inp" + (colorDepth==12 ? " comp-inp-sel" : "")} onClick={() => { updateColorDepth(12); }}>12bit</button>
            <div className="mx-4 lg:inline-block"></div>
            
            <div className="comp-inp">
              <input type="number" min="1" max="256" className="comp-inp-num" value={maxColors} onChange={() => { updateMaxColors(event.target.value); }}></input>
              <label className="comp-inp-num-label">Colors</label>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="nes-btn is-error"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </Dialog>


  )
}