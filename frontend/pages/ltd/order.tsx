import React, { useEffect, useState } from "react";

import Head from "next/head";
import Layout from "../../components/Layout";
import { useForm } from "react-hook-form";

import { fetchSingleTile, fetchTiles } from "../../utils/api";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

import { useRouter } from "next/router";

function Order() {
  const router = useRouter();
  const { query } = useRouter();

  const formOptions = { default: [] };
  const { formState, watch } =
    // @ts-ignore
    useForm(formOptions);
  const { errors } = formState;
  const [tileWidth, setTileWidth] = useState<number>(0);
  const [tileHeight, setTileHeight] = useState<number>(0);

  const [tiles, setTiles] = useState<PixelMapTile[]>([]);

  // If single tile chosen, convert it to an array, else use the array
  const [chosenTiles, setChosenTiles] = useState<string[]>([]);

  const [mapOfTiles, setMapOfTiles] = useState(new Map<number, PixelMapTile>());
  const [finishedLoading, setFinishedLoading] = useState(false);

  useEffect(() => {
    fetchTiles()
      .then((_tiles) => {
        setTiles(_tiles);
      })
      .then(() => {});
  }, []);

  useEffect(() => {
    if (router.isReady) {
      const cTiles =
        typeof router.query.tiles == "string"
          ? [router.query.tiles]
          : router.query.tiles;
      // @ts-ignore
      setTileHeight(router.query.tileHeight);
      // @ts-ignore
      setTileWidth(router.query.tileWidth);

      setChosenTiles(cTiles);
      updateChosenTiles(cTiles).then(() => {
        setFinishedLoading(true);
      });
    }
  }, [router.isReady, router.query.tiles]);

  async function updateChosenTiles(tiles) {
    for (const chosenTile of tiles) {
      const tile = await fetchSingleTile(chosenTile);
      setMapOfTiles(mapOfTiles.set(tile.id, tile));
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // Alert the user that the action took place.
      // Nobody likes hidden stuff being done under the hood!
      alert(
        "Copied URL to clipboard, please send to LTD.INC to complete your order!"
      );
    });
  }

  // @ts-ignore
  // @ts-ignore
  // @ts-ignore
  return (
    <>
      <Head>
        <title>LTD Order Customization | PixelMap.io</title>
        <link
          href="//netdna.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </Head>
      <Layout>
        <main className="w-full max-w-5xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
          <div className="nes-container is-dark is-rounded">
            <div className="text-black font-medium prose max-w-none  ">
              <h3>
                <span className="text-blue-300">
                  LTD PixelMap Order Summary
                </span>
              </h3>
              <form>
                <div className="card m-3">
                  <h5 className="card-header">
                    Owners Name {router.query.account} <br />
                    Dimensions: {tileWidth}x{tileHeight} <br />
                    {tiles && chosenTiles && finishedLoading && (
                      <>ENS: {mapOfTiles.get(parseInt(chosenTiles[0])).ens}</>
                    )}
                  </h5>

                  <table>
                    <tbody>
                      <tr>
                        <th>No.</th>
                        <th>Date / Time</th>
                        <th>Edition</th>
                        <th>URL</th>
                        <th>Location (Left to Right)</th>
                      </tr>
                      {tiles &&
                        chosenTiles &&
                        finishedLoading &&
                        // @ts-ignore
                        [...chosenTiles].map((tileNumber, i) => (
                          <tr key={i}>
                            <td>
                              <a
                                href={`https://pixelmap.art/${tileNumber}/latest.png`}
                              >
                                {tileNumber}
                              </a>
                            </td>
                            <td>
                              {
                                // @ts-ignore
                                mapOfTiles.get(parseInt(tileNumber)) &&
                                  mapOfTiles.get(parseInt(tileNumber))
                                    .historical_images[
                                    mapOfTiles.get(parseInt(tileNumber))
                                      .historical_images.length - 1
                                  ].date
                              }
                            </td>
                            <td>
                              {mapOfTiles.get(parseInt(tileNumber)) &&
                                mapOfTiles.get(parseInt(tileNumber))
                                  .historical_images.length}
                            </td>
                            <td>
                              {
                                // @ts-ignore
                                tiles && tiles[tileNumber]?.url
                              }
                            </td>
                            <td>
                              {
                                // @ts-ignore
                                i
                              }
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </form>
              <div className="card-footer text-center border-top-0">
                <button
                  onClick={copyToClipboard}
                  className="btn btn-primary mr-1"
                >
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}

export default Order;
