import Image from 'next/image'
import Link from 'next/link'

import { useWeb3React } from "@web3-react/core";
import useEagerConnect from "../hooks/useEagerConnect";

import Account from './Account';
import SearchBar from './SearchBar';
import logo from '../public/assets/images/logo.png';

const navigation = [
  { name: 'Wrapper', link: '/wrap' },
  { name: 'Discord', href: 'https://discord.gg/pixelmap', target: "_blank" },
]

export default function Header() {
  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  return (
    <header className="relative">
      <nav className="relative border-b-4 md:border-none border-black" aria-label="Global">
        <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
          <div className="flex items-center flex-1">
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link href="/">
                <a className="w-8 h-8 md:h-10 md:w-10">
                  <span className="sr-only">PixelMap</span>
                  <Image
                    className="w-full h-auto"
                    src={logo}
                    alt="PixelMap"
                  />
                </a>
              </Link>
            </div>
            
            <div className="hidden md:flex md:mx-8 md:items-center md:flex-grow">
              <div className="flex space-x-6 items-center">
              <SearchBar />

              {navigation.map((item) => {
                if( item.link ) {
                  return (
                    <Link key={item.name} href={item.link}>
                      <a
                        className="text-sm font-semibold text-gray-300 hover:text-white transition duration-150"
                      >
                        {item.name}
                      </a>
                    </Link>
                  )
                } else {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-sm font-semibold text-gray-300 hover:text-white transition duration-150"
                      target={item.target}
                    >
                      {item.name}
                    </a>
                  )}
              })}
              </div>
              { account &&
                <Link href="/edit">
                  <a className="ml-auto text-sm font-semibold text-gray-300 hover:text-white transition duration-150">Edit tiles</a>
                </Link>
              }

            </div>
          </div>
          <div className="flex items-center">
            <Account triedToEagerConnect={triedToEagerConnect} />
          </div>
        </div>

        <div className="px-3 md:px-6 py-3 flex flex-wrap justify-start space-x-6 md:hidden">
          {/* <SearchBar /> */}

          {navigation.map((item) => {
            if( item.link ) {
              return (
                <Link key={item.name} href={item.link}>
                  <a
                    className="text-sm font-semibold text-gray-300 hover:text-white transition duration-150"
                  >
                    {item.name}
                  </a>
                </Link>
              )
            } else {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-semibold text-gray-300 hover:text-white transition duration-150"
                  target={item.target}
                >
                  {item.name}
                </a>
              )}
          })}

          { account &&
            <Link href="/edit">
              <a className="self-end ml-auto text-sm font-semibold text-gray-300 hover:text-white transition duration-150">Edit tiles</a>
            </Link>
          }

        </div>

      </nav>
      
    </header>
  )
}
