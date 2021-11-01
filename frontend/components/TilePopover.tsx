import React, { useEffect, useState } from "react";
import { usePopperTooltip } from 'react-popper-tooltip';
import { shortenIfHex, formatPrice, openseaLink, cleanUrl } from "../utils/misc";
import TileCard from './TileCard';

import { XIcon } from '@heroicons/react/outline'

export default function TilePopover({tile, referenceElement}) {
  const [controlledVisible, setControlledVisible] = useState(false);

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
          </div>
        </div>
      )}
    </>
  );
}
