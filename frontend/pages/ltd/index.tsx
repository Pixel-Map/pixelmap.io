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

function LTD() {
    const router = useRouter();

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
            // append tiles to field array
            for (let i = oldVal; i < newVal; i++) {
                append(0);
            }
        } else {
            // remove tiles from field array
            for (let i = oldVal; i > newVal; i--) {
                remove(i - 1);
            }
        }
    }, [tileHeight, tileWidth]);
    const { fields, append, remove } = useFieldArray({
        name: "tiles",
        control,
    });

    function serialize(obj) {
        var str = [];
        for (var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        return str.join("&");
    }

    function onSubmit(data) {
        // console.log(JSON.stringify(data, null, 4));
        // console.log(serialize(data));
        // console.log(encodeURIComponent(JSON.stringify(data)));
        // router.push(`/ltd/order?${serialize(data)}`);
        console.log(data);
        router.push({
            pathname: "/ltd/order",
            query: {
                tileHeight: data.tileHeight,
                tileWidth: data.tileWidth,
                tiles: data.tiles,
            },
        });
    }

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
                    <h1 className="text-3xl font-bold mb-4 text-white">
                        LTD Order Customization
                    </h1>

                    <div className="nes-container is-dark is-rounded">
                        <div className="text-black font-medium prose max-w-none  ">
                            <h3>
                <span className="text-blue-300">
                  Please fill out the form below.
                </span>
                            </h3>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="card m-3">
                                    <h5 className="card-header">
                                        React Hook Form 7 - Dynamic Form Example
                                    </h5>
                                    {!account && (
                                        <div className="nes-container mt-4 bg-yellow-300 text-center">
                                            <h3 className="font-bold text-lg md:text-xl mb-4">
                                                Please connect your account to choose your tiles.
                                            </h3>
                                            <Account triedToEagerConnect={triedToEagerConnect} />
                                        </div>
                                    )}
                                    <div className="card-body border-bottom">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Height (In Tiles)</label>
                                                <select
                                                    name="tileHeight"
                                                    {...register("tileHeight")}
                                                    className={`form-control ${
                                                        errors.tileHeight ? "is-invalid" : ""
                                                    }`}
                                                >
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <option key={i} value={i}>
                                                            {i}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Width (In Tiles)</label>
                                                <select
                                                    name="tileWidth"
                                                    {...register("tileWidth")}
                                                    className={`form-control ${
                                                        errors.tileWidth ? "is-invalid" : ""
                                                    }`}
                                                >
                                                    {[1, 2, 3, 4].map((i) => (
                                                        <option key={i} value={i}>
                                                            {i}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    {Array.from({ length: tileHeight }, (_, row) => (
                                        <div key={row} className="list-group list-group-flush">
                                            <div className="list-group-item">
                                                <div className="form-row">
                                                    {Array.from({ length: tileWidth }, (_, column) => (
                                                        <div className="form-group">
                                                            <label>Tile #</label>

                                                            <select
                                                                name={`tiles[${row * tileWidth + column}]`}
                                                                {...register(
                                                                    `tiles.${row * tileWidth + column}`
                                                                )}
                                                                id={`tiles[${row * tileWidth + column}]`}
                                                                key={`tiles[${row * tileWidth + column}]`}
                                                                className={`form-control myDropdown ${
                                                                    errors.tiles?.[row * tileWidth + column]
                                                                        ? "is-invalid"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <option value={""} />
                                                                {ownedTiles.map(
                                                                    (ownedTile: PixelMapTile, index: number) => (
                                                                        <option
                                                                            value={ownedTile.id}
                                                                            key={ownedTile.id}
                                                                            // value={ownedTile.id}
                                                                        >
                                                                            {ownedTile.id}
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>

                                                            <div className="invalid-feedback">
                                                                {
                                                                    errors.tiles?.[row * tileWidth + column]
                                                                        ?.message
                                                                }
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="card-footer text-center border-top-0">
                                        <button type="submit" className="btn btn-primary mr-1">
                                            Buy tiles
                                        </button>
                                        <button
                                            onClick={() => reset()}
                                            type="button"
                                            className="btn btn-secondary mr-1"
                                        >
                                            Reset
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

export default LTD;
