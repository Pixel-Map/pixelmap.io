import React from "react";

import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";

function About() {
  return (
    <>
      <Head>
        <title>History | PixelMap.io</title>
      </Head>
      <Layout>
        <main className="w-full max-w-5xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
          <h1 className="text-3xl font-bold mb-4 text-white">
            The History of PixelMap
          </h1>

          <div className="nes-container is-dark is-rounded">
            <div className="text-white font-medium prose max-w-none  ">
              <h3>
                <span className="text-blue-300">What is PixelMap?</span>
              </h3>

              <p>
                PixelMap (2016) is often considered an NFT &quot;relic&quot; or
                &quot;antique&quot;, due to being one of the oldest NFTs in
                existence. The original &quot;billboard-style&quot; NFT,
                PixelMap is also known for being one of the first to store image
                data directly on-chain, as well as the second oldest NFT ever
                created. It provides the ability to create, display, and update
                artwork on a &quot;pixel map&quot; with all historical data
                immortalized on the Blockchain...
              </p>

              <p>
                Well, and an entire game is being built around it as well, so
                it&apos;s a bit more than that now :). To give you an idea of
                what we&apos;re going for, picture the gameplay of Animal
                Crossing (except with a bit more of an MMO feel), mixed with the
                old school look of classic 16bit gaming (think Zelda: A Link to
                the Past). The value of PixelMap though is definitely 100%
                it&apos;s history.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  className="h-auto"
                  src="/assets/images/game.png"
                  alt="PixelMap Adventure"
                />
              </div>
              <h3>
                <span className="text-blue-300">
                  How do I buy a PixelMap tile?
                </span>
              </h3>
              <p>
                By far the easiest (and cheapest) way is to buy the cheapest
                tile available on{" "}
                <Link href="https://opensea.io/collection/pixelmap">
                  <a className="nes-text is-success">OpenSea</a>
                </Link>
                . You can always update the image on a tile that you own (but
                ALL previous versions are also permanently stored on-chain!)
                We&apos;ve found that tiles with images, on edges, corners,
                special numbers, interesting history, or groups of tiles all
                tend to sell for a bit more.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img src="/assets/images/opensea.png" alt="OpenSea" />
              </div>
              <h3>
                <span className="text-blue-300">What inspired PixelMap?</span>
              </h3>
              <p>
                Heavily inspired by Alex Tew&apos;s{" "}
                <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage">
                  <a className="nes-text is-success">
                    The Million Dollar Homepage
                  </a>
                </Link>
                ,{" "}
                <Link href="https://twitter.com/KenErwin88">
                  <a className="nes-text is-success">Ken Erwin</a>
                </Link>{" "}
                created the first fully decentralized equivalent, going live
                with PixelMap on{" "}
                <Link href="https://etherscan.io/tx/0x79e41799591e99ffb0aad02d270ac92328e441d0d6a0e49fd6cb9948efb40656">
                  <a className="nes-text is-success">November 17, 2016</a>
                </Link>
                , years before the Non-Fungible Token (NFT) Standard (EIP-721)
                would even be written.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  className="h-auto"
                  src="/assets/images/mdh.png"
                  alt="Million Dollar Homepage"
                />
              </div>
              <p>
                The{" "}
                <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage">
                  <a className="nes-text is-success">
                    The Million Dollar Homepage
                  </a>
                </Link>{" "}
                consists of a 1000x1000 pixel grid, with a total of 1,000,000
                pixels, sold for $1 each. Because the pixels themselves were too
                small to be seen individually, Alex sold them in 10x10 squares
                for $100 each. Advertisers would then provide him with an image
                to display on the square, as well as a URL. Notably, the tiles
                themselves could only be updated by Alex, as the page itself was
                static (invented roughly four years before Bitcoin had even
                launched).
              </p>

              <h3>
                <span className="text-blue-300">
                  PixelMap on &quot;This American Life&quot;?
                </span>
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img src="/assets/images/thisamericanlife.png" alt="PixelMap" />
              </div>
              <p>
                During the rediscovery of PixelMap in August 2021, Ken reached
                out to{" "}
                <Link href="https://en.wikipedia.org/wiki/Ira_Glass">
                  <a className="nes-text is-success">Ira Glass</a>
                </Link>{" "}
                of{" "}
                <Link href="https://www.thisamericanlife.org/769/the-reluctant-explorer">
                  <a className="nes-text is-success">This American Life</a>
                </Link>{" "}
                to blow the lid on a big conspiracy surrounding PixelMap.
                It&apos;s definitely worth a listen, and if you&apos;re here
                from the TAL episode, welcome to PixelMap! Getting to talk to
                Ira was definitely one of the coolest things I&apos;ve ever
                gotten to do (Ken).
              </p>
              <h3>
                <span className="text-blue-300">
                  What makes PixelMap special?
                </span>
              </h3>
              <p>
                In many ways, PixelMap.io is similar to the{" "}
                <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage">
                  <a className="nes-text is-success">
                    The Million Dollar Homepage
                  </a>
                </Link>
                . There are a total of 1,016,064 pixels for sale (on a 1,296 x
                784 grid). The grid is broken up into 3,969 (visible, plus one
                secret) 16x16 tiles, each at an initial price of 2 Ethereum ($20
                at launch).
              </p>
              <p>
                However, unlike{" "}
                <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage">
                  <a className="nes-text is-success">
                    The Million Dollar Homepage
                  </a>
                </Link>
                , every tile is controlled by a contract on the Ethereum
                Blockchain, lending the following benefits.
              </p>
              <div>
                <ul>
                  <li>
                    Each tile is truly owned by the entity that purchases it.
                    Because the data is stored on the Blockchain, nothing short
                    of every single Ethereum node shutting down can eliminate
                    the data.
                  </li>
                  <li>
                    The contract is designed so that if a tile owner wants to
                    update the image, change the URL the tile points to, or sell
                    the tile for any amount they&apos;d like, they can, without
                    any central authority facilitating or controlling any part
                    of the process.
                  </li>
                  <li>
                    If PixelMap.io itself were ever to go down, the data, owner,
                    and URLs for every single pixel remain on the Blockchain,
                    and any site could easily replicate and display the overall
                    image. Essentially, the backend data of PixelMap is
                    invincible as long as the Blockchain exists.
                  </li>
                  <li>
                    The project has been{" "}
                    <Link href="https://github.com/Pixel-Map/pixelmap.io/blob/main/LICENSE">
                      <a className="nes-text is-success">open sourced</a>
                    </Link>
                    , which means anyone can view the code, audit the Solidity
                    contract, or even set up more frontends if they&apos;d like.
                    For instance, if someone wanted to set up an easier-to-use
                    tile editor for PixelMap.io, they could, as all of the data
                    is stored safely on the Ethereum blockchain.
                  </li>
                </ul>
              </div>
              <h3>
                <span className="text-blue-300">
                  Did PixelMap influence Decentraland?
                </span>
              </h3>
              <p>
                Yes, and it&apos;s a very interesting story! In 2015,{" "}
                <Link href="https://etheria.world/">
                  <a className="nes-text is-success">Etheria</a>
                </Link>
                , the first NFT was created by Cyrus Adkisson.{" "}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <img
                    className="h-auto"
                    src="/assets/images/etheria.png"
                    alt="Etheria"
                  />
                </div>
                Cyrus would then go on to publish some of the earliest solidity
                (the programming language for Ethereum) tutorials to{" "}
                <Link href="https://github.com/cyrusadkisson/solidity-baby-steps/tree/c04a6928b631200847556522874f73e62c9a3b98/contracts">
                  <a className="nes-text is-success">Github</a>
                </Link>
                .
              </p>
              <p>
                Flashing a bit forward to 2016, I (Ken) learned how to write
                solidity by seeing how the code that Cyrus had published worked.
                In November, I created what would become known as PixelMap. Like
                Cyrus, I also chose to &quot;Open Source&quot; all of my code
                directly on Github for others to learn from.{" "}
                <Link href="https://github.com/Pixel-Map/pixelmap.io/blob/main/contracts/PixelMap.sol">
                  <a className="nes-text is-success">
                    (Original PixelMap Contract)
                  </a>
                </Link>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <img
                    className="h-auto"
                    src="/assets/images/pixelmap-2016-contract.png"
                    alt="Contract"
                  />
                </div>
              </p>
              <p>
                A developer named{" "}
                <Link href="https://twitter.com/bnolan">
                  <a className="nes-text is-success">Ben Nolan</a>
                </Link>{" "}
                eventually stumbled upon PixelMap through{" "}
                <Link href="https://gitter.im/Pixel-Map/Lobby">
                  <a className="nes-text is-success">
                    Gitter (lots of funny conversations here btw!)
                  </a>
                </Link>
                .
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  className="h-auto"
                  src="/assets/images/gitter.png"
                  alt="Contract"
                />
              </div>
              <p>
                Ben wasn&apos;t kidding. He quickly created what is arguably one
                of the earliest metaverses, a world known as{" "}
                <Link href="https://medium.com/@bnolan/fontus-501efd5a9b">
                  <a className="nes-text is-success">Fontus</a>
                </Link>
              </p>
              <img
                className="h-auto"
                src="/assets/images/fontusgame.png"
                alt="Contract"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  className="h-auto"
                  src="/assets/images/fontus.png"
                  alt="Contract"
                />
              </div>
              <p>
                Shortly after (late 2017), Ben (and the assets of Fontus) were{" "}
                <Link href="https://medium.com/@bnolan/finishing-up-at-decentraland-9dc5b7a4f93e">
                  <a className="nes-text is-success">
                    acquired by an Argentinean company
                  </a>
                </Link>
                , to help build out what is now known as Decentraland.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  className="h-auto"
                  src="/assets/images/decentraland.png"
                  alt="Contract"
                />
              </div>
              <p>
                Funnily enough, it all came around full circle in early 2022.
                Cyrus (of Etheria) connected PixelMap with Matty (of DCL Blogger
                fame), MoonCat Rescue, and Curio Cards, to release a set of
                Decentraland Wearables from Metakey.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  className="h-auto"
                  src="/assets/images/dcgear.jpeg"
                  alt="Contract"
                />
              </div>
              <h3>
                <span className="text-blue-300">
                  What was the &quot;rediscovery&quot;?
                </span>
              </h3>
              <p>
                When PixelMap launched, much like a few other early projects, it
                was a bit too early before the concept of &quot;NFTs&quot; had
                taken off. Maybe 30-40 tiles were sold between the end of 2016
                and 2017. The webserver crashed at some point in 2018,
                eventually shut down entirely at the end of 2018. Between 2018
                and August 21, 2021, nearly all traces of PixelMap disappeared
                from the Internet, except for the data stored on-chain.
              </p>
              <p>
                On August 22, 2021,{" "}
                <Link href="https://twitter.com/adamamcbride">
                  <a className="nes-text is-success">Adam McBride</a>
                </Link>
                , an &quot;NFT Archaeologist&quot; as he&apos;s best described,
                reached out to myself (
                <Link href="https://twitter.com/KenErwin88">
                  <a className="nes-text is-success">Ken Erwin</a>
                </Link>
                ), asking if I had created PixelMap. That was the beginning of
                the &quot;rediscovery&quot;, leading to a massive amount of
                attention in a few hours, no sleep for 50+ hours, an ERC-721
                wrapper to make PixelMap easier to use, and a revival of the
                website. More information about the rediscovery can be found on{" "}
                <Link href="https://adamamcbride.medium.com/pixel-map-lost-2016-nft-project-78fc00e62179">
                  <a className="nes-text is-success">Adam&apos;s Blog</a>
                </Link>
                .
              </p>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}

export default About;
