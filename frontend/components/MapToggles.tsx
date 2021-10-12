import React, { useContext } from "react";
import { useWeb3React } from "@web3-react/core";
import { Switch } from '@headlessui/react';

export default function MapToggles({showOwned, setShowOwned, showForSale, setShowForSale}) {
  const { account } = useWeb3React();

  return (
    <div className="flex space-x-4">
      
      <label>
        <input 
          type="checkbox" 
          className="nes-checkbox is-dark" 
          checked={showForSale} 
          onChange={(e) => setShowForSale(e.currentTarget.checked)}
        />
        <span className="font-bold text-sm">For Sale</span>
      </label>

      { (account && account != "") && 
        <label>
          <input 
            type="checkbox" 
            className="nes-checkbox is-dark" 
            checked={showOwned} 
            onChange={(e) => setShowOwned(e.currentTarget.checked)}
          />
          <span className="font-bold text-sm">Owned</span>
        </label>
        
      }
    </div>
     
  );
}