import React, { useEffect, useState } from "react";
import { usePopperTooltip } from 'react-popper-tooltip';
import { shortenIfHex, formatPrice, openseaLink, cleanUrl } from "../utils/misc";
import TileCard from './TileCard';
import TileHistoryModal from './TileHistoryModal';

import { XIcon } from '@heroicons/react/outline'
import { ClockIcon } from '@heroicons/react/outline'

export default function TilePopover({tile, referenceElement}) {
  const [controlledVisible, setControlledVisible] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const {
    getTooltipProps,
    setTooltipRef,
    setTriggerRef,
    visible,
  } = usePopperTooltip({
    trigger: 'click',
    closeOnOutsideClick: true,
    visible: controlledVisible,
    onVisibleChange: setControlledVisible,
  });

  useEffect( () => {
    setTriggerRef(referenceElement);
    setControlledVisible(true);
  }, [referenceElement, setTriggerRef]);

  if( !tile ) return (<></>);
  
  return (
    <>
      { visible && (
        <div 
          className="z-50 w-screen md:w-md mt-0"
          ref={setTooltipRef}
          {...getTooltipProps()}
        >
          <div className="overflow-hidden nes-container bg-white p-0 relative">
            <button onClick={() => setControlledVisible(false)} className="absolute right-2 top-2 nes-pointer z-10">
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
            
            <TileCard tile={tile} />
            
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowHistoryModal(true);
                  setControlledVisible(false);
                }}
                className="w-full nes-btn is-primary flex items-center justify-center space-x-2"
              >
                <ClockIcon className="w-5 h-5" />
                <span className="font-bold">View Complete History</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <TileHistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        tileId={tile?.id || null}
        initialTile={tile}
      />
    </>
  );
}
