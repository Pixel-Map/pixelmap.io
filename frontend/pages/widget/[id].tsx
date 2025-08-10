import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { fetchSingleTile } from "../../utils/api";
import TileImage from "../../components/TileImage";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";
import { shortenIfHex } from "../../utils/misc";
import { getLargeImageUrl } from "../../utils/tileImageUtils";

type WidgetStyle = 'minimal' | 'card' | 'detailed' | 'banner';

const WidgetPage = () => {
  const [tile, setTile] = useState<PixelMapTile>();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id, style = 'card', live = 'false' } = router.query;

  useEffect(() => {
    if (!id) return;
    
    const fetchTile = () => {
      fetchSingleTile(id as string).then((_tile) => {
        setTile(_tile);
        setLoading(false);
      });
    };

    fetchTile();

    // If live updates are enabled, poll for changes every 30 seconds
    if (live === 'true') {
      const interval = setInterval(fetchTile, 30000);
      return () => clearInterval(interval);
    }
  }, [id, live]);

  if (loading) {
    return (
      <div className="widget-loading" style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        background: '#f5f5f5'
      }}>
        Loading...
      </div>
    );
  }

  if (!tile) {
    return (
      <div className="widget-error" style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        background: '#f5f5f5',
        color: '#666'
      }}>
        Tile not found
      </div>
    );
  }

  const widgetStyles = {
    minimal: {
      container: {
        padding: '10px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center' as const,
        maxWidth: '200px',
        fontFamily: 'Arial, sans-serif'
      },
      image: 'w-full h-auto max-w-32 mx-auto',
      title: {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '10px 0 5px 0',
        color: '#333'
      },
      price: {
        fontSize: '12px',
        color: '#666',
        margin: '0'
      }
    },
    card: {
      container: {
        padding: '15px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '300px',
        fontFamily: 'Arial, sans-serif'
      },
      image: 'w-full h-auto max-w-40 mx-auto mb-3',
      title: {
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 8px 0',
        color: '#333',
        textAlign: 'center' as const
      },
      details: {
        fontSize: '14px',
        color: '#666',
        lineHeight: '1.4',
        textAlign: 'center' as const
      }
    },
    detailed: {
      container: {
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        color: '#fff',
        maxWidth: '400px',
        fontFamily: 'Arial, sans-serif'
      },
      image: 'w-full h-auto max-w-48 mx-auto mb-4 border-4 border-white rounded-lg',
      title: {
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '0 0 10px 0',
        textAlign: 'center' as const
      },
      details: {
        fontSize: '16px',
        lineHeight: '1.5',
        textAlign: 'center' as const,
        opacity: 0.9
      }
    },
    banner: {
      container: {
        padding: '15px 25px',
        background: 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        maxWidth: '600px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif'
      },
      image: 'w-16 h-16 flex-shrink-0',
      content: {
        flex: 1
      },
      title: {
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 5px 0'
      },
      details: {
        fontSize: '14px',
        opacity: 0.8,
        margin: '0'
      }
    }
  };

  const currentStyle = widgetStyles[style as WidgetStyle] || widgetStyles.card;

  return (
    <>
      <Head>
        <title>PixelMap Tile #{tile.id} - Widget</title>
        <meta name="robots" content="noindex, nofollow" />
        <style>{`
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif;
            background: transparent;
          }
          .tile-widget {
            image-rendering: pixelated;
            -ms-interpolation-mode: nearest-neighbor;
          }
          .tile-widget img {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }
        `}</style>
      </Head>
      
      <div className="tile-widget">
        {(style as WidgetStyle) === 'banner' ? (
          <div style={currentStyle.container}>
            <TileImage 
              image={tile.image} 
              className={currentStyle.image}
            />
            <div style={(currentStyle as any).content || {}}>
              <h3 style={currentStyle.title}>
                PixelMap Tile #{tile.id}
              </h3>
              <div style={(currentStyle as any).details || {}}>
                <p style={{ margin: '0 0 3px 0' }}>
                  Owner: {tile.ens || shortenIfHex(tile.owner || '', 10)}
                </p>
                <p style={{ margin: '0 0 3px 0' }}>
                  Price: {tile.price} ETH
                  {tile.wrapped && <span style={{ marginLeft: '10px' }}>🎁 Wrapped</span>}
                </p>
                <p style={{ margin: '0', fontSize: '12px', opacity: 0.6 }}>
                  pixelmap.io • Historic NFT since 2016
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={currentStyle.container}>
            <TileImage 
              image={tile.image} 
              className={currentStyle.image}
            />
            <h3 style={currentStyle.title}>
              PixelMap Tile #{tile.id}
            </h3>
            <div style={(currentStyle as any).details || {}}>
              {(style as WidgetStyle) === 'minimal' ? (
                <>
                  <p style={(currentStyle as any).price || {}}>{tile.price} ETH</p>
                  {live === 'true' && (
                    <div style={{ fontSize: '10px', color: '#4ecdc4', marginTop: '5px' }}>
                      ● LIVE
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Owner: {tile.ens || shortenIfHex(tile.owner || '', 12)}
                  </p>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Price: {tile.price} ETH
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: (style as WidgetStyle) === 'detailed' ? '14px' : '12px' }}>
                    {tile.wrapped ? '🎁 Wrapped NFT' : '📦 Original Format'}
                  </p>
                  {(style as WidgetStyle) === 'detailed' && (
                    <p style={{ margin: '0', fontSize: '14px', opacity: 0.8 }}>
                      Historic NFT • Part of PixelMap since 2016
                    </p>
                  )}
                  <a 
                    href={`https://pixelmap.io/tile/${tile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: (style as WidgetStyle) === 'detailed' ? '#fff' : '#0066cc',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      marginTop: '8px',
                      padding: '5px 10px',
                      background: (style as WidgetStyle) === 'detailed' ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                      borderRadius: '4px'
                    }}
                  >
                    View on PixelMap →
                  </a>
                  {live === 'true' && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#4ecdc4', 
                      marginTop: '8px',
                      textAlign: 'center' as const
                    }}>
                      ● LIVE UPDATES
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
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

export default WidgetPage;