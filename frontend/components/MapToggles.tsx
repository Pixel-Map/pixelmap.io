import React, { useContext } from "react";
import { useWeb3React } from "@web3-react/core";
import { Switch } from "@headlessui/react";

export default function MapToggles({
  showOwned,
  setShowOwned,
  showForSale,
  setShowForSale,
}) {
  const { account } = useWeb3React();

  return (
    <div className="flex space-x-4">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-900 bg-opacity-70 border border-white">
        <label
          className="my-0">
          <input
            type="checkbox"
            className="nes-checkbox is-dark"
            checked={showForSale}
            onChange={(e) => setShowForSale(e.currentTarget.checked)}
          />
          <span className="font-bold text-sm">For Sale</span>
        </label>
      </span>
      {account && account != "" && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-900 bg-opacity-70 border border-white">
          <label
            className="my-0">
            <input
              type="checkbox"
              className="nes-checkbox is-dark"
              checked={showOwned}
              onChange={(e) => setShowOwned(e.currentTarget.checked)}
            />
            <span className="font-bold text-sm">Owned</span>
          </label>
        </span>
      )}
    </div>
  );
}
