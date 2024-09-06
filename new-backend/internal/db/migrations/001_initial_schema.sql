-- 001_initial_schema.sql

CREATE TYPE state_to_track AS ENUM (
    'INGESTION_LAST_PROCESSED_PIXEL_MAP_TX',
    'INGESTION_LAST_ETHERSCAN_BLOCK',
    'NOTIFICATIONS_LAST_PROCESSED_TILE_CHANGE',
    'RENDERER_LAST_PROCESSED_DATA_CHANGE'
);

CREATE TABLE current_states (
    state state_to_track PRIMARY KEY,
    value BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE tiles (
    id SERIAL PRIMARY KEY,
    image VARCHAR(800) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    url TEXT NOT NULL,
    owner VARCHAR(42) NOT NULL,
    wrapped BOOLEAN NOT NULL,
    ens VARCHAR(255) NOT NULL DEFAULT '',
    opensea_price DECIMAL(10, 2) NOT NULL DEFAULT 0.0
);

CREATE TABLE data_histories (
    id SERIAL PRIMARY KEY,
    time_stamp TIMESTAMP NOT NULL,
    block_number BIGINT NOT NULL,
    tx VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    image VARCHAR(800) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    url TEXT NOT NULL,
    updated_by VARCHAR(42) NOT NULL,
    tile_id INTEGER NOT NULL REFERENCES tiles(id),
    UNIQUE(tile_id, tx)
);

CREATE TABLE pixel_map_transactions (
    id SERIAL PRIMARY KEY,
    block_number BIGINT NOT NULL,
    time_stamp TIMESTAMP NOT NULL,
    hash VARCHAR(66) NOT NULL,
    nonce BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    transaction_index INTEGER NOT NULL,
    "from" VARCHAR(42) NOT NULL,
    "to" VARCHAR(42) NOT NULL,
    value NUMERIC(78, 0) NOT NULL,
    gas BIGINT NOT NULL,
    gas_price BIGINT NOT NULL,
    is_error BOOLEAN NOT NULL,
    txreceipt_status BOOLEAN,
    input TEXT NOT NULL,
    contract_address VARCHAR(42),
    cumulative_gas_used BIGINT NOT NULL,
    gas_used BIGINT NOT NULL,
    confirmations BIGINT NOT NULL,
    UNIQUE(hash, transaction_index)
);

CREATE TABLE purchase_histories (
    id SERIAL PRIMARY KEY,
    time_stamp TIMESTAMP NOT NULL,
    block_number BIGINT NOT NULL,
    tx VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    sold_by VARCHAR(42) NOT NULL,
    purchased_by VARCHAR(42) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    tile_id INTEGER NOT NULL REFERENCES tiles(id),
    UNIQUE(tile_id, tx, log_index)
);

CREATE TABLE transfer_histories (
    id SERIAL PRIMARY KEY,
    time_stamp TIMESTAMP NOT NULL,
    block_number BIGINT NOT NULL,
    tx VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    transferred_from VARCHAR(42) NOT NULL,
    transferred_to VARCHAR(42) NOT NULL,
    tile_id INTEGER NOT NULL REFERENCES tiles(id),
    UNIQUE(tile_id, tx)
);

CREATE TABLE wrapping_histories (
    id SERIAL PRIMARY KEY,
    time_stamp TIMESTAMP NOT NULL,
    block_number BIGINT NOT NULL,
    tx VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    wrapped BOOLEAN NOT NULL,
    updated_by VARCHAR(42) NOT NULL,
    tile_id INTEGER NOT NULL REFERENCES tiles(id),
    UNIQUE(tile_id, tx)
);