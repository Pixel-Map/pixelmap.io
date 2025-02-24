import React, { useState, FormEvent, ChangeEvent } from "react";
import { SearchIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/router'

export default function SearchBar() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("");

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setKeyword(value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (keyword.length < 5 && !Number.isNaN(Number.parseInt(keyword, 10))) {
      // Remove leading zeros and parse as integer
      const tileNumber = Number.parseInt(keyword.replace(/^0+/, '') || '0', 10);
      router.push({
        pathname: '/tile/[id]',
        query: { id: tileNumber },
      });
    } else if (keyword.length === 40 || keyword.length === 42) {
      // Handle hex addresses
      const address = keyword.startsWith('0x') ? keyword.slice(2) : keyword;
      router.push({
        pathname: '/owner/[address]',
        query: { address: address },
      });
    }
  }

  return (
    <div className="flex">
      <div className="max-w-sm w-full">
        <form role="search" className="nes-field relative text-white" onSubmit={handleSubmit}>
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-2 flex items-center">
            <SearchIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <input
            id="desktop-search"
            className="nes-input font-semibold text-sm is-dark py-1 pl-6 bg-clip-border my-0 placeholder-gray-300 focus:outline-none focus:bg-blue-500 focus:placeholder-gray-200 transition duration-150"
            placeholder="Search tile / address"
            type="search"
            name="search"
            value={keyword}
            onChange={handleOnChange}
          />
        </form>
      </div>
    </div>
  );
}
