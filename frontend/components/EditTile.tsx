import { Disclosure } from "@headlessui/react";

import TileImage from "./TileImage";
import { openseaLink, formatPrice } from "../utils/misc";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/outline";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

type Props = {
  tile: PixelMapTile;
  index: number;
  handleImageEditor;
  handleLinkChange;
  handlePriceChange;
  handleSave;
};

function EditTile({
  tile,
  index,
  handleImageEditor,
  handleLinkChange,
  handlePriceChange,
  handleSave,
}: Props) {
  return (
    <Disclosure key={tile.id}>
      {({ open }) => (
        <div className="mb-3">
          <Disclosure.Button
            className={`flex items-center py-3 px-4 bg-white w-full text-left font-medium nes-container nes-pointer ${
              open ? "border-b-0" : ""
            }`}
          >
            <div className="bg-gray-200 h-6 w-6 mr-3">
              <TileImage image={tile.image} className="h-full w-full" />
            </div>

            <span>Tile #{tile.id}</span>

            <div className="ml-auto">
              {open && <ChevronUpIcon className="h-4 w-4 text-gray-400" />}

              {!open && <ChevronDownIcon className="h-4 w-4 text-gray-400" />}
            </div>
          </Disclosure.Button>

          <Disclosure.Panel className="bg-white py-6 px-8 nes-container">
            <>
              <div className="flex justify-between space-x-12">
                <div className="bg-gray-200 h-48 w-48">
                  <button
                    onClick={() => handleImageEditor(tile)}
                    className="block group relative nes-pointer"
                  >
                    <div className="z-10 absolute inset-0 bg-gray-900 bg-opacity-70 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <span className="text-white">Change image</span>
                    </div>
                    <TileImage image={tile.image} className="h-48 w-48 z-10" />
                  </button>
                </div>
                <div className="flex flex-col w-full">
                  <div className="mb-3 nes-field">
                    <label
                      htmlFor="link"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Link
                    </label>
                    <input
                      type="text"
                      name="link"
                      id="link"
                      className="mt-1 nes-input"
                      value={tile.url}
                      onChange={(e) => handleLinkChange(e.target.value, index)}
                    />
                  </div>

                  {!tile.wrapped && (
                    <div className="mb-3 nes-field">
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Price
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="text"
                          name="price"
                          id="price"
                          className="nes-input pr-16"
                          value={tile.newPrice}
                          onChange={(e) =>
                            handlePriceChange(e.target.value, index)
                          }
                        />
                        <span className="absolute right-0 top-0 w-16 h-full text-center flex items-center justify-center text-sm">
                          ETH
                        </span>
                      </div>
                    </div>
                  )}

                  {tile.wrapped && (
                    <div className="mb-3">
                      <p className="">Price: {formatPrice(tile)}</p>
                      <span className="text-sm text-gray-600">
                        Set the price on{" "}
                        <a
                          className="text-blue-500 underline"
                          href={openseaLink(tile.id)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          OpenSea
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  className="mt-3 ml-auto nes-btn is-primary transition duration-150 font-medium"
                  onClick={() => handleSave(tile)}
                >
                  Save changes
                </button>
              </div>
            </>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}

export default EditTile;
