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