// Mock data generator for development - replace with real API calls when backend is ready

export interface PurchaseEvent {
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

export interface TransferEvent {
  id: number;
  timestamp: Date;
  blockNumber: number;
  tx: string;
  from: string;
  to: string;
  fromEns?: string;
  toEns?: string;
  wrapped?: boolean;
}

export interface DataChangeEvent {
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

const sampleAddresses = [
  { address: '0x1234567890123456789012345678901234567890', ens: 'vitalik.eth' },
  { address: '0x2345678901234567890123456789012345678901', ens: 'punk6529.eth' },
  { address: '0x3456789012345678901234567890123456789012', ens: null },
  { address: '0x4567890123456789012345678901234567890123', ens: 'pixelcollector.eth' },
  { address: '0x5678901234567890123456789012345678901234', ens: null },
];

const sampleImages = [
  'FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0FF0',
  '00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F',
  'F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00F00',
];

// Seeded random number generator for consistent mock data
function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateMockTileHistory(tileId: number, currentOwner?: string) {
  const purchases: PurchaseEvent[] = [];
  const transfers: TransferEvent[] = [];
  const changes: DataChangeEvent[] = [];
  
  // Use tileId as seed for consistent randomness per tile
  let seed = tileId || 1;
  const getRandom = () => {
    seed += 1;
    return seededRandom(seed);
  };
  
  // Start from genesis
  let currentBlock = 2624959; // PixelMap genesis block
  let currentDate = new Date('2016-11-17');
  
  // Initial purchase (minting)
  const firstBuyer = sampleAddresses[0];
  purchases.push({
    id: 1,
    timestamp: new Date(currentDate),
    blockNumber: currentBlock,
    tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
    soldBy: '0x0000000000000000000000000000000000000000',
    purchasedBy: firstBuyer.address,
    price: '2000000000000000000', // 2 ETH in wei
    purchasedByEns: firstBuyer.ens || undefined,
  });
  
  // Generate 3-8 random events over the years
  const numEvents = 3 + Math.floor(getRandom() * 6);
  let lastOwner = firstBuyer;
  let isWrapped = false;
  
  for (let i = 0; i < numEvents; i++) {
    // Advance time randomly (30-365 days)
    const daysToAdd = 30 + Math.floor(getRandom() * 335);
    currentDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    currentBlock += daysToAdd * 6400; // ~6400 blocks per day
    
    // Random event type
    const eventType = getRandom();
    
    if (eventType < 0.3 && !isWrapped) {
      // Wrap event
      transfers.push({
        id: transfers.length + 1,
        timestamp: new Date(currentDate),
        blockNumber: currentBlock,
        tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
        from: lastOwner.address,
        to: '0x2A46f3e77E2d9BFF52b83B7aDD41081Ab2c6Aaac', // Wrapper contract
        fromEns: lastOwner.ens || undefined,
        wrapped: true,
      });
      isWrapped = true;
      
    } else if (eventType < 0.5) {
      // Sale event
      const newOwner = sampleAddresses[Math.floor(getRandom() * sampleAddresses.length)];
      const price = (2 + getRandom() * 8) * 1e18; // 2-10 ETH
      
      purchases.push({
        id: purchases.length + 1,
        timestamp: new Date(currentDate),
        blockNumber: currentBlock,
        tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
        soldBy: lastOwner.address,
        purchasedBy: newOwner.address,
        price: price.toString(),
        soldByEns: lastOwner.ens || undefined,
        purchasedByEns: newOwner.ens || undefined,
      });
      
      // If wrapped, also create transfer event
      if (isWrapped) {
        transfers.push({
          id: transfers.length + 1,
          timestamp: new Date(currentDate),
          blockNumber: currentBlock,
          tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
          from: lastOwner.address,
          to: newOwner.address,
          fromEns: lastOwner.ens || undefined,
          toEns: newOwner.ens || undefined,
        });
      }
      
      lastOwner = newOwner;
      
    } else if (eventType < 0.7) {
      // Image change
      const newImage = sampleImages[Math.floor(getRandom() * sampleImages.length)];
      changes.push({
        id: changes.length + 1,
        timestamp: new Date(currentDate),
        blockNumber: currentBlock,
        tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
        image: newImage,
        updatedBy: lastOwner.address,
        updatedByEns: lastOwner.ens || undefined,
      });
      
    } else if (eventType < 0.85) {
      // URL change
      changes.push({
        id: changes.length + 1,
        timestamp: new Date(currentDate),
        blockNumber: currentBlock,
        tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
        url: `https://example${Math.floor(getRandom() * 100)}.com`,
        updatedBy: lastOwner.address,
        updatedByEns: lastOwner.ens || undefined,
      });
      
    } else {
      // Price change
      const newPrice = (1 + getRandom() * 20) * 1e18; // 1-20 ETH
      changes.push({
        id: changes.length + 1,
        timestamp: new Date(currentDate),
        blockNumber: currentBlock,
        tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
        price: newPrice.toString(),
        updatedBy: lastOwner.address,
        updatedByEns: lastOwner.ens || undefined,
      });
    }
  }
  
  // Add recent unwrap if currently wrapped
  if (isWrapped && getRandom() > 0.5) {
    currentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    currentBlock = 18500000 + Math.floor(getRandom() * 100000);
    
    transfers.push({
      id: transfers.length + 1,
      timestamp: currentDate,
      blockNumber: currentBlock,
      tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
      from: '0x2A46f3e77E2d9BFF52b83B7aDD41081Ab2c6Aaac', // Wrapper contract
      to: lastOwner.address,
      toEns: lastOwner.ens || undefined,
      wrapped: false,
    });
    isWrapped = false;
  }
  
  // Add a very recent image change
  const recentDate = new Date(Date.now() - Math.floor(getRandom() * 7) * 24 * 60 * 60 * 1000);
  changes.push({
    id: changes.length + 1,
    timestamp: recentDate,
    blockNumber: 18600000 + Math.floor(getRandom() * 10000),
    tx: `0x${Math.floor(getRandom() * 1e16).toString(16).padStart(64, '0')}`,
    image: sampleImages[Math.floor(getRandom() * sampleImages.length)],
    updatedBy: lastOwner.address,
    updatedByEns: lastOwner.ens || undefined,
  });
  
  return {
    purchases,
    transfers,
    changes,
  };
}

// Helper to check if we should use mock data (development mode)
export function shouldUseMockData(): boolean {
  // Only use mock data if explicitly enabled
  // We're disabling it by default now that backend data is available
  return process.env.NEXT_PUBLIC_USE_MOCK_HISTORY === 'true';
}