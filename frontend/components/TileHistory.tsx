import React, { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import { PixelMapImage } from '@pixelmap/common/types/PixelMapImage';
import TileImage from './TileImage';
import TileImageComparison from './TileImageComparison';
import { formatPrice, shortenIfHex } from '../utils/misc';
import { generateMockTileHistory, shouldUseMockData } from '../utils/mockTileHistory';

interface TileHistoryProps {
  tile: PixelMapTile;
  historicalImages?: PixelMapImage[];
  purchaseHistory?: PurchaseEvent[];
  transferHistory?: TransferEvent[];
  dataHistory?: DataChangeEvent[];
}

interface PurchaseEvent {
  id: number;
  timestamp: Date;
  blockNumber: number;
  tx: string;
  soldBy: string;
  purchasedBy: string;
  price: string;
  soldByEns?: string;
  purchasedByEns?: string;
}

interface TransferEvent {
  id: number;
  timestamp: Date;
  blockNumber: number;
  tx: string;
  from: string;
  to: string;
  fromEns?: string;
  toEns?: string;
}

interface DataChangeEvent {
  id: number;
  timestamp: Date;
  blockNumber: number;
  tx: string;
  image?: string;
  url?: string;
  price?: string;
  updatedBy: string;
  updatedByEns?: string;
}

type HistoryEvent = {
  type: 'purchase' | 'transfer' | 'image' | 'url' | 'price' | 'genesis';
  timestamp: Date;
  blockNumber: number;
  tx: string;
  data: any;
};

export default function TileHistory({ 
  tile, 
  historicalImages = [], 
  purchaseHistory = [],
  transferHistory = [],
  dataHistory = []
}: TileHistoryProps) {
  // Check if tile has the new history data from backend
  const backendPurchaseHistory = (tile as any).purchase_history || [];
  const backendTransferHistory = (tile as any).transfer_history || [];
  const backendWrappingHistory = (tile as any).wrapping_history || [];
  const backendDataHistory = (tile as any).data_history || [];
  
  // Debug logging
  console.log('Tile data:', tile);
  console.log('Backend purchase history:', backendPurchaseHistory);
  console.log('Backend transfer history:', backendTransferHistory);
  console.log('Backend data history:', backendDataHistory);
  
  // Use backend data if available, otherwise use props
  const actualPurchaseHistory = backendPurchaseHistory.length > 0 ? 
    backendPurchaseHistory.map((p: any) => ({
      id: p.id,
      timestamp: new Date(p.timestamp),
      blockNumber: p.block_number,
      tx: p.tx,
      soldBy: p.sold_by,
      purchasedBy: p.purchased_by,
      price: p.price
    })) : purchaseHistory;
    
  const actualTransferHistory = backendTransferHistory.length > 0 ?
    backendTransferHistory.map((t: any) => ({
      id: t.id,
      timestamp: new Date(t.timestamp),
      blockNumber: t.block_number,
      tx: t.tx,
      from: t.transferred_from,
      to: t.transferred_to
    })) : transferHistory;
  const [viewMode, setViewMode] = useState<'timeline' | 'gallery' | 'stats'>('timeline');
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Memoize mock data so it doesn't regenerate on every render
  const mockData = useMemo(() => {
    if (shouldUseMockData() && actualPurchaseHistory.length === 0 && actualTransferHistory.length === 0 && dataHistory.length === 0) {
      return generateMockTileHistory(tile.id || 0, tile.owner);
    }
    return null;
  }, [tile.id, tile.owner, actualPurchaseHistory.length, actualTransferHistory.length, dataHistory.length]);

  useEffect(() => {
    const allEvents: HistoryEvent[] = [];
    
    // Use real data from backend, mock data, or passed props
    let finalPurchaseHistory = actualPurchaseHistory;
    let finalTransferHistory = actualTransferHistory;
    let finalDataHistory = backendDataHistory.length > 0 ? 
      backendDataHistory.map((d: any) => ({
        id: d.id,
        timestamp: new Date(d.timestamp),
        blockNumber: d.block_number,
        tx: d.tx,
        image: d.image || undefined,
        url: d.url || undefined,
        price: d.price || undefined,
        updatedBy: d.updated_by
      })) : dataHistory;
    
    if (mockData && actualPurchaseHistory.length === 0 && backendDataHistory.length === 0) {
      finalPurchaseHistory = mockData.purchases;
      finalTransferHistory = mockData.transfers;
      finalDataHistory = mockData.changes;
      setIsUsingMockData(true);
    } else {
      setIsUsingMockData(false);
    }

    // Add genesis event
    allEvents.push({
      type: 'genesis',
      timestamp: new Date('2016-11-17'), // PixelMap launch date
      blockNumber: 2624959, // Genesis block
      tx: '0x0',
      data: { message: 'PixelMap Genesis - Tile Created' }
    });

    // Add purchase events
    finalPurchaseHistory.forEach(p => {
      allEvents.push({
        type: 'purchase',
        timestamp: p.timestamp,
        blockNumber: p.blockNumber,
        tx: p.tx,
        data: p
      });
    });

    // Add transfer events  
    finalTransferHistory.forEach(t => {
      // Check if it's a wrap/unwrap event
      const isWrap = t.to === '0x2A46f3e77E2d9BFF52b83B7aDD41081Ab2c6Aaac' || t.wrapped === true;
      const isUnwrap = t.from === '0x2A46f3e77E2d9BFF52b83B7aDD41081Ab2c6Aaac' || t.wrapped === false;
      
      allEvents.push({
        type: 'transfer',
        timestamp: t.timestamp,
        blockNumber: t.blockNumber,
        tx: t.tx,
        data: {
          ...t,
          transferType: isWrap ? 'Wrapped to ERC721' : isUnwrap ? 'Unwrapped from ERC721' : 'Transferred'
        }
      });
    });
    
    // Add wrapping events from backend
    if (backendWrappingHistory.length > 0) {
      backendWrappingHistory.forEach((w: any) => {
        allEvents.push({
          type: 'transfer',
          timestamp: new Date(w.timestamp),
          blockNumber: w.block_number,
          tx: w.tx,
          data: {
            transferType: w.wrapped ? 'Wrapped to ERC721' : 'Unwrapped from ERC721',
            from: w.wrapped ? w.updated_by : '0x2A46f3e77E2d9BFF52b83B7aDD41081Ab2c6Aaac',
            to: w.wrapped ? '0x2A46f3e77E2d9BFF52b83B7aDD41081Ab2c6Aaac' : w.updated_by
          }
        });
      });
    }

    // Add data change events
    finalDataHistory.forEach(d => {
      if (d.image) {
        allEvents.push({
          type: 'image',
          timestamp: d.timestamp,
          blockNumber: d.blockNumber,
          tx: d.tx,
          data: d
        });
      }
      if (d.url) {
        allEvents.push({
          type: 'url',
          timestamp: d.timestamp,
          blockNumber: d.blockNumber,
          tx: d.tx,
          data: d
        });
      }
      if (d.price) {
        allEvents.push({
          type: 'price',
          timestamp: d.timestamp,
          blockNumber: d.blockNumber,
          tx: d.tx,
          data: d
        });
      }
    });

    // Sort by timestamp descending (newest first)
    allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setEvents(allEvents);
  }, [mockData, actualPurchaseHistory, actualTransferHistory, dataHistory, backendWrappingHistory, backendDataHistory]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '💰';
      case 'transfer': return '🔄';
      case 'image': return '🎨';
      case 'url': return '🔗';
      case 'price': return '💵';
      case 'genesis': return '⚡';
      default: return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-green-100 border-green-400';
      case 'transfer': return 'bg-blue-100 border-blue-400';
      case 'image': return 'bg-purple-100 border-purple-400';
      case 'url': return 'bg-yellow-100 border-yellow-400';
      case 'price': return 'bg-orange-100 border-orange-400';
      case 'genesis': return 'bg-gray-100 border-gray-400';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  const formatEthPrice = (price: string) => {
    try {
      // Check if price is already in ETH (has decimal point and is small)
      const numPrice = parseFloat(price);
      if (price.includes('.') || numPrice < 1000) {
        // Already in ETH
        return `${numPrice.toFixed(4)} ETH`;
      } else {
        // In Wei, convert to ETH
        const eth = numPrice / 1e18;
        return `${eth.toFixed(4)} ETH`;
      }
    } catch {
      return price;
    }
  };

  const calculateStats = () => {
    const totalChanges = historicalImages?.length || 0;
    const totalSales = actualPurchaseHistory?.length || 0;
    const totalTransfers = (actualTransferHistory?.length || 0) + (backendWrappingHistory?.length || 0);
    
    let highestPrice = 0;
    let lowestPrice = Infinity;
    let totalVolume = 0;
    
    if (actualPurchaseHistory && actualPurchaseHistory.length > 0) {
      actualPurchaseHistory.forEach(p => {
        // Handle price whether it's in ETH or Wei
        let price = parseFloat(p.price);
        if (p.price.includes('.') || price < 1000) {
          // Already in ETH, use as is
        } else {
          // In Wei, convert to ETH
          price = price / 1e18;
        }
        if (price > highestPrice) highestPrice = price;
        if (price < lowestPrice) lowestPrice = price;
        totalVolume += price;
      });
    }

    const firstOwner = actualPurchaseHistory?.[actualPurchaseHistory.length - 1]?.purchasedBy || tile.owner;
    const holdDuration = tile.owner === firstOwner ? 
      formatDistanceToNow(new Date('2016-11-17')) : 
      'Multiple Owners';

    return {
      totalChanges,
      totalSales,
      totalTransfers,
      highestPrice: highestPrice === 0 ? 'N/A' : `${highestPrice.toFixed(2)} ETH`,
      lowestPrice: lowestPrice === Infinity ? 'N/A' : `${lowestPrice.toFixed(2)} ETH`,
      totalVolume: `${totalVolume.toFixed(2)} ETH`,
      holdDuration,
      uniqueOwners: new Set([...(actualPurchaseHistory?.map(p => p.purchasedBy) || []), tile.owner]).size
    };
  };

  const stats = calculateStats();

  return (
    <div className="w-full nes-container is-dark with-title">
      <p className="title">Tile #{tile.id} History</p>
      
      {/* Wrapped/Unwrapped Status */}
      <div className="mb-4">
        {tile.wrapped ? (
          <div className="nes-container is-success is-rounded inline-block">
            <p className="text-sm font-bold">
              🎁 WRAPPED - ERC721 Token
            </p>
          </div>
        ) : (
          <div className="nes-container is-warning is-rounded inline-block">
            <p className="text-sm font-bold">
              📦 UNWRAPPED - Original PixelMap Format
            </p>
          </div>
        )}
      </div>
      
      {isUsingMockData && (
        <div className="mb-4 p-3 nes-container is-rounded is-dark" style={{backgroundColor: '#4a4a00'}}>
          <p className="text-sm text-yellow-300">
            📊 <strong>Demo Mode:</strong> Showing sample history data. Real blockchain data will be available when backend APIs are connected.
          </p>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`nes-btn ${viewMode === 'timeline' ? 'is-primary' : ''}`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`nes-btn ${viewMode === 'gallery' ? 'is-primary' : ''}`}
          >
            Gallery
          </button>
          <button
            type="button"
            onClick={() => setViewMode('stats')}
            className={`nes-btn ${viewMode === 'stats' ? 'is-primary' : ''}`}
          >
            Stats
          </button>
        </div>
      </div>

      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-600" style={{imageRendering: 'pixelated'}}></div>
            
            {events.map((event, index) => (
              <div key={index} className="relative flex items-start mb-8">
                <div className="absolute left-5 w-7 h-7 flex items-center justify-center bg-black border-2 border-white z-10">
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                </div>
                
                <div className={`ml-16 flex-1 nes-container is-rounded ${event.type === 'genesis' ? 'is-dark' : ''} cursor-pointer`}
                     style={{
                       backgroundColor: event.type === 'purchase' ? '#1a3a1a' : 
                                       event.type === 'transfer' ? '#1a1a3a' :
                                       event.type === 'image' ? '#2a1a3a' :
                                       event.type === 'url' ? '#3a3a1a' :
                                       event.type === 'price' ? '#3a2a1a' :
                                       '#2a2a2a'
                     }}
                     onClick={() => setExpandedEvent(expandedEvent === index ? null : index)}>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-white" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>
                        {event.type === 'purchase' && `Purchased for ${formatEthPrice(event.data.price)}`}
                        {event.type === 'transfer' && (event.data.transferType || 'Transferred')}
                        {event.type === 'image' && 'Image Updated'}
                        {event.type === 'url' && 'URL Changed'}
                        {event.type === 'price' && 'Price Updated'}
                        {event.type === 'genesis' && '⚡ GENESIS - Tile Created'}
                      </h3>
                      
                      <p className="text-sm text-gray-400 mt-1">
                        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        {' • '}
                        Block #{event.blockNumber.toLocaleString()}
                      </p>

                      {expandedEvent === index && (
                        <div className="mt-4 space-y-2 text-sm text-gray-300">
                          {event.type === 'purchase' && (
                            <>
                              <p className="text-green-400"><strong>From:</strong> <span className="font-mono text-xs text-gray-300">{event.data.soldByEns || event.data.soldBy}</span></p>
                              <p className="text-green-400"><strong>To:</strong> <span className="font-mono text-xs text-gray-300">{event.data.purchasedByEns || event.data.purchasedBy}</span></p>
                              <p className="text-green-400"><strong>Price:</strong> <span className="text-yellow-400">{formatEthPrice(event.data.price)}</span></p>
                            </>
                          )}
                          
                          {event.type === 'transfer' && (
                            <>
                              <p className="text-cyan-400"><strong>From:</strong> <span className="font-mono text-xs text-gray-300">{event.data.fromEns || event.data.from}</span></p>
                              <p className="text-cyan-400"><strong>To:</strong> <span className="font-mono text-xs text-gray-300">{event.data.toEns || event.data.to}</span></p>
                            </>
                          )}
                          
                          {event.type === 'image' && event.data.image && (
                            <>
                              <p className="text-purple-400"><strong>Updated by:</strong> <span className="font-mono text-xs text-gray-300">{event.data.updatedByEns || event.data.updatedBy}</span></p>
                              <div className="flex space-x-4 mt-3">
                                <div>
                                  <p className="mb-2 text-purple-400"><strong>New Image:</strong></p>
                                  <TileImage image={event.data.image} className="w-32 h-32 border-2 border-white img-pixel" />
                                </div>
                              </div>
                            </>
                          )}
                          
                          {event.type === 'url' && (
                            <>
                              <p className="text-yellow-400"><strong>Updated by:</strong> <span className="font-mono text-xs text-gray-300">{event.data.updatedByEns || event.data.updatedBy}</span></p>
                              <p className="text-yellow-400"><strong>New URL:</strong> <a href={event.data.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300">{event.data.url}</a></p>
                            </>
                          )}
                          
                          {event.type === 'price' && (
                            <>
                              <p className="text-orange-400"><strong>Updated by:</strong> <span className="font-mono text-xs text-gray-300">{event.data.updatedByEns || event.data.updatedBy}</span></p>
                              <p className="text-orange-400"><strong>New Price:</strong> <span className="text-yellow-400">{formatEthPrice(event.data.price)}</span></p>
                            </>
                          )}
                          
                          <p className="mt-3 pt-2 border-t border-gray-700">
                            <a 
                              href={`https://etherscan.io/tx/${event.tx}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 text-xs font-mono"
                            >
                              → View on Etherscan
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {event.type === 'image' && (
                      <div className="ml-4">
                        <TileImage image={event.data.image} className="w-16 h-16 border-2 border-white img-pixel" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'gallery' && (
        historicalImages && historicalImages.length > 0 ? (
          <TileImageComparison 
            images={historicalImages} 
            currentImage={tile.image}
          />
        ) : (
          <div className="nes-container is-dark is-rounded text-center py-8">
            <p className="text-gray-400 mb-4">📷 No historical images available for this tile</p>
            <p className="text-sm text-gray-500">Image history will appear here once the tile&apos;s image is updated</p>
          </div>
        )
      )}

      {viewMode === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="nes-container is-dark is-rounded">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Image Changes</p>
                <p className="text-3xl font-bold text-cyan-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{stats.totalChanges}</p>
              </div>
              <span className="text-2xl">🎨</span>
            </div>
          </div>
          
          <div className="nes-container is-dark is-rounded">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Sales</p>
                <p className="text-3xl font-bold text-green-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{stats.totalSales}</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </div>
          
          <div className="nes-container is-dark is-rounded">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Unique Owners</p>
                <p className="text-3xl font-bold text-purple-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{stats.uniqueOwners}</p>
              </div>
              <span className="text-2xl">👥</span>
            </div>
          </div>
          
          <div className="nes-container is-dark is-rounded">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Highest Sale</p>
                <p className="text-2xl font-bold text-yellow-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{stats.highestPrice}</p>
              </div>
              <span className="text-2xl">📈</span>
            </div>
          </div>
          
          <div className="nes-container is-dark is-rounded">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Volume</p>
                <p className="text-2xl font-bold text-red-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{stats.totalVolume}</p>
              </div>
              <span className="text-2xl">💎</span>
            </div>
          </div>
          
          <div className="nes-container is-dark is-rounded">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Hold Duration</p>
                <p className="text-xl font-bold text-indigo-400" style={{fontFamily: 'vcr_osd_monoregular, monospace'}}>{stats.holdDuration}</p>
              </div>
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}