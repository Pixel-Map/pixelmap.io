import React, { useState } from "react";
import { SearchIcon } from '@heroicons/react/solid';
import { useRouter } from 'next/router'

export default function SearchBar() {
  const router = useRouter()
  let [keyword, setKeyword] = useState("");

  const handleOnChange = (event: any) => {
    const { value } = event.target;
    setKeyword(value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    if( keyword.length  < 5 && !isNaN(parseInt(keyword))) {
      //go to tile number page
      router.push({
        pathname: '/tile/[id]',
        query: { id: parseInt(keyword) },
      });
    } else if( keyword.length === 40 || keyword.length === 42 ) {
      //search owner listings
      router.push({
        pathname: '/owner/[address]',
        query: { address: parseInt(keyword) },
      });
    } else {
      //dont search
    }
  }

  return (
    <div className="flex">
      <div className="max-w-sm w-full">
        <form className="nes-field relative text-white" onSubmit={handleSubmit}>
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-2 flex items-center">
            <SearchIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <input
            id="desktop-search"
            className="nes-input font-semibold text-sm is-dark py-1 pl-6 bg-clip-border my-0 placeholder-gray-300 focus:outline-none focus:bg-blue-500 focus:placeholder-gray-200 transition duration-150"
            placeholder="Search tile / address"
            type="text"
            name="search"
            value={keyword}
            onChange={handleOnChange}
          />
        </form>
      </div>
    </div>
     
  );
}
