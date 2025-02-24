import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Map from '../components/Map';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import { useWeb3React } from '@web3-react/core';

// Mock the web3React hook
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn()
}));

// Mock the required components
jest.mock('../components/MapToggles', () => {
  return function MockMapToggles({ 
    showOwned, 
    setShowOwned, 
    showForSale, 
    setShowForSale 
  }) {
    return (
      <div data-testid="mock-map-toggles">
        <button 
          data-testid="toggle-owned" 
          onClick={() => setShowOwned(!showOwned)}
        >
          {showOwned ? 'Hide Owned' : 'Show Owned'}
        </button>
        <button 
          data-testid="toggle-for-sale" 
          onClick={() => setShowForSale(!showForSale)}
        >
          {showForSale ? 'Hide For Sale' : 'Show For Sale'}
        </button>
      </div>
    );
  };
});

jest.mock('../components/MapTiles', () => {
  return function MockMapTiles({ tiles }) {
    return (
      <div data-testid="mock-map-tiles" data-tiles-count={tiles.length}>
        Map Tiles
      </div>
    );
  };
});

jest.mock('../components/TileOverlay', () => {
  return function MockTileOverlay({ tiles, bgColor }) {
    return (
      <div 
        data-testid="mock-tile-overlay" 
        data-tiles-count={tiles ? tiles.length : 0} 
        data-bg-color={bgColor}
      >
        Tile Overlay
      </div>
    );
  };
});

// Mock the styles
jest.mock('../styles/components/Map.module.scss', () => ({
  tileMap: 'mock-tile-map-class'
}));

describe('Map', () => {
  const mockTiles = [
    {
      id: 1,
      image: 'FFFFFF000000FFFFFF',
      url: 'https://example.com/1',
      price: '0.1',
      owner: '0x123456789abcdef',
      openseaPrice: 0,
    },
    {
      id: 2,
      image: '000000FFFFFF000000',
      url: 'https://example.com/2',
      price: '0.2',
      owner: '0x123456789abcdef',
      openseaPrice: 0,
    },
    {
      id: 3,
      image: 'FF0000FF0000FF0000',
      url: 'https://example.com/3',
      price: '0.3',
      owner: '0xDifferentOwner',
      openseaPrice: 1.5,
    }
  ] as PixelMapTile[];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for useWeb3React
    (useWeb3React as jest.Mock).mockReturnValue({
      account: '0x123456789abcdef'
    });
  });

  it('renders the map with tiles', () => {
    render(<Map tiles={mockTiles} />);
    
    // MapTiles should be rendered with all tiles
    const mapTiles = screen.getByTestId('mock-map-tiles');
    expect(mapTiles).toBeInTheDocument();
    expect(mapTiles.getAttribute('data-tiles-count')).toBe(mockTiles.length.toString());
    
    // Map image should be visible
    const mapImage = screen.getByAltText('PixelMap Map');
    expect(mapImage).toBeInTheDocument();
    expect(mapImage.getAttribute('src')).toBe('https://pixelmap.art/tilemap.png');
    
    // Toggles should be visible
    expect(screen.getByTestId('mock-map-toggles')).toBeInTheDocument();
  });

  it('does not show overlay filters by default', () => {
    render(<Map tiles={mockTiles} />);
    
    // Overlays should not be visible by default
    expect(screen.queryAllByTestId('mock-tile-overlay')).toHaveLength(0);
  });

  it('filters owned tiles when toggled', () => {
    render(<Map tiles={mockTiles} />);
    
    // Click on 'Show Owned' toggle
    fireEvent.click(screen.getByTestId('toggle-owned'));
    
    // Owned tiles overlay should now be visible
    const ownedOverlay = screen.getAllByTestId('mock-tile-overlay')[0];
    expect(ownedOverlay).toBeInTheDocument();
    
    // There are 2 tiles owned by the current account
    expect(ownedOverlay.getAttribute('data-tiles-count')).toBe('2');
    expect(ownedOverlay.getAttribute('data-bg-color')).toBe('bg-blue-600');
  });

  it('filters for-sale tiles when toggled', () => {
    render(<Map tiles={mockTiles} />);
    
    // Click on 'Show For Sale' toggle
    fireEvent.click(screen.getByTestId('toggle-for-sale'));
    
    // For sale tiles overlay should now be visible
    const forSaleOverlay = screen.getAllByTestId('mock-tile-overlay')[0];
    expect(forSaleOverlay).toBeInTheDocument();
    
    // There is 1 tile for sale
    expect(forSaleOverlay.getAttribute('data-tiles-count')).toBe('1');
    expect(forSaleOverlay.getAttribute('data-bg-color')).toBe('bg-green-600');
  });

  it('shows both overlays when both toggles are active', () => {
    render(<Map tiles={mockTiles} />);
    
    // Click on both toggles
    fireEvent.click(screen.getByTestId('toggle-owned'));
    fireEvent.click(screen.getByTestId('toggle-for-sale'));
    
    // Both overlays should be visible
    const overlays = screen.getAllByTestId('mock-tile-overlay');
    expect(overlays).toHaveLength(2);
    
    // First overlay should be owned tiles (blue)
    expect(overlays[0].getAttribute('data-bg-color')).toBe('bg-blue-600');
    
    // Second overlay should be for sale tiles (green)
    expect(overlays[1].getAttribute('data-bg-color')).toBe('bg-green-600');
  });

  it('updates owned tiles when account changes', () => {
    const { rerender } = render(<Map tiles={mockTiles} />);
    
    // Show owned tiles
    fireEvent.click(screen.getByTestId('toggle-owned'));
    
    // Initially 2 tiles are owned
    let ownedOverlay = screen.getAllByTestId('mock-tile-overlay')[0];
    expect(ownedOverlay.getAttribute('data-tiles-count')).toBe('2');
    
    // Change account
    (useWeb3React as jest.Mock).mockReturnValue({
      account: '0xDifferentOwner'
    });
    
    // Re-render with the same props
    rerender(<Map tiles={mockTiles} />);
    
    // Now only 1 tile is owned
    ownedOverlay = screen.getAllByTestId('mock-tile-overlay')[0];
    expect(ownedOverlay.getAttribute('data-tiles-count')).toBe('1');
  });
});