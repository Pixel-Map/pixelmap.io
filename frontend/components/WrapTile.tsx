import { Disclosure,} from '@headlessui/react'
import TileImage from './TileImage';
import { openseaLink, formatPrice } from '../utils/misc';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'

function WrapTile({tile, index, handlePriceChange, handleSave, handleWrap, handleRefresh}) {
  return (
    <Disclosure key={tile.id}>
      {({ open }) => (
        <div className="mb-3">
          <Disclosure.Button 
            className={`flex items-center py-3 px-4 bg-white w-full text-left font-medium nes-container nes-pointer ${open ? 'border-b-0' : ''}`}>
            
            <div className="bg-gray-200 h-6 w-6 mr-3">
              <TileImage image={tile.image} className="h-full w-full" />
            </div>

            <span>Tile #{tile.id}</span>

            <div className="ml-auto flex items-center">
              { !tile.wrapped && tile.price == "0" &&
                <div className="nes-badge text-xs mr-4 -mb-0.5">
                  <span className="is-warning font-bold">Prepare wrap</span>
                </div>
              }
              { !tile.wrapped && tile.price != "0" &&
                <div className="nes-badge text-xs mr-4 -mb-0.5">
                  <span className="is-primary font-bold">Ready to wrap</span>
                </div>
              }

              { tile.wrapped &&
                <div className="nes-badge text-xs mr-4 -mb-0.5">
                  <span className="is-success font-bold">Wrapped</span>
                </div>
              }
              { open &&
                <ChevronUpIcon className="h-4 w-4 text-gray-400" />
              }

              { !open &&
                <ChevronDownIcon className="h-4 w-4 text-gray-400"/>
              }
            </div>
          </Disclosure.Button>

          <Disclosure.Panel className="bg-white py-6 px-8 nes-container">
            <>
              <div className="flex justify-between space-x-12">
                <div className="flex flex-col w-full">

                { !tile.wrapped && tile.price == "0" &&
                  <>
                    <ul className="nes-list is-disc space-y-2">
                      <li key="1">The process of wrapping your tile involves buying the tile from yourself.</li>
                      <li key="2">We recommend setting the price to an amount where you are happy to sell the tile.</li>
                      <li key="3">Make sure you set the price to a value significantly above the floorprice on OpenSea so you don&apos;t get sniped.</li>
                      <li key="4">You will need more than the sales price of ETH in your wallet to complete the transitions.</li>
                    </ul>

                    <p className="nes-text is-error font-bold my-3">**During this process, anyone can buy the tile from you at your set price.**</p>
                    

                    <div className="mb-3 nes-field">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                        Price
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type="text"
                          name="price"
                          id="price"
                          className="nes-input pr-16"
                          value={tile.newPrice}
                          onChange={(e) => handlePriceChange(e.target.value, index)}
                        />
                        <span className="absolute right-0 top-0 w-16 h-full text-center flex items-center justify-center text-sm">
                          ETH
                        </span>
                      </div>
                    </div>
                  </>
                }

                { !tile.wrapped && tile.price != "0" &&
                  <>
                    <ul className="nes-list is-disc space-y-2">
                      <li>Time to wrap! Make sure you have enough ETH to buy your tile plus gas.</li>
                    </ul>

                    
                    <div className="mt-3">
                      <p className="">
                        Price: <span className="font-bold">{formatPrice(tile)}</span>
                      </p>
                    </div>

                    { tile.errorMessage &&
                      <p className="my-3 nes-text is-error">Error: {tile.errorMessage}</p>
                    }

                  </>
                }

                { tile.wrapped &&
                  <div className="mb-3">
                    <p className="">
                      Price: {formatPrice(tile)}
                    </p>
                    <span className="text-sm text-gray-600">Set the price on <a className="text-blue-500 underline" href={openseaLink(tile.id)} target="_blank" rel="noreferrer">OpenSea</a></span>
                  </div>
                }

                </div>
              </div>
              { !tile.wrapped &&
                <div className="flex justify-end mt-2">
                  <button
                      className="mt-3 mr-4 ml-auto nes-btn transition duration-150"
                      onClick={() => handleRefresh(tile, index)}
                    >
                      Refresh
                  </button>

                  { tile.price == "0" &&
                    <button
                        className="mt-3 nes-btn is-primary transition duration-150"
                        onClick={() => handleSave(tile, index)}
                      >
                        Set Price
                    </button>
                  }
                  { tile.price != "0" &&
                    <button
                        className="mt-3 nes-btn is-primary transition duration-150"
                        onClick={() => handleWrap(tile, index)}
                      >
                        Wrap tile
                    </button>
                  }
                  
                </div>
              }
            </>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  )
}

export default WrapTile;