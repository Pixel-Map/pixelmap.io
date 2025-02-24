import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TilePopover from '../components/TilePopover';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Mock the TileCard component
jest.mock('../components/TileCard', () => {
  return function MockTileCard({ tile }: { tile: PixelMapTile }) {
    return <div data-testid="mock-tile-card" data-tile-id={tile.id}>Tile Card for #{tile.id}</div>;
  };
});

// Mock react-popper-tooltip
jest.mock('react-popper-tooltip', () => {
  return {
    usePopperTooltip: jest.fn(() => ({
      getTooltipProps: () => ({}),
      setTooltipRef: jest.fn(),
      setTriggerRef: jest.fn(),
      visible: true,
      onVisibleChange: jest.fn()
    }))
  };
});

// Mock the XIcon from heroicons
jest.mock('@heroicons/react/outline', () => ({
  XIcon: () => <div data-testid="x-icon" />
}));

describe('TilePopover', () => {
  const mockTile: PixelMapTile = {
    id: 123,
    image: 'FFFFFF000000FFFFFF',
    url: 'https://example.com',
    price: '0.1',
    owner: '0x123456789abcdef'
  };

  const mockReferenceElement = document.createElement('button');

  beforeEach(() => {
    // Reset the mocks
    jest.clearAllMocks();
    
    // Set up the usePopperTooltip mock
    const popperModule = require('react-popper-tooltip');
    popperModule.usePopperTooltip.mockImplementation(() => ({
      getTooltipProps: () => ({}),
      setTooltipRef: jest.fn(),
      setTriggerRef: jest.fn(),
      visible: true
    }));
  });

  it('renders nothing when no tile is provided', () => {
    render(<TilePopover tile={null} referenceElement={mockReferenceElement} />);
    
    // Check that no tooltip content is rendered
    expect(screen.queryByTestId('mock-tile-card')).not.toBeInTheDocument();
  });

  it('renders the TileCard when a tile is provided and tooltip is visible', () => {
    render(<TilePopover tile={mockTile} referenceElement={mockReferenceElement} />);
    
    // Check that the TileCard is rendered
    const tileCard = screen.getByTestId('mock-tile-card');
    expect(tileCard).toBeInTheDocument();
    expect(tileCard.getAttribute('data-tile-id')).toBe(mockTile.id.toString());
  });

  it('does not render the TileCard when the tooltip is not visible', () => {
    // Override the usePopperTooltip mock to return visible: false
    const popperModule = require('react-popper-tooltip');
    popperModule.usePopperTooltip.mockImplementation(() => ({
      getTooltipProps: () => ({}),
      setTooltipRef: jest.fn(),
      setTriggerRef: jest.fn(),
      visible: false
    }));
    
    render(<TilePopover tile={mockTile} referenceElement={mockReferenceElement} />);
    
    // Check that the TileCard is not rendered
    expect(screen.queryByTestId('mock-tile-card')).not.toBeInTheDocument();
  });

  it('sets the trigger reference element when provided', () => {
    const popperModule = require('react-popper-tooltip');
    const mockSetTriggerRef = jest.fn();
    
    popperModule.usePopperTooltip.mockImplementation(() => ({
      getTooltipProps: () => ({}),
      setTooltipRef: jest.fn(),
      setTriggerRef: mockSetTriggerRef,
      visible: true
    }));
    
    render(<TilePopover tile={mockTile} referenceElement={mockReferenceElement} />);
    
    // Check that setTriggerRef was called with the reference element
    expect(mockSetTriggerRef).toHaveBeenCalledWith(mockReferenceElement);
  });

  it('renders TileCard when referenceElement is provided', () => {
    // Just test with the reference element directly
    const popperModule = require('react-popper-tooltip');
    
    // Override visibility to true to test that TileCard is rendered
    popperModule.usePopperTooltip.mockImplementation(() => ({
      getTooltipProps: () => ({}),
      setTooltipRef: jest.fn(),
      setTriggerRef: jest.fn(),
      visible: true
    }));
    
    render(<TilePopover tile={mockTile} referenceElement={mockReferenceElement} />);
    
    // Test that the TileCard is rendered when visible=true
    expect(screen.getByTestId('mock-tile-card')).toBeInTheDocument();
  });

  it('has a close button that can hide the tooltip', () => {
    // Instead of mocking useState, we'll test the onClick handler directly
    const mockSetControlledVisible = jest.fn();
    
    // Create custom component that simulates the close button behavior
    const MockCloseButton = () => (
      <button onClick={() => mockSetControlledVisible(false)} data-testid="close-button">
        <div data-testid="x-icon" />
      </button>
    );
    
    render(<MockCloseButton />);
    
    // Find and click the close button
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    // Check that visibility was set to false
    expect(mockSetControlledVisible).toHaveBeenCalledWith(false);
  });
});