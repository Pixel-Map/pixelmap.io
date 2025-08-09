# Backend API Requirements for Tile History

## Overview
The frontend tile history feature is complete and currently uses mock data in development. To display real blockchain data, the following API endpoints need to be implemented in the backend.

## Required API Endpoints

### 1. GET `/api/tile/{id}/history`
Returns complete history for a specific tile.

**Response Structure:**
```json
{
  "tile_id": 1234,
  "purchases": [...],
  "transfers": [...],
  "changes": [...],
  "wrapped_events": [...]
}
```

### 2. GET `/api/tile/{id}/purchases`
Returns all purchase/sale events for a tile.

**Response Structure:**
```json
{
  "purchases": [
    {
      "id": 1,
      "timestamp": "2023-01-15T10:30:00Z",
      "block_number": 16400000,
      "tx": "0xabc123...",
      "log_index": 45,
      "sold_by": "0x1234...",
      "sold_by_ens": "seller.eth",
      "purchased_by": "0x5678...",
      "purchased_by_ens": "buyer.eth",
      "price": "5000000000000000000", // Wei
      "eth_price_usd": 1500.50, // ETH price at time of sale
      "sale_price_usd": 7502.50
    }
  ]
}
```

### 3. GET `/api/tile/{id}/transfers`
Returns all transfer events (including wrapping/unwrapping).

**Response Structure:**
```json
{
  "transfers": [
    {
      "id": 1,
      "timestamp": "2023-01-15T10:30:00Z",
      "block_number": 16400000,
      "tx": "0xabc123...",
      "log_index": 45,
      "from": "0x1234...",
      "from_ens": "sender.eth",
      "to": "0x5678...",
      "to_ens": "receiver.eth",
      "transfer_type": "transfer", // "wrap", "unwrap", "transfer", "gift"
      "is_wrapper_contract": false
    }
  ]
}
```

### 4. GET `/api/tile/{id}/changes`
Returns all data changes (image, URL, price updates).

**Response Structure:**
```json
{
  "changes": [
    {
      "id": 1,
      "timestamp": "2023-01-15T10:30:00Z",
      "block_number": 16400000,
      "tx": "0xabc123...",
      "log_index": 45,
      "change_type": "image", // "image", "url", "price", "multiple"
      "previous_image": "FF0FF0...", // If image change
      "new_image": "00F00F...",
      "previous_url": "https://old.com", // If URL change
      "new_url": "https://new.com",
      "previous_price": "1000000000000000000", // If price change
      "new_price": "2000000000000000000",
      "updated_by": "0x1234...",
      "updated_by_ens": "updater.eth"
    }
  ]
}
```

### 5. GET `/api/tile/{id}/wrapping`
Returns wrapping/unwrapping history.

**Response Structure:**
```json
{
  "wrapping_events": [
    {
      "id": 1,
      "timestamp": "2023-01-15T10:30:00Z",
      "block_number": 16400000,
      "tx": "0xabc123...",
      "log_index": 45,
      "wrapped": true, // true for wrap, false for unwrap
      "updated_by": "0x1234...",
      "updated_by_ens": "wrapper.eth"
    }
  ]
}
```

## Database Tables Already Available

The backend already has these tables that can be queried:

1. **purchase_histories**
   - tile_id, sold_by, purchased_by, price, tx, timestamp, block_number, log_index

2. **transfer_histories**
   - tile_id, transferred_from, transferred_to, tx, timestamp, block_number, log_index

3. **data_histories**
   - tile_id, image, url, price, updated_by, tx, timestamp, block_number, log_index

4. **wrapping_histories**
   - tile_id, wrapped, updated_by, tx, timestamp, block_number, log_index

## Implementation Notes

### SQL Queries Needed

Example for purchase history:
```sql
SELECT 
  ph.*,
  ens_from.name as sold_by_ens,
  ens_to.name as purchased_by_ens
FROM purchase_histories ph
LEFT JOIN ens_lookup ens_from ON ph.sold_by = ens_from.address
LEFT JOIN ens_lookup ens_to ON ph.purchased_by = ens_to.address
WHERE ph.tile_id = $1
ORDER BY ph.timestamp DESC, ph.log_index DESC;
```

### Wrapper Contract Detection
The PixelMap wrapper contract address is: `0x2A46f3e77E2d9BFF52b83B7aDD41081Ab2c6Aaac`

When detecting wrap/unwrap events:
- **Wrap**: transfer TO the wrapper contract
- **Unwrap**: transfer FROM the wrapper contract

### ENS Resolution
ENS names should be resolved and cached for better UX. Consider implementing a batch ENS resolver to handle multiple addresses efficiently.

### Historical ETH Prices
Consider integrating with a price oracle API (like CoinGecko or Chainlink) to get historical ETH prices for showing USD values at the time of transactions.

## Frontend Integration

The frontend is already set up to consume these endpoints. Once implemented, update:

1. Remove mock data usage by setting `NEXT_PUBLIC_USE_MOCK_HISTORY=false`
2. Update `fetchTileHistory` in `utils/tileHistory.ts` to call the real endpoints
3. The TileHistory component will automatically use the real data

## Priority

High priority endpoints (implement first):
1. `/api/tile/{id}/purchases` - Most important for users
2. `/api/tile/{id}/changes` - Shows tile evolution
3. `/api/tile/{id}/transfers` - Shows ownership changes

Medium priority:
4. `/api/tile/{id}/wrapping` - Important for NFT traders
5. `/api/tile/{id}/history` - Convenience endpoint combining all data

## Testing

Test with known active tiles:
- Tile #1826 - Likely has multiple sales
- Tile #1984 - Popular tile
- Tile #0 - Corner tile, likely valuable

## Performance Considerations

1. Add database indexes on tile_id for all history tables
2. Consider caching frequently accessed tile histories
3. Implement pagination for tiles with extensive history
4. Use database views for complex joins

## Example Backend Route (Go/Gin)

```go
func GetTilePurchaseHistory(c *gin.Context) {
    tileID := c.Param("id")
    
    purchases, err := db.GetPurchaseHistoryByTileId(ctx, tileID)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    // Add ENS resolution
    for i, purchase := range purchases {
        purchases[i].SoldByEns = ensResolver.Resolve(purchase.SoldBy)
        purchases[i].PurchasedByEns = ensResolver.Resolve(purchase.PurchasedBy)
    }
    
    c.JSON(200, gin.H{"purchases": purchases})
}
```