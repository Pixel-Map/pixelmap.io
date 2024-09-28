-- name: GetCurrentState :one
SELECT * FROM current_state
WHERE state = $1 LIMIT 1;

-- name: UpdateCurrentState :exec
INSERT INTO current_state (state, value)
VALUES ($1, $2)
ON CONFLICT (state) DO UPDATE
SET value = EXCLUDED.value;

-- name: InsertPixelMapTransaction :one
INSERT INTO pixel_map_transaction (
    block_number, time_stamp, hash, nonce, block_hash, transaction_index,
    "from", "to", value, gas, gas_price, is_error, txreceipt_status,
    input, contract_address, cumulative_gas_used, gas_used, confirmations
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
)
ON CONFLICT (hash, transaction_index) DO UPDATE SET
    block_number = EXCLUDED.block_number,
    time_stamp = EXCLUDED.time_stamp,
    -- Add other fields you want to update here
    confirmations = EXCLUDED.confirmations
RETURNING id;

-- name: GetLatestBlockNumber :one
SELECT COALESCE(MAX(block_number), 0) FROM pixel_map_transaction;

-- name: GetLastProcessedBlock :one
SELECT value::BIGINT FROM current_state 
WHERE state = 'INGESTION_LAST_ETHERSCAN_BLOCK';

-- name: UpdateLastProcessedBlock :exec
INSERT INTO current_state (state, value) 
VALUES ('INGESTION_LAST_ETHERSCAN_BLOCK', $1)
ON CONFLICT (state) DO UPDATE SET value = EXCLUDED.value;

-- name: InsertDataHistory :one
INSERT INTO data_histories (
    time_stamp, block_number, tx, log_index, image, price, url, updated_by, tile_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
)
ON CONFLICT (tile_id, tx) DO UPDATE SET
    time_stamp = EXCLUDED.time_stamp,
    block_number = EXCLUDED.block_number,
    log_index = EXCLUDED.log_index,
    image = EXCLUDED.image,
    price = EXCLUDED.price,
    url = EXCLUDED.url,
    updated_by = EXCLUDED.updated_by
RETURNING id;

-- name: GetDataHistoryByTileId :many
SELECT * FROM data_histories
WHERE tile_id = $1
ORDER BY time_stamp DESC;

-- name: GetLatestDataHistoryByTileId :one
SELECT * FROM data_histories
WHERE tile_id = $1
ORDER BY time_stamp DESC
LIMIT 1;

-- name: GetLatestTileImages :many
SELECT tile_id, image
FROM data_histories
WHERE (tile_id, block_number) IN (
    SELECT tile_id, MAX(block_number)
    FROM data_histories
    GROUP BY tile_id
);

-- name: GetDataHistoryByTx :one
SELECT * FROM data_histories
WHERE tx = $1 AND tile_id = $2
LIMIT 1;

-- name: DeleteDataHistory :exec
DELETE FROM data_histories
WHERE id = $1;

-- name: InsertTile :one
INSERT INTO tiles (id, image, price, url, owner, wrapped, ens, opensea_price)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id;

-- name: GetTileById :one
SELECT * FROM tiles
WHERE id = $1;

-- name: UpdateTile :exec
UPDATE tiles
SET image = $2, price = $3, url = $4, owner = $5, wrapped = $6, ens = $7, opensea_price = $8
WHERE id = $1;

-- name: ListTiles :many
SELECT * FROM tiles
ORDER BY id
LIMIT $1 OFFSET $2;

-- name: GetTilesByOwner :many
SELECT * FROM tiles
WHERE owner = $1
ORDER BY id;

-- name: UpdateTileOwner :exec
UPDATE tiles
SET owner = $2, ens = $3, wrapped = $4
WHERE id = $1;

-- name: UpdateTileENS :exec
UPDATE tiles
SET ens = $2
WHERE id = $1;

-- name: UpdateTileOpenSeaPrice :exec
UPDATE tiles
SET opensea_price = $2
WHERE id = $1;

-- name: GetWrappedTiles :many
SELECT * FROM tiles
WHERE wrapped = true
ORDER BY id;

-- name: GetLastProcessedDataHistoryID :one
INSERT INTO current_state (state, value)
VALUES ('LAST_PROCESSED_DATA_HISTORY_ID', '0')
ON CONFLICT (state) DO UPDATE
SET value = current_state.value
RETURNING COALESCE(CAST(value AS INTEGER), 0)::INT4;

-- name: GetUnprocessedDataHistory :many
SELECT * FROM data_histories
WHERE id > $1
ORDER BY id ASC;

-- name: UpdateLastProcessedDataHistoryID :exec
INSERT INTO current_state (state, value) 
VALUES ('LAST_PROCESSED_DATA_HISTORY_ID', $1::INT4)
ON CONFLICT (state) DO UPDATE
SET value = EXCLUDED.value;

-- name: InsertPurchaseHistory :one
INSERT INTO purchase_histories (
    tile_id,
    sold_by,
    purchased_by,
    price,
    tx,
    time_stamp,
    block_number,
    log_index
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING id;

-- name: GetPurchaseHistoryByTileId :many
SELECT * FROM purchase_histories
WHERE tile_id = $1
ORDER BY time_stamp DESC, log_index DESC;

-- name: GetLatestPurchaseHistoryByTileId :one
SELECT * FROM purchase_histories
WHERE tile_id = $1
ORDER BY time_stamp DESC, log_index DESC
LIMIT 1;

-- name: InsertWrappingHistory :one
INSERT INTO wrapping_histories (
    tile_id,
    wrapped,
    tx,
    time_stamp,
    block_number,
    updated_by,
    log_index
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
ON CONFLICT (tile_id, tx) DO UPDATE
SET
    wrapped = EXCLUDED.wrapped,
    time_stamp = EXCLUDED.time_stamp,
    block_number = EXCLUDED.block_number,
    updated_by = EXCLUDED.updated_by,
    log_index = EXCLUDED.log_index
RETURNING id;

-- name: InsertTransferHistory :one
INSERT INTO transfer_histories (
    tile_id,
    tx,
    time_stamp,
    block_number,
    transferred_from,
    transferred_to,
    log_index
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
ON CONFLICT (tile_id, tx) DO UPDATE SET
    time_stamp = EXCLUDED.time_stamp,
    block_number = EXCLUDED.block_number,
    transferred_from = EXCLUDED.transferred_from,
    transferred_to = EXCLUDED.transferred_to,
    log_index = EXCLUDED.log_index
RETURNING id;