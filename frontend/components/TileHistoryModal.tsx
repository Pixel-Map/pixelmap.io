import React, { useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XIcon } from '@heroicons/react/outline';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import { fetchSingleTile } from '../utils/api';
import TileHistory from './TileHistory';
import TileCard from './TileCard';
import Loader from './Loader';

interface TileHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tileId: number | null;
  initialTile?: PixelMapTile;
}

export default function TileHistoryModal({ isOpen, onClose, tileId, initialTile }: TileHistoryModalProps) {
  const [tile, setTile] = useState<PixelMapTile | undefined>(initialTile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tileId !== null && isOpen) {
      setLoading(true);
      fetchSingleTile(tileId.toString()).then((fetchedTile) => {
        if (fetchedTile) {
          setTile(fetchedTile);
        }
        setLoading(false);
      });
    }
  }, [tileId, isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900">
                    {tile ? `Tile #${tile.id} - Complete History` : 'Loading Tile...'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader />
                    </div>
                  ) : tile ? (
                    <div className="p-6 space-y-6">
                      <div className="nes-container bg-white p-0">
                        <TileCard tile={tile} large />
                      </div>
                      
                      <TileHistory 
                        tile={tile} 
                        historicalImages={tile.historical_images}
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No tile data available
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
                  <a
                    href={`/tile/${tileId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Open in new tab →
                  </a>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}