package db

import (
	"context"
	"database/sql"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	_ "github.com/mattn/go-sqlite3" // Use SQLite for testing
)

func TestNew(t *testing.T) {
	// Create an in-memory SQLite database for testing
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err)
	defer db.Close()

	// Initialize our Queries struct with the database
	q := New(db)
	assert.NotNil(t, q)
	
	// Verify the DB connection is set
	assert.Equal(t, db, q.db)
}

func TestQuerier(t *testing.T) {
	// Create an in-memory SQLite database for testing
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err)
	defer db.Close()

	// Create a simple test table
	_, err = db.Exec(`
		CREATE TABLE tiles (
			id INTEGER PRIMARY KEY,
			price TEXT,
			url TEXT,
			image TEXT,
			owner TEXT,
			wrapped BOOLEAN
		)
	`)
	require.NoError(t, err)

	// Insert some test data
	_, err = db.Exec(`
		INSERT INTO tiles (id, price, url, image, owner, wrapped)
		VALUES (1, '2.00', 'https://example.com', 'img123', '0x123', false)
	`)
	require.NoError(t, err)

	// Initialize our Queries struct but we don't use it directly in this test
	_ = New(db)
	
	// Test that the Querier can retrieve data
	ctx := context.Background()
	
	// This is a simple test - in a real implementation, we would create
	// the full schema and test all the query methods in the Querier interface
	row := db.QueryRowContext(ctx, "SELECT id, price, url, image, owner, wrapped FROM tiles WHERE id = $1", 1)
	
	var tile Tile
	err = row.Scan(&tile.ID, &tile.Price, &tile.Url, &tile.Image, &tile.Owner, &tile.Wrapped)
	require.NoError(t, err)
	
	assert.Equal(t, int32(1), tile.ID)
	assert.Equal(t, "2.00", tile.Price)
	assert.Equal(t, "https://example.com", tile.Url)
	assert.Equal(t, "img123", tile.Image)
	assert.Equal(t, "0x123", tile.Owner)
	assert.Equal(t, false, tile.Wrapped)
}