import React, { ChangeEvent } from 'react';

export default function ImageUpload(props: any) {
    const handleImg = (e: ChangeEvent<HTMLInputElement>) => {
      if(e.target && e.target.files && e.target.files[0]) {
        props.changeImage(
          e.target.files[0]
        );    
      }   
    }

    return (
      <form className="flex flex-0 flex-grow" encType="multipart/form-data">
        <div className="space-y-1 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex text-sm text-gray-600 justify-center mb-3">
            <label
              htmlFor="file-upload"
              className="nes-btn is-warning"
            >
              <span>Select image</span>
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file"
                accept=".png"
                onChange={handleImg}
                className="" />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-3">PNG only. For best results, ensure your image is crisp and pixel edges are sharp.</p>
        </div>
      </form>
    );
}