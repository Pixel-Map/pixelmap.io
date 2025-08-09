export interface TileHistoryData {
  purchaseHistory: PurchaseEvent[];
  transferHistory: TransferEvent[];
  dataHistory: DataChangeEvent[];
  priceHistory: PricePoint[];
  ownershipTimeline: OwnershipPeriod[];
}

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
  ethPriceUSD?: number;
  salePriceUSD?: number;
  gasUsed?: string;
  gasPriceGwei?: number;
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
  transferType: 'wrap' | 'unwrap' | 'transfer' | 'gift';
}

export interface DataChangeEvent {
  id: number;
  timestamp: Date;
  blockNumber: number;
  tx: string;
  changeType: 'image' | 'url' | 'price' | 'multiple';
  previousImage?: string;
  newImage?: string;
  previousUrl?: string;
  newUrl?: string;
  previousPrice?: string;
  newPrice?: string;
  updatedBy: string;
  updatedByEns?: string;
}

export interface PricePoint {
  timestamp: Date;
  blockNumber: number;
  price: string;
  ethPriceUSD?: number;
  priceUSD?: number;
}

export interface OwnershipPeriod {
  owner: string;
  ownerEns?: string;
  startDate: Date;
  endDate?: Date;
  startBlock: number;
  endBlock?: number;
  durationDays: number;
  acquisitionPrice?: string;
  salePrice?: string;
  profitLoss?: string;
  profitLossPercent?: number;
  changesMade: number;
}

export interface TileStats {
  totalOwners: number;
  totalSales: number;
  totalTransfers: number;
  totalImageChanges: number;
  totalUrlChanges: number;
  totalPriceChanges: number;
  highestSalePrice: string;
  lowestSalePrice: string;
  averageSalePrice: string;
  totalVolume: string;
  averageHoldTime: number;
  longestHoldTime: number;
  shortestHoldTime: number;
  mostActiveOwner: string;
  firstOwner: string;
  firstPurchaseDate: Date;
  lastActivityDate: Date;
  daysSinceLastActivity: number;
  isOriginalOwner: boolean;
  hasNeverBeenSold: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export async function fetchTileHistory(tileId: number): Promise<TileHistoryData | null> {
  try {
    const response = await fetch(`/api/tile/${tileId}/history`);
    if (!response.ok) {
      console.error('Failed to fetch tile history');
      return null;
    }
    const data = await response.json();
    
    return {
      purchaseHistory: data.purchases || [],
      transferHistory: data.transfers || [],
      dataHistory: data.changes || [],
      priceHistory: data.prices || [],
      ownershipTimeline: data.ownership || []
    };
  } catch (error) {
    console.error('Error fetching tile history:', error);
    return null;
  }
}

export function calculateTileStats(
  history: TileHistoryData,
  currentOwner: string,
  currentPrice: string
): TileStats {
  const uniqueOwners = new Set<string>();
  const ownerChanges: Map<string, number> = new Map();
  
  history.purchaseHistory.forEach(p => {
    uniqueOwners.add(p.purchasedBy);
    uniqueOwners.add(p.soldBy);
  });
  
  history.dataHistory.forEach(d => {
    const count = ownerChanges.get(d.updatedBy) || 0;
    ownerChanges.set(d.updatedBy, count + 1);
  });
  
  const mostActiveOwner = Array.from(ownerChanges.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || currentOwner;
  
  const prices = history.purchaseHistory.map(p => parseFloat(p.price));
  const highestPrice = Math.max(...prices, 0);
  const lowestPrice = Math.min(...prices, Infinity);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const totalVolume = prices.reduce((a, b) => a + b, 0);
  
  const holdTimes = history.ownershipTimeline.map(o => o.durationDays);
  const avgHoldTime = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;
  const longestHold = Math.max(...holdTimes, 0);
  const shortestHold = Math.min(...holdTimes, Infinity);
  
  const imageChanges = history.dataHistory.filter(d => d.changeType === 'image').length;
  const urlChanges = history.dataHistory.filter(d => d.changeType === 'url').length;
  const priceChanges = history.dataHistory.filter(d => d.changeType === 'price').length;
  
  const firstOwner = history.purchaseHistory[history.purchaseHistory.length - 1]?.purchasedBy || currentOwner;
  const firstPurchase = history.purchaseHistory[history.purchaseHistory.length - 1]?.timestamp || new Date('2016-11-17');
  
  const lastActivity = new Date(Math.max(
    ...history.purchaseHistory.map(p => p.timestamp.getTime()),
    ...history.dataHistory.map(d => d.timestamp.getTime()),
    0
  ));
  
  const daysSinceLastActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  let rarity: 'common' | 'uncommon' | 'rare' | 'legendary' = 'common';
  if (history.purchaseHistory.length === 0) rarity = 'legendary';
  else if (history.purchaseHistory.length === 1) rarity = 'rare';
  else if (history.purchaseHistory.length <= 3) rarity = 'uncommon';
  
  return {
    totalOwners: uniqueOwners.size,
    totalSales: history.purchaseHistory.length,
    totalTransfers: history.transferHistory.length,
    totalImageChanges: imageChanges,
    totalUrlChanges: urlChanges,
    totalPriceChanges: priceChanges,
    highestSalePrice: highestPrice.toString(),
    lowestSalePrice: lowestPrice === Infinity ? '0' : lowestPrice.toString(),
    averageSalePrice: avgPrice.toString(),
    totalVolume: totalVolume.toString(),
    averageHoldTime: avgHoldTime,
    longestHoldTime: longestHold,
    shortestHoldTime: shortestHold === Infinity ? 0 : shortestHold,
    mostActiveOwner,
    firstOwner,
    firstPurchaseDate: firstPurchase,
    lastActivityDate: lastActivity,
    daysSinceLastActivity,
    isOriginalOwner: currentOwner === firstOwner,
    hasNeverBeenSold: history.purchaseHistory.length === 0,
    rarity
  };
}

export function formatHistoricalPrice(
  weiPrice: string,
  ethPriceUSD?: number
): { eth: string; usd?: string } {
  const eth = parseFloat(weiPrice) / 1e18;
  const result: { eth: string; usd?: string } = {
    eth: `${eth.toFixed(4)} ETH`
  };
  
  if (ethPriceUSD) {
    result.usd = `$${(eth * ethPriceUSD).toFixed(2)}`;
  }
  
  return result;
}

export function groupEventsByDate(events: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>();
  
  events.forEach(event => {
    const date = new Date(event.timestamp).toLocaleDateString();
    const existing = grouped.get(date) || [];
    existing.push(event);
    grouped.set(date, existing);
  });
  
  return grouped;
}

export function detectPatterns(history: TileHistoryData): string[] {
  const patterns: string[] = [];
  
  if (history.purchaseHistory.length === 0) {
    patterns.push('Never Sold - Original Owner');
  }
  
  if (history.purchaseHistory.length > 10) {
    patterns.push('High Trading Activity');
  }
  
  const recentActivity = history.dataHistory.filter(d => {
    const daysSince = (Date.now() - d.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 30;
  });
  
  if (recentActivity.length > 5) {
    patterns.push('Recently Active');
  }
  
  const priceIncreases = history.priceHistory.filter((p, i) => {
    if (i === 0) return false;
    return parseFloat(p.price) > parseFloat(history.priceHistory[i - 1].price);
  });
  
  if (priceIncreases.length > history.priceHistory.length / 2) {
    patterns.push('Price Appreciation Trend');
  }
  
  return patterns;
}