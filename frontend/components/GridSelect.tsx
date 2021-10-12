import React, { useState } from 'react';

const maxColumns = 6;
const maxRows = 6;

export default function GridSelect(props: any) {
  const [{highlightWidth, highlightHeight}, setHighlight] = useState({highlightWidth: 0, highlightHeight: 0});

  const hoverClass = (col: number, row: number) => {
    setHighlight({
      highlightWidth: row,
      highlightHeight: col
    });
  }

  const activeClass = (col: number, row: number) => {
    setHighlight({
      highlightWidth: 0,
      highlightHeight: 0
    });

    //my head hurts as to why its reversed, but it works.
    props.changeGrid(row, col);
  }

  let grid: any = [];

  for( let i = 1; i <= maxColumns; i++ ) {
    let rows: any = [];

    for( let j = 1; j <= maxRows; j++ ) {
      rows.push(
        <div
          className={`h-6 w-6 mr-0.5 mb-0.5 bg-indigo-700`}
          key={i*j}
          onMouseEnter={() => hoverClass(i, j)}
          onClick={() => activeClass(i, j)}>
          
        </div>
      );
    }

    grid.push(rows);
  }

  /* 
    Highlight and Active container sizes are calculated using TailwindCSS rem values for widths and margins.
    I use h-6 and w-6, which equals 1.5rem, and m-0.5 equals 0.125rem, totalling 1.625rem;
  */

  return (
    <div className="flex flex-shrink-0 space-x-6">
      <div className="">
        <p className="font-medium text-sm mb-2 text-gray-300">Tile size</p>
        <p className="text-white font-bold">{props.col} x {props.row}</p>
        <p className="text-white font-bold">{props.col * 16}px x {props.row * 16}px</p>
      </div>
      <div 
        className="w-42 h-42 relative"
        onMouseLeave={() => hoverClass(0, 0)}
      >
        <div 
          className="absolute bg-indigo-300 z-20 rounded-sm -ml-0.5 -mt-0.5"
          style={{
            width: `${1.625 * highlightWidth + 0.125}rem`,
            height: `${1.625 * highlightHeight + 0.125}rem`
          }}>
        </div>
        <div 
          className="absolute bg-white z-10 rounded-sm -ml-0.5 -mt-0.5"
          style={{
            width: `${1.625 * props.col + 0.125}rem`,
            height: `${1.625 * props.row + 0.125}rem`
          }}>
        </div>

        <div className="flex flex-wrap relative z-30">
          {grid}
        </div>
        
      </div>
      
    </div>
  );
}