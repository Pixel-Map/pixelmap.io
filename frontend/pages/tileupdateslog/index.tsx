import React, { useEffect, useState } from "react";

import Head from "next/head";

import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { fetchAllTilesEver, TimeCapsuleTile } from "../../utils/api";

function TileUpdatesLog() {
  const [selectedIndex, setSelectedIndex] = useState(9999);

  function handleTests(id, index) {
    setSelectedIndex(index); //NEW
  }

  const router = useRouter();
  const [tiles, setTimeCapsuleTile] = useState<TimeCapsuleTile[]>([]);
  useEffect(() => {
    fetchAllTilesEver().then((_tiles) => {
      setTimeCapsuleTile(_tiles);
    });
  }, []);
  const [hovered, setHovered] = useState(false);
  const toggleHover = () => setHovered(!hovered);

  // @ts-ignore
  return (
    <>
      <style>{`
        body {
          background: #ddd;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #555;
          font-size: 12px;
          line-height: 1.3em;
        }

        h2 {
          font-size: 20px;
          color: #333;
          margin: 7px 0;
        }

        a:hover {
          text-decoration: none;
          color: #205f82;
        }

        a:link,
        a:visited {
          color: #4083a9;
          outline: none;
          text-decoration: none;
        }

        .author {
          font-size: 13px;
          margin: 5px 0 25px;
        }

        .date {
          font-size: 13px;
          font-weight: bold;
        }

        /**/
        #projects {
          width: 100%;
          margin: 10px auto;
        }

        #projects .flipper {
          width: 300px;
          height: 300px;
          display: inline-block;

          -webkit-transform: scale(0.9);
          -moz-transform: scale(0.9);
          -o-transform: scale(0.9);
          -ms-transform: scale(0.9);
          transform: scale(0.9);

          -webkit-box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
          box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);

          -webkit-transition: all 0.3s;
          -moz-transition: all 0.3s;
          -o-transition: all 0.3s;
          -ms-transition: all 0.3s;
          transition: all 0.3s;

          -webkit-transform-style: preserve-3d;
          -moz-transform-style: preserve-3d;
          -ms-transform-style: preserve-3d;
          transform-style: preserve-3d;
          position: relative;
        }

        #projects .flipper:hover {
          -webkit-transform: scale(1);
          -moz-transform: scale(1);
          -o-transform: scale(1);
          -ms-transform: scale(1);
          transform: scale(1);

          -webkit-box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }

        #projects .flipper.blur {
          -webkit-filter: blur(3px);

          -webkit-transform: scale(0.88);
          -moz-transform: scale(0.88);
          -o-transform: scale(0.88);
          -ms-transform: scale(0.88);
          transform: scale(0.88);
          filter: alpha(opacity=60);
          opacity: 0.6;
        }

        #projects .flipper.rotate {
          -webkit-transform: rotateY(180deg);
          -moz-transform: rotateY(180deg);
          -o-transform: rotateY(180deg);
          -ms-transform: rotateY(180deg);
          transform: rotateY(180deg);
        }

        #projects:hover .clicked {
          -webkit-transform: rotateY(180deg);
          -moz-transform: rotateY(180deg);
          -o-transform: rotateY(180deg);
          -ms-transform: rotateY(180deg);
          transform: rotateY(180deg);
        }

        .front,
        .back {
          width: 300px;
          color: #000;
          height: 300px;
          position: absolute;
          top: 0;
          left: 0;
          backface-visibility: hidden;
        }

        .front {
          z-index: 2;
        }

        .back {
          -webkit-transform: rotateY(180deg);
          -moz-transform: rotateY(180deg);
          -o-transform: rotateY(180deg);
          -ms-transform: rotateY(180deg);
          transform: rotateY(180deg);
          width: 300px;
          height: 260px;
          padding: 20px;
          z-index: 1;
          background: white;
        }
      `}</style>
      <Head>
        <title>History | PixelMap.io</title>
      </Head>
      <Layout>
        <main className="w-full ">
          <div className="nes-container is-dark is-rounded">
            <div className="text-white font-medium prose max-w-none  ">
              <h3>
                <span className="text-blue-300">
                  Tile Updates Log (Oldest to Newest)
                </span>
              </h3>
            </div>
            <div>
              <ul id="projects">
                {tiles.map((ownedTile: any, index: number) => (
                  <li
                    key={index}
                    id="p1"
                    className={`${hovered ? "flipper" : "flipper "} ${
                      selectedIndex == index ? "clicked" : ""
                    }`}
                    onMouseEnter={toggleHover}
                    onMouseLeave={toggleHover}
                    onClick={(e: any) => handleTests(e.target.id, index)} //NEW
                  >
                    <div className="front">
                      <img src={ownedTile.image_url} alt="" />
                    </div>
                    <div className="back">
                      <h2>#{ownedTile.tileId}</h2>
                      <p className="author">
                        by{" "}
                        <a
                          href={`https://etherscan.io/address/${ownedTile.updatedBy}`}
                        >
                          {ownedTile.updatedBy.slice(0, 16)}
                        </a>
                      </p>
                      <p>
                        <ul>
                          <li>Blocknumber: {ownedTile.blockNumber}</li>
                          <li>Number Set: {ownedTile.orderImageSetOnTile}</li>
                        </ul>
                      </p>
                      <p className="date">
                        {new Date(ownedTile.date).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}

export default TileUpdatesLog;
