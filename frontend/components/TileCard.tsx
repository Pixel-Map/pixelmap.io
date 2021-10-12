import React, { useState } from "react";
import Link from 'next/link'
import { TileAsset } from '../types/TileAsset';

import { shortenHex, formatPrice, openseaLink, cleanUrl } from "../utils/misc";
import TileImage from './TileImage';

interface TileCardProps {
  tile: TileAsset,
  large?: boolean
}

export default function TileCard({tile, large}: TileCardProps) {

  return (
    <>
      <div className={`relative flex p-4 space-x-4 ${large ? "md:p-8 md:space-x-8" : ""}`}>
        <div>
          <div className="bg-gray-100">
            <TileImage className={`${large ? "h-20 w-20 md:h-40 md:w-40" : "h-16 w-16 md:h-20 md:w-20"}`} image={tile.image} />
          </div>
        </div>
        
        <div className={`flex-grow-1 space-y-1 ${large ? "md:space-y-3" : ""}`}>
          <h3 className={`text-gray-900 font-bold ${large ? "md:text-3xl" : "text-xl"} mb-1 relative`}>
            <span>PixelMap #{tile.id}</span>
          </h3>

          <p className={"text-sm text-gray-700"}>
            Owner: <Link href={`/owner/${tile.owner}`}>{shortenHex(tile.owner, 6)}</Link>
          </p>
          
          <div className="truncate">
            <a href={cleanUrl(tile.url)} className={`text-blue-600 break-all truncate text-sm whitespace-normal ${large ? 'md:text-base': ''}`} target="_blank" rel="noreferrer">{tile.url}</a>
          </div>
      
        </div>
      </div>

      <div className={`px-4 py-3 bg-gray-50 ${large ? "md:px-8 md:py-4" : ""}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm tracking-wide font-medium text-gray-500">Price</h3>
            <p className="font-bold text-lg ml-1">{formatPrice(tile)}</p>
          </div>
          <div>
            { tile.wrapped &&
              <a className="nes-btn is-primary font-bold" target="_blank" href={openseaLink(tile.id)} rel="noreferrer">
                {tile.openseaPrice != "0" ? 'Buy on OpenSea' : 'View on OpenSea'}
              </a>
            }

            { !tile.wrapped && 
              <button className="flex items-center justify-center">
                <div>
                  <p className="mr-2 text-green-600">Buy on Marketplace</p>
                  <p className="text-sm text-gray-500">(Coming soon)</p>
                </div>
                
              </button>
            }
          </div>
        </div>
      </div>
    </>
  );
}