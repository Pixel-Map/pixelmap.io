import React, { useEffect, useState } from "react";

export default function Loader() {
  const [position, setPosition] = useState('is-transparent');

  useEffect( () => {
    const interval = setInterval(() => {
      if(position === 'is-transparent') {
        setPosition('is-half');
      } else if(position === 'is-half') {
        setPosition('is-full');
      } else {
        setPosition('is-transparent');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [, position]);

  return (
    <div className="flex items-center justify-center my-4 lg:my-12">
      <i className={`nes-icon star is-large ${position}`} />
    </div>
     
  );
}
