import React, { useEffect, useState } from "react";

import Head from "next/head";
import Layout from "../../components/Layout";
import { useForm, useFieldArray } from "react-hook-form";
import Account from "../../components/Account";
import useEagerConnect from "../../hooks/useEagerConnect";
import { useWeb3React } from "@web3-react/core";
import { fetchTiles } from "../../utils/api";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

import { useRouter } from "next/router";

function Order() {
  const router = useRouter();
  const { query } = useRouter();
  const { account, library } = useWeb3React();
  const formOptions = { default: [] };
  const triedToEagerConnect = useEagerConnect();
  const { register, control, handleSubmit, reset, formState, watch } =
    // @ts-ignore
    useForm(formOptions);
  const { errors } = formState;
  const tileWidth = watch("tileWidth", 1);
  const tileHeight = watch("tileHeight", 1);
  const [tiles, setTiles] = useState<PixelMapTile[]>([]);
  const [ownedTiles, setOwnedTiles] = useState<PixelMapTile[]>([]);

  useEffect(() => {
    console.log(router.query);
    fetchTiles().then((_tiles) => {
      setTiles(_tiles);
    });
  }, []);

  useEffect(() => {
    if (account) {
      let owned = tiles.filter((tile: PixelMapTile) => {
        return tile.owner.toLowerCase() === account.toLowerCase();
      });

      owned = owned.map((tile: PixelMapTile) => {
        return tile;
      });

      setOwnedTiles(owned);
    }
  }, [account, tiles]);

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

  function serialize(obj) {
    var str = [];
    for (var p in obj)
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    return str.join("&");
  }

  function onSubmit(data) {
    router.push(`/ltd?${serialize(data)}`);
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
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="card m-3">
                  <h5 className="card-header">
                    Owners Name {account && account.toLowerCase()}
                  </h5>
                  {!account && (
                    <div className="nes-container mt-4 bg-yellow-300 text-center">
                      <h3 className="font-bold text-lg md:text-xl mb-4">
                        Please connect your account to choose your tiles.
                      </h3>
                      <Account triedToEagerConnect={triedToEagerConnect} />
                    </div>
                  )}
                  <table>
                    <tr>
                      <th>No.</th>
                      <th>Date / Time</th>
                      <th>Edition</th>
                      <th>URL</th>
                      <th>Location (Left to Right)</th>
                    </tr>
                    {tiles &&
                      router.query.tiles &&
                      // @ts-ignore
                      [...router.query.tiles].map((tileNumber, i) => (
                        <tr key={i}>
                          <td>{tileNumber}</td>
                          <td>
                            {
                              // @ts-ignore
                              tiles && tiles[tileNumber]?.lastUpdated
                            }
                          </td>
                          <td>Edition</td>
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
                  </table>

                  <div className="card-footer text-center border-top-0">
                    <button type="submit" className="btn btn-primary mr-1">
                      Copy URL
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}

export default Order;
