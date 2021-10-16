import React from 'react';

import Head from 'next/head'
import Link from 'next/link'

function About() {
    return (
        <>
            <Head>
                <title>History | PixelMap.io</title>
            </Head>

            <main className="w-full max-w-2xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
                <h1 className="text-3xl font-bold mb-4 text-white">The History of PixelMap</h1>

                <div className="nes-container is-dark is-rounded">
                    <div className="text-white font-medium prose ">
                        <h3><span className="text-blue-300">What is PixelMap?</span></h3>
                        <p>
                            PixelMap (2016) is often considered an NFT &quot;relic&quot; or &quot;antique&quot;, due to being one of the oldest NFTs in existence.
                            The original &quot;billboard-style&quot; NFT, PixelMap is also known for being one of the first to store image data directly on-chain, as well as the oldest (Ethereum) NFT tradeable on OpenSea.
                            It provides the ability to create, display, and update artwork on a &quot;pixel map&quot; with all historical data immortalized on the Blockchain.
                        </p>

                        <h3><span className="text-blue-300">What inspired PixelMap?</span></h3>
                        <p>
                            Heavily inspired by Alex Tew&apos;s <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage"><a className="nes-text is-success">The Million Dollar Homepage</a></Link>, <Link href="https://twitter.com/KenErwin88"><a className="nes-text is-success">Ken Erwin</a></Link> created the first fully
                            decentralized equivalent, going live with PixelMap on <Link href="https://etherscan.io/tx/0x79e41799591e99ffb0aad02d270ac92328e441d0d6a0e49fd6cb9948efb40656"><a className="nes-text is-success">November 17, 2016</a></Link>, years before
                            the Non-Fungible Token (NFT) Standard (EIP-721) would even be written.
                        </p>
                        <p>
                            The <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage"><a className="nes-text is-success">The Million Dollar Homepage</a></Link> consists of a 1000x1000 pixel grid, with a total of 1,000,000 pixels,
                            sold for $1 each.  Because the pixels themselves were too small to be seen individually,
                            Alex sold them in 10x10 squares for $100 each.  Advertisers would then provide him with an
                            image to display on the square, as well as a URL.  Notably, the tiles themselves could only
                            be updated by Alex, as the page itself was static (invented roughly four years before
                            Bitcoin had even launched).
                        </p>

                        <h3><span className="text-blue-300">What makes PixelMap special?</span></h3>
                        <p>
                            In many ways, PixelMap.io is similar to the <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage"><a className="nes-text is-success">The Million Dollar Homepage</a></Link>.
                            There are a total of 1,016,064 pixels for sale (on a 1,296 x 784 grid). The grid is broken up
                            into 3,969 (visible, plus one secret) 16x16 tiles, each at an initial price of 2 Ethereum ($20 at launch).
                        </p>
                        <p>
                            However, unlike <Link href="https://en.wikipedia.org/wiki/The_Million_Dollar_Homepage"><a className="nes-text is-success">The Million Dollar Homepage</a></Link>, every tile is controlled by a contract on the Ethereum Blockchain, lending the following benefits.
                        </p>
                        <div>
                            <ul>
                                <li>Each tile is truly owned by the entity that purchases it. Because the data is stored on the Blockchain, nothing short of every single Ethereum node shutting down can eliminate the data.</li>
                                <li>The contract is designed so that if a tile owner wants to update the image, change the URL the tile points to, or sell the tile for any amount they&apos;d like, they can, without any central authority facilitating or controlling any part of the process.</li>
                                <li>If PixelMap.io itself were ever to go down, the data, owner, and URLs for every single pixel remain on the Blockchain, and any site could easily replicate and display the overall image. Essentially, the backend data of PixelMap is invincible as long as the Blockchain exists.</li>
                                <li>The project has been <Link href="https://github.com/Pixel-Map/pixelmap.io/blob/main/LICENSE"><a className="nes-text is-success">open sourced</a></Link>, which means anyone can view the code, audit the Solidity contract, or even set up more frontends if they&apos;d like. For instance, if someone wanted to set up an easier-to-use tile editor for PixelMap.io, they could, as all of the data is stored safely on the Ethereum blockchain.</li>
                            </ul>
                        </div>

                        <h3><span className="text-blue-300">What was the &quot;rediscovery&quot;?</span></h3>
                        <p>
                            When PixelMap launched, much like a few other early projects, it was a bit too early before
                            the concept of &quot;NFTs&quot; had taken off.  Maybe 30-40 tiles were sold between the end of 2016
                            and 2017.  The webserver crashed at some point in 2018, eventually shut down entirely at the
                            end of 2018.  Between 2018 and August 21, 2021, nearly all traces of PixelMap disappeared from the Internet, except for the data stored on-chain.
                        </p>
                        <p>
                            On August 22, 2021, <Link href="https://twitter.com/adamamcbride"><a className="nes-text is-success">Adam McBride</a></Link>, an &quot;NFT Archaeologist&quot; as he&apos;s best described, reached out to myself (<Link href="https://twitter.com/KenErwin88"><a className="nes-text is-success">Ken Erwin</a></Link>), asking if I had created PixelMap.  That was the beginning of the &quot;rediscovery&quot;, leading to a massive amount of attention in a few hours, no sleep for 50+ hours, an ERC-721 wrapper to make PixelMap easier to use, and a revival of the website.  More information about the rediscovery can be found on <Link href="https://adamamcbride.medium.com/pixel-map-lost-2016-nft-project-78fc00e62179"><a className="nes-text is-success">Adam&apos;s Blog</a></Link>.
                        </p>
                    </div>
                </div>

            </main>

        </>
    )
}

export default About;