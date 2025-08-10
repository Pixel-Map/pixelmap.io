import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import TileImage from '../../components/TileImage';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import { formatDistanceToNow } from 'date-fns';
import { shortenIfHex } from '../../utils/misc';

interface PortfolioStats {
  totalTiles: number;
  totalValue: number;
  averagePrice: number;
  rarest: PixelMapTile | null;
  oldest: PixelMapTile | null;
  newest: PixelMapTile | null;
  neighborhoods: string[];
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  date?: Date;
}

const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  {
    id: 'og_holder',
    name: 'OG Holder',
    description: 'Owned tiles since 2016-2017',
    icon: '💎',
    earned: false
  },
  {
    id: 'whale',
    name: 'Whale Collector',
    description: 'Owns 50+ tiles',
    icon: '🐋',
    earned: false
  },
  {
    id: 'artist',
    name: 'Pixel Artist',
    description: 'Updated tile images 10+ times',
    icon: '🎨',
    earned: false
  },
  {
    id: 'corner_owner',
    name: 'Corner Collector',
    description: 'Owns all 4 corner tiles',
    icon: '📐',
    earned: false
  },
  {
    id: 'neighborhood_king',
    name: 'Neighborhood King',
    description: 'Owns 25+ connected tiles',
    icon: '👑',
    earned: false
  },
  {
    id: 'never_seller',
    name: 'Diamond Hands',
    description: 'Never sold a tile',
    icon: '💎',
    earned: false
  },
  {
    id: 'early_wrapper',
    name: 'Early Adopter',
    description: 'Wrapped tiles in first month',
    icon: '🎁',
    earned: false
  }
];

export default function PortfolioPage() {
  const router = useRouter();
  const { address } = router.query;
  const [tiles, setTiles] = useState<PixelMapTile[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<'id' | 'price' | 'acquired'>('id');
  const [filterBy, setFilterBy] = useState<'all' | 'wrapped' | 'forsale'>('all');

  useEffect(() => {
    if (!address) return;
    
    fetchPortfolioData(address as string);
  }, [address]);

  const fetchPortfolioData = async (walletAddress: string) => {
    try {
      setLoading(true);
      
      // Fetch all tiles and filter by owner
      const response = await fetch('https://pixelmap.art/tiledata.json');
      const allTiles: PixelMapTile[] = await response.json();
      
      const userTiles = allTiles.filter(tile => 
        tile.owner?.toLowerCase() === walletAddress.toLowerCase()
      );

      setTiles(userTiles);
      setStats(calculateStats(userTiles));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
      setLoading(false);
    }
  };

  const calculateStats = (userTiles: PixelMapTile[]): PortfolioStats => {
    const totalValue = userTiles.reduce((sum, tile) => sum + parseFloat(String(tile.price || '0')), 0);
    const achievements = calculateAchievements(userTiles);

    return {
      totalTiles: userTiles.length,
      totalValue,
      averagePrice: totalValue / userTiles.length || 0,
      rarest: findRarestTile(userTiles),
      oldest: findOldestTile(userTiles),
      newest: findNewestTile(userTiles),
      neighborhoods: findNeighborhoods(userTiles),
      achievements
    };
  };

  const calculateAchievements = (userTiles: PixelMapTile[]): Achievement[] => {
    return ACHIEVEMENT_DEFINITIONS.map(achievement => {
      let earned = false;
      
      switch (achievement.id) {
        case 'whale':
          earned = userTiles.length >= 50;
          break;
        case 'corner_owner':
          const corners = [0, 80, 3888, 3968];
          earned = corners.every(corner => userTiles.some(tile => tile.id === corner));
          break;
        case 'neighborhood_king':
          earned = findLargestNeighborhood(userTiles) >= 25;
          break;
        // Add more achievement logic
      }
      
      return { ...achievement, earned };
    });
  };

  const findRarestTile = (userTiles: PixelMapTile[]): PixelMapTile | null => {
    // For now, just return corner tiles as "rarest"
    const corners = [0, 80, 3888, 3968];
    return userTiles.find(tile => tile.id && corners.includes(tile.id)) || userTiles[0] || null;
  };

  const findOldestTile = (userTiles: PixelMapTile[]): PixelMapTile | null => {
    // Would need purchase history to determine actual oldest
    return userTiles.sort((a, b) => (a.id || 0) - (b.id || 0))[0] || null;
  };

  const findNewestTile = (userTiles: PixelMapTile[]): PixelMapTile | null => {
    // Would need purchase history to determine actual newest
    return userTiles.sort((a, b) => (b.id || 0) - (a.id || 0))[0] || null;
  };

  const findNeighborhoods = (userTiles: PixelMapTile[]): string[] => {
    // Simple neighborhood detection based on adjacent tiles
    return ['Pixel Plaza', 'Art District']; // Placeholder
  };

  const findLargestNeighborhood = (userTiles: PixelMapTile[]): number => {
    // Calculate largest connected group of tiles
    return userTiles.length; // Placeholder
  };

  const filteredAndSortedTiles = tiles
    .filter(tile => {
      switch (filterBy) {
        case 'wrapped': return tile.wrapped;
        case 'forsale': return parseFloat(String(tile.price || '0')) > 0;
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price': return parseFloat(String(b.price || '0')) - parseFloat(String(a.price || '0'));
        case 'acquired': return (a.id || 0) - (b.id || 0); // Placeholder
        default: return (a.id || 0) - (b.id || 0);
      }
    });

  if (loading) {
    return (
      <div className="portfolio-loading nes-container is-dark">
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (!stats || tiles.length === 0) {
    return (
      <div className="portfolio-empty nes-container is-dark">
        <h1>Portfolio Not Found</h1>
        <p>This address doesn&apos;t own any PixelMap tiles.</p>
        <Link href="/" className="nes-btn is-primary">
          ← Back to Map
        </Link>
      </div>
    );
  }

  const displayAddress = address as string;
  const ensName = ''; // TODO: Add ENS resolution
  const shortAddress = shortenIfHex(displayAddress, 12);

  return (
    <>
      <Head>
        <title>{ensName || shortAddress} - PixelMap Portfolio</title>
        <meta name="description" content={`View ${ensName || shortAddress}'s PixelMap portfolio - ${stats.totalTiles} tiles worth ${stats.totalValue.toFixed(2)} ETH`} />
        <meta property="og:title" content={`${ensName || shortAddress} - PixelMap Portfolio`} />
        <meta property="og:description" content={`${stats.totalTiles} tiles • ${stats.totalValue.toFixed(2)} ETH total value`} />
      </Head>

      <div className="portfolio-page min-h-screen bg-gray-900 text-white p-4">
        
        {/* Header */}
        <div className="portfolio-header nes-container is-dark with-title mb-6">
          <p className="title">📊 Portfolio Dashboard</p>
          
          <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* Avatar */}
            <div className="portfolio-avatar">
              {stats.rarest && (
                <TileImage 
                  image={stats.rarest.image} 
                  className="w-20 h-20 border-4 border-cyan-400 rounded-lg img-pixel"
                />
              )}
            </div>

            {/* Basic Info */}
            <div className="portfolio-info">
              <h1 className="text-2xl font-bold mb-2">
                {ensName || shortAddress}
              </h1>
              <div className="stats-grid text-sm" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div>
                  <p className="text-gray-400">Tiles Owned</p>
                  <p className="text-xl font-bold text-cyan-400">{stats.totalTiles}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Value</p>
                  <p className="text-xl font-bold text-green-400">{stats.totalValue.toFixed(2)} ETH</p>
                </div>
                <div>
                  <p className="text-gray-400">Avg Price</p>
                  <p className="text-xl font-bold text-yellow-400">{stats.averagePrice.toFixed(3)} ETH</p>
                </div>
                <div>
                  <p className="text-gray-400">Achievements</p>
                  <p className="text-xl font-bold text-purple-400">{stats.achievements.filter(a => a.earned).length}/7</p>
                </div>
              </div>
            </div>

            {/* Share Button */}
            <div className="portfolio-actions">
              <button 
                type="button"
                className="nes-btn is-success"
                onClick={() => {
                  const text = `Check out my PixelMap portfolio! 🎨 ${stats.totalTiles} tiles worth ${stats.totalValue.toFixed(2)} ETH`;
                  const url = `https://pixelmap.io/portfolio/${address}`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                }}
              >
                🐦 Share Portfolio
              </button>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="achievements-section nes-container is-dark is-rounded mb-6">
          <h2 className="text-lg font-bold mb-3">🏆 Achievements</h2>
          <div className="achievements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {stats.achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className={`achievement ${achievement.earned ? 'earned' : 'locked'}`}
                style={{
                  padding: '10px',
                  border: `2px solid ${achievement.earned ? '#4ecdc4' : '#333'}`,
                  borderRadius: '8px',
                  opacity: achievement.earned ? 1 : 0.5,
                  textAlign: 'center'
                }}
              >
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <div className="font-bold text-sm">{achievement.name}</div>
                <div className="text-xs text-gray-400">{achievement.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Tiles */}
        <div className="featured-tiles nes-container is-dark is-rounded mb-6">
          <h2 className="text-lg font-bold mb-3">⭐ Featured Tiles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            
            {stats.rarest && (
              <div className="featured-tile">
                <p className="text-sm text-purple-400 mb-2">🦄 Rarest</p>
                <Link href={`/tile/${stats.rarest.id}`}>
                  <TileImage image={stats.rarest.image} className="w-full h-24 border-2 border-purple-400 img-pixel mb-2" />
                </Link>
                <p className="font-bold">Tile #{stats.rarest.id}</p>
                <p className="text-sm text-gray-400">{stats.rarest.price} ETH</p>
              </div>
            )}

            {stats.oldest && (
              <div className="featured-tile">
                <p className="text-sm text-yellow-400 mb-2">⏰ Oldest</p>
                <Link href={`/tile/${stats.oldest.id}`}>
                  <TileImage image={stats.oldest.image} className="w-full h-24 border-2 border-yellow-400 img-pixel mb-2" />
                </Link>
                <p className="font-bold">Tile #{stats.oldest.id}</p>
                <p className="text-sm text-gray-400">Since 2016</p>
              </div>
            )}

            {stats.newest && (
              <div className="featured-tile">
                <p className="text-sm text-green-400 mb-2">🆕 Newest</p>
                <Link href={`/tile/${stats.newest.id}`}>
                  <TileImage image={stats.newest.image} className="w-full h-24 border-2 border-green-400 img-pixel mb-2" />
                </Link>
                <p className="font-bold">Tile #{stats.newest.id}</p>
                <p className="text-sm text-gray-400">Recent</p>
              </div>
            )}
          </div>
        </div>

        {/* Tiles Collection */}
        <div className="tiles-collection nes-container is-dark with-title">
          <p className="title">🎨 Tile Collection</p>
          
          {/* Controls */}
          <div className="collection-controls mb-4" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            
            {/* View Mode */}
            <div className="control-group">
              <label className="text-sm text-gray-400">View:</label>
              <div className="nes-field" style={{ display: 'flex', gap: '5px' }}>
                <button 
                  type="button"
                  className={`nes-btn ${viewMode === 'grid' ? 'is-primary' : ''}`}
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                  onClick={() => setViewMode('grid')}
                >
                  🔲 Grid
                </button>
                <button 
                  type="button"
                  className={`nes-btn ${viewMode === 'list' ? 'is-primary' : ''}`}
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                  onClick={() => setViewMode('list')}
                >
                  📋 List
                </button>
              </div>
            </div>

            {/* Sort */}
            <div className="control-group">
              <label className="text-sm text-gray-400">Sort:</label>
              <div className="nes-select is-dark">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ fontSize: '12px' }}>
                  <option value="id">Tile ID</option>
                  <option value="price">Price</option>
                  <option value="acquired">Date Acquired</option>
                </select>
              </div>
            </div>

            {/* Filter */}
            <div className="control-group">
              <label className="text-sm text-gray-400">Filter:</label>
              <div className="nes-select is-dark">
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as any)} style={{ fontSize: '12px' }}>
                  <option value="all">All Tiles</option>
                  <option value="wrapped">Wrapped Only</option>
                  <option value="forsale">For Sale</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tiles Display */}
          <div className="tiles-display">
            {viewMode === 'grid' && (
              <div className="tiles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                {filteredAndSortedTiles.map(tile => (
                  <Link key={tile.id} href={`/tile/${tile.id}`} className="tile-card group">
                    <div className="relative">
                      <TileImage image={tile.image} className="w-full h-24 border-2 border-gray-600 hover:border-cyan-400 img-pixel transition-all" />
                      {tile.wrapped && (
                        <span className="absolute top-1 right-1 text-xs">🎁</span>
                      )}
                      {parseFloat(String(tile.price || '0')) > 0 && (
                        <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-1 rounded">
                          {tile.price} ETH
                        </span>
                      )}
                    </div>
                    <p className="text-center text-sm mt-1">#{tile.id}</p>
                  </Link>
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="tiles-list space-y-3">
                {filteredAndSortedTiles.map(tile => (
                  <Link key={tile.id} href={`/tile/${tile.id}`} className="tile-row">
                    <div className="flex items-center gap-4 p-3 border border-gray-600 hover:border-cyan-400 rounded transition-all">
                      <TileImage image={tile.image} className="w-12 h-12 border border-gray-500 img-pixel" />
                      <div className="flex-1">
                        <p className="font-bold">Tile #{tile.id}</p>
                        <p className="text-sm text-gray-400">
                          {tile.wrapped ? '🎁 Wrapped' : '📦 Original'} • {tile.price} ETH
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400">View →</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="collection-summary mt-4 p-3 bg-gray-800 rounded text-center">
            <p className="text-sm text-gray-400">
              Showing {filteredAndSortedTiles.length} of {tiles.length} tiles
            </p>
          </div>
        </div>
      </div>
    </>
  );
}