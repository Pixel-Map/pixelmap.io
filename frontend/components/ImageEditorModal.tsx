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

          <div className="my-12 ">
            <ImageDisplay 
              image={img} 
              cols={col} 
              rows={row} 
              handleTileSelect={handleTileSelect} 
            />
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