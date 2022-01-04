import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import timeCapsule from "../../public/assets/images/found-capsule.png";
import {
  fetchSingleTile,
  fetchTiles,
  fetchTimeCapsuleTiles,
  TimeCapsuleTile,
} from "../../utils/api";

import styles from "../../styles/pages/Home.module.scss";
import Image from "next/image";
import Header from "../../components/Header";

const TimeCapsule = () => {
  const large = true;
  const [fetching, setFetching] = useState(false);
  const router = useRouter();
  const id = router.query.id as string;
  const [tiles, setTimeCapsuleTile] = useState<TimeCapsuleTile[]>([]);
  useEffect(() => {
    fetchTimeCapsuleTiles().then((_tiles) => {
      setTimeCapsuleTile(_tiles);
    });
  }, []);

  return (
    <>
      <div className={styles.tileHouse}>
        <Header />
      </div>

      <div
        className={`flex justify-center h-screen
      ${styles.tileHouse}`}
      >
        <>
          <Head>
            <title>TimeCapsule - PixelMap.io</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
        </>
        <div className="w-full  nes-container bg-white p-0 relative my-6 lg:my-16">
          <div
            className={`relative flex p-4 space-x-4 ${
              large ? "md:p-8 md:space-x-8" : ""
            }`}
          >
            <h3
              className={`text-gray-900 font-bold ${
                large ? "md:text-3xl" : "text-xl"
              } mb-1 relative`}
            >
              <span>PixelMap Time Capsule FAQ</span>
            </h3>

            <div className="clear-both">
              <Image className="w-full h-auto" src={timeCapsule} alt="Portal" />
            </div>
          </div>
          <section className="nes-container is-dark">
            <ul>
              <li>Q. What is a PixelMap TimeCapsule?</li>
              <li>
                A. One of the unique things about PixelMap is that the images on
                each tile can be changed at any time by its owner. Additionally,
                because all changes are stored on-chain, you can see ANY image
                that has ever been set, not just the most recent. While all
                tiles HAVE been sold, not all of them have had an image updated.
                The PixelMap Time Capsules are a way to reward those who were
                the earliest to set an image, as well as to immortalize points
                in time on the PixelMap map.
              </li>
              <br />
              <li>Q. How many TimeCapsules are there?</li>
              <li>
                A. For now, there is only one (
                <a
                  href={
                    "https://opensea.io/assets/0x841d6ed6129390af55f015f80c0849535b36f0d6/1"
                  }
                >
                  the OG 18x18, with a quantity of 324
                </a>
                ). This is for anyone holding one of the first 324 tiles to have
                an image on it. Depending on reception and how the community
                feels, we may do more in the future (first 24x24, 32x32, etc.)
              </li>
              <br />
              <li>Q. How are the TimeCapsules distributed?</li>
              <li>
                A. For the first one at least, we&apos;re going with: Anyone
                holding one of the first 324 tiles (based on the Snapshot below,
                taken December 22, 2021), may claim one TimeCapsule (PER tile
                that meets the requirements). The minting has already been paid
                for, so they ONLY need to pay the transfer fee. They have until
                the end of the year (2021, based on Times Square ball dropping)
                to claim for free.
              </li>
              <br />
              <li>
                Q. What will be done with any remaining unclaimed TimeCapsules?
              </li>
              <li>
                A. Starting January 1st, anyone that owns a tile may purchase
                one for 0.05E for one week. After that, any remaining will be
                listed on OpenSea for 0.1E.
              </li>
              <br />
              <li>Q. I just bought / sold one of the 324, can I get one??</li>
              <li>
                A. To alleviate this ^, it is based purely on the CURRENT
                account owner, and can ONLY be claimed once. Meaning, if you own
                one of the first 324 tiles, claim it, then sell your tile, the
                next person is NOT elgible to claim the TimeCapsule. If you sell
                your tile WITHOUT claiming, the new buyer CAN claim the
                TimeCapsule. If you did not make the cut, you will likely have a
                good chance for 0.1E in January. Also, set an image on your
                tile, we will probably do more of these!! :D
              </li>
              <li>Q. Who is elgible?</li>
              <li>
                A. Here is the availability list. If you are on the list, post
                the ID of the tile you are claiming, and the wallet address. We
                will validate that YOU are the correct owner, then will list the
                TimeCapsule for a private (free) sale to you on OpenSea. At that
                point, you will have a week to claim (paying only gas, we
                already paid the minting fee!) PLEASE note, the owner is NOT
                updated on this list. If you buy a tile, that has NOT claimed,
                and IS one of the first 324, let us know and we can verify on
                Etherscan!
              </li>
            </ul>
            <table className="nes-table is-bordered is-dark">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Tile ID</th>
                  <th>Order Set</th>
                  <th>Owner</th>
                  <th>Claimed Yet?</th>
                </tr>
              </thead>
              <tbody>
                {tiles.map((ownedTile: TimeCapsuleTile, index: number) => (
                  <tr key={ownedTile.tileId}>
                    <td>
                      <img
                        width={64}
                        height={64}
                        src={
                          "https://pixelmap.art/" +
                          ownedTile.tileId +
                          "/latest.png"
                        }
                      />
                    </td>
                    <td>{ownedTile.tileId}</td>
                    <td>{ownedTile.orderImageSetOnTile}</td>
                    <td>{ownedTile.currentOwner}</td>
                    <td>
                      <i
                        className={`nes-icon is-medium heart ${
                          ownedTile.claimed ? "" : "is-empty"
                        } `}
                      ></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div
            className={`px-4 py-3 bg-gray-50 ${large ? "md:px-8 md:py-4" : ""}`}
          >
            <div className="flex justify-between items-center"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeCapsule;
