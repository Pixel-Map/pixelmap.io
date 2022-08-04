import React, { useEffect, useState } from "react";

import Head from "next/head";
import Layout from "../../components/Layout";
import { useForm, useFieldArray } from "react-hook-form";
import Account from "../../components/Account";
import useEagerConnect from "../../hooks/useEagerConnect";
import { useWeb3React } from "@web3-react/core";
import { fetchSingleTile, fetchTiles } from "../../utils/api";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

import { useRouter } from "next/router";

function Order() {
  const router = useRouter();
  const { query } = useRouter();

  const formOptions = { default: [] };
  const { register, control, handleSubmit, reset, formState, watch } =
    // @ts-ignore
    useForm(formOptions);
  const { errors } = formState;
  const tileWidth = watch("tileWidth", 1);
  const tileHeight = watch("tileHeight", 1);
  const [tiles, setTiles] = useState<PixelMapTile[]>([]);

  // If single tile chosen, convert it to an array, else use the array

  const chosenTiles =
    typeof router.query.tiles == "string"
      ? [router.query.tiles]
      : router.query.tiles;

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
    if (chosenTiles) {
      for (const tileId of chosenTiles) {
        fetchSingleTile(tileId).then((tile) => {
          setMapOfTiles(mapOfTiles.set(tile.id, tile));
        });
      }
      setFinishedLoading(true);
    }
  });

  useEffect(() => {
    // update field array when ticket number changed
    const totalTiles = parseInt(tileHeight) + parseInt(tileWidth);
    const newVal = totalTiles || 0;
    const oldVal = fields.length;
    if (newVal > oldVal) {
      // append tickets to field array
      for (let i = oldVal; i < newVal; i++) {
        append(0);
      }
    } else {
      // remove tickets from field array
      for (let i = oldVal; i > newVal; i--) {
        remove(i - 1);
      }
    }
  }, [tileHeight, tileWidth]);
  const { fields, append, remove } = useFieldArray({
    name: "tickets",
    control,
  });

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
                    Owners Name {router.query.account}
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
                                tiles && tiles[tileNumber]?.lastUpdated
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
