import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MapTiles from '../components/MapTiles';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Mock the TilePopover component
jest.mock('../components/TilePopover', () => {
  return function MockTilePopover({ tile, referenceElement }: { tile: any; referenceElement: HTMLElement | null }) {
    if (!tile) return null;
    return (
      <div data-testid="mock-tile-popover" data-tile-id={tile.id} data-reference-element={referenceElement ? 'exists' : 'none'}>
        Tile #{tile.id} Popover
      </div>
    );
  };
});

describe('MapTiles', () => {
  const mockTiles = [
    {
      id: 1,
      image: 'FFFFFF000000FFFFFF',
      url: 'https://example.com/1',
      price: '0.1',
      owner: '0x123456789abcdef',
    },
    {
      id: 2,
      image: '000000FFFFFF000000',
      url: 'https://example.com/2',
      price: '0.2',
      owner: '0x123456789abcdef',
    },
    {
      id: 3,
      image: 'FF0000FF0000FF0000',
      url: 'https://example.com/3',
      price: '0.3',
      owner: '0x123456789abcdef',
    }
  ] as PixelMapTile[];

  it('renders a button for each tile', () => {
    render(<MapTiles tiles={mockTiles} />);
    
    // There should be a button for each tile
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(mockTiles.length);
  });

  it('shows popover when a tile is clicked', async () => {
    render(<MapTiles tiles={mockTiles} />);
    
    // Initially no popover should be visible
    expect(screen.queryByTestId('mock-tile-popover')).not.toBeInTheDocument();
    
    // Click on the first tile
    const buttons = screen.getAllByRole('button');
    await act(async () => {
      fireEvent.click(buttons[0]);
    });
    
    // Popover should now be visible with the correct tile
    const popover = screen.getByTestId('mock-tile-popover');
    expect(popover).toBeInTheDocument();
    expect(popover.getAttribute('data-tile-id')).toBe('1');
    expect(popover.getAttribute('data-reference-element')).toBe('exists');
  });

  it('updates popover when different tile is clicked', async () => {
    render(<MapTiles tiles={mockTiles} />);
    
    // Click on the first tile
    const buttons = screen.getAllByRole('button');
    await act(async () => {
      fireEvent.click(buttons[0]);
    });
    
    // Verify first tile popover
    expect(screen.getByTestId('mock-tile-popover').getAttribute('data-tile-id')).toBe('1');
    
    // Click on the second tile
    await act(async () => {
      fireEvent.click(buttons[1]);
    });
    
    // Verify second tile popover
    expect(screen.getByTestId('mock-tile-popover').getAttribute('data-tile-id')).toBe('2');
  });

  it('applies correct styling to tile buttons', () => {
    render(<MapTiles tiles={mockTiles} />);
    
    const buttons = screen.getAllByRole('button');
    
    // Check that the expected classes are applied
    expect(buttons[0].className).toContain('block');
    expect(buttons[0].className).toContain('nes-pointer');
    expect(buttons[0].className).toContain('w-4');
    expect(buttons[0].className).toContain('h-4');
    expect(buttons[0].className).toContain('hover:ring');
  });

  it('renders nothing when tiles array is empty', () => {
    render(<MapTiles tiles={[]} />);
    
    // No buttons should be rendered
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    
    // No popover should be visible
    expect(screen.queryByTestId('mock-tile-popover')).not.toBeInTheDocument();
  });
});