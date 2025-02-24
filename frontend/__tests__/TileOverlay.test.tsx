import React from 'react';
import { render } from '@testing-library/react';
import TileOverlay from '../components/TileOverlay';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

describe('TileOverlay', () => {
  // Mock tile data
  const mockTiles: Partial<PixelMapTile>[] = [
    { id: 0 },   // This would be at position x=1, y=1
    { id: 1 },   // This would be at position x=2, y=1
    { id: 81 },  // This would be at position x=1, y=2
    { id: 162 }  // This would be at position x=1, y=3
  ];

  it('renders without crashing', () => {
    const { container } = render(
      <TileOverlay tiles={mockTiles as PixelMapTile[]} bgColor="bg-red-500" />
    );
    const overlayElements = container.querySelectorAll('.bg-red-500');
    expect(overlayElements.length).toBe(4);
  });

  it('applies the correct background color', () => {
    const { container } = render(
      <TileOverlay tiles={mockTiles as PixelMapTile[]} bgColor="bg-blue-300" />
    );
    const overlayElements = container.querySelectorAll('.bg-blue-300');
    expect(overlayElements.length).toBe(4);
  });

  it('positions tiles at the correct grid coordinates based on id', () => {
    const { container } = render(
      <TileOverlay tiles={mockTiles as PixelMapTile[]} bgColor="bg-red-500" />
    );
    
    const overlayElements = container.querySelectorAll('.bg-red-500');
    
    // Check the first tile (id: 0) - should be at position x=1, y=1
    expect(overlayElements[0]).toHaveStyle({
      gridColumnStart: '1',
      gridRowStart: '1'
    });
    
    // Check the second tile (id: 1) - should be at position x=2, y=1
    expect(overlayElements[1]).toHaveStyle({
      gridColumnStart: '2',
      gridRowStart: '1'
    });
    
    // Check the third tile (id: 81) - should be at position x=1, y=2
    expect(overlayElements[2]).toHaveStyle({
      gridColumnStart: '1',
      gridRowStart: '2'
    });
    
    // Check the fourth tile (id: 162) - should be at position x=1, y=3
    expect(overlayElements[3]).toHaveStyle({
      gridColumnStart: '1',
      gridRowStart: '3'
    });
  });

  it('applies correct styling to overlay elements', () => {
    const { container } = render(
      <TileOverlay tiles={mockTiles as PixelMapTile[]} bgColor="bg-green-500" />
    );
    
    const overlayElement = container.querySelector('.bg-green-500');
    expect(overlayElement).toHaveClass('relative', 'w-4', 'h-4', 'bg-opacity-80');
  });

  it('handles empty tiles array', () => {
    const { container } = render(
      <TileOverlay tiles={[]} bgColor="bg-red-500" />
    );
    
    const overlayElements = container.querySelectorAll('.bg-red-500');
    expect(overlayElements.length).toBe(0);
  });

  it('renders with correct grid attributes for tile positioning', () => {
    const tiles: Partial<PixelMapTile>[] = [
      { id: 0 } // This should be at x=1, y=1
    ];
    
    const { container } = render(
      <TileOverlay tiles={tiles as PixelMapTile[]} bgColor="bg-red-500" />
    );
    
    // Check the element exists and has style attributes
    const overlayElement = container.querySelector('.bg-red-500');
    expect(overlayElement).toBeTruthy();
    expect(overlayElement).toHaveAttribute('style');
    
    // Check that the style string contains the correct grid positions
    const styleAttr = overlayElement.getAttribute('style');
    expect(styleAttr).toContain('grid-column-start: 1');
    expect(styleAttr).toContain('grid-row-start: 1');
  });
});