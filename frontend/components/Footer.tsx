
export default function Footer() {
  return (
    <footer className="py-4 px-4 sm:px-6">
      <div className="text-center md:text-left md:flex md:justify-between">
        <div className="space-x-6 ">
          <a className="text-white text-opacity-70 hover:text-opacity-100 hover:text-white transition duration-150 text-sm" href={`https://etherscan.io/address/${process.env.NEXT_PUBLIC_PIXELMAP_CONTRACT}`} target="_blank" rel="noreferrer">PixelMap Contract</a>
          <a className="text-white text-opacity-70 hover:text-opacity-100 hover:text-white transition duration-150 text-sm" href={`https://etherscan.io/address/${process.env.NEXT_PUBLIC_PIXELMAP_WRAPPER_CONTRACT}`} target="_blank" rel="noreferrer">Wrapped PixelMap Contract</a>
        </div>
        <a className="block mt-4 md:mt-0 text-white text-opacity-70 hover:text-opacity-100 hover:text-white transition duration-150 text-sm" href={`https://twitter.com/KenErwin88`} target="_blank" rel="noreferrer">Created in 2016 by kenerwin88</a>
      </div>
    </footer>
  )
}