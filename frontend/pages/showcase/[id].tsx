import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { fetchSingleTile } from "../../utils/api";
import TileShowcase from "../../components/TileShowcase";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

const ShowcasePage = () => {
  const [tile, setTile] = useState<PixelMapTile>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id, mode } = router.query;

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    fetchSingleTile(id as string).then((_tile) => {
      setTile(_tile);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '24px'
      }}>
        Loading tile showcase...
      </div>
    );
  }

  if (!tile) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '24px',
        textAlign: 'center'
      }}>
        <div>
          <h1>Tile Not Found</h1>
          <p>The requested tile could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>PixelMap Tile #{tile.id} - Showcase</title>
        <meta name="description" content={`View PixelMap Tile #${tile.id} in full showcase mode. Owned by ${tile.ens || tile.owner}.`} />
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content={`PixelMap Tile #${tile.id} - Digital Real Estate`} />
        <meta property="og:description" content={`Historic NFT from 2016 • Owned by ${tile.ens || tile.owner} • ${tile.price} ETH`} />
        <meta property="og:image" content={`https://pixelmap.art/${String(tile.id).padStart(3, '0')}/large.png`} />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:url" content={`https://pixelmap.io/showcase/${tile.id}`} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@PixelMapNFT" />
        <meta name="twitter:title" content={`PixelMap Tile #${tile.id}`} />
        <meta name="twitter:description" content={`Historic NFT from 2016 • ${tile.price} ETH • pixelmap.io`} />
        <meta name="twitter:image" content={`https://pixelmap.art/${String(tile.id).padStart(3, '0')}/large.png`} />
        
        {/* Additional meta tags */}
        <meta name="theme-color" content="#000000" />
        <link rel="canonical" href={`https://pixelmap.io/showcase/${tile.id}`} />
      </Head>
      
      <TileShowcase 
        tile={tile}
        mode={mode as any || 'gallery'}
        onClose={() => router.push(`/tile/${tile.id}`)}
      />
    </>
  );
};

export async function getStaticPaths() {
  const paths: { params: { id: string } }[] = [];
  for (let i = 0; i < 3970; i++) {
    paths.push({ params: { id: i.toString() } });
  }
  return {
    paths: paths,
    fallback: false,
  };
}

export async function getStaticProps(context: { params: { id: string } }) {
  return {
    props: { post: {} },
  };
}

export default ShowcasePage;