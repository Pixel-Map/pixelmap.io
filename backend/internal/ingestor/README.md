# Ingestor Package Testing Guide

The ingestor package is responsible for fetching blockchain data from Etherscan, processing transactions, and updating the database with tile ownership, image data, and other changes.

## Current Test Status

The current test suite provides basic tests for:
- PubSub event handling
- Signal mechanism for rendering

Many of the core ingestor functions are currently marked as "requires refactoring to make it more testable" as they have dependencies that are difficult to mock properly.

## Recommended Testing Approach

To improve test coverage for the ingestor, we recommend the following approach:

### 1. Refactor for Interface-Based Testing

The `Ingestor` struct should be refactored to use interfaces for its dependencies, rather than concrete implementations. This will allow for easier mocking in tests.

```go
// Example of interface-based approach
type EtherscanAPI interface {
    GetLatestBlockNumber() (uint64, error)
    GetTransactions(ctx context.Context, fromBlock, toBlock int64) ([]EtherscanTransaction, error)
}

type DatabaseQueries interface {
    GetLastProcessedBlock(ctx context.Context) (int64, error)
    UpdateLastProcessedBlock(ctx context.Context, blockNumber int64) error
    // ... other database methods
}

type S3Storage interface {
    SyncWithS3(ctx context.Context) error
}

// Ingestor with interfaces
type Ingestor struct {
    logger      *zap.Logger
    db          DatabaseQueries
    etherscan   EtherscanAPI
    s3Storage   S3Storage
    // ... other fields
}
```

### 2. Unit Test Each Component

Once refactored, each method can be properly unit tested with mocked dependencies:

- `getStartBlock`: Test with various database states
- `getEndBlock`: Test with different Etherscan responses
- `processBlockRange`: Test block processing logic
- `fetchTransactions`: Test retry logic and error handling
- `processTransaction`: Test different transaction types and edge cases
- `processTileUpdate`: Test tile data updates
- `processTransfer`: Test ownership transfers

### 3. Integration Tests

Create integration tests that check the interaction between multiple components:

- Test the flow from fetching transactions to updating the database
- Test rendering pipeline from data history to image generation

### 4. Avoid Direct `os.Exit` Calls

Replace `os.Exit` calls with returned errors so that they can be tested properly.

### 5. Test Data Files

Create test data files for:
- Sample Etherscan responses
- Test transactions of different types
- Expected rendered outputs

## Running Tests

Execute tests with:

```bash
cd /path/to/pixelmap.io
./run-tests.sh -b
```

For coverage report:

```bash
./run-tests.sh -b -c
```

## Next Steps

1. Implement interface-based design
2. Replace direct exit calls with errors
3. Add unit tests for all core functions
4. Add integration tests for key workflows
5. Set up test fixtures for consistent testing

By following this approach, we can achieve better test coverage and make the codebase more maintainable.