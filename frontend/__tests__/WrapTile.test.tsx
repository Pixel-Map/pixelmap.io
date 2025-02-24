import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WrapTile from '../components/WrapTile';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Mock the TileImage component
jest.mock('../components/TileImage', () => {
  return function MockTileImage({ image, className }: { image: string; className: string }) {
    return <div data-testid="mock-tile-image" data-image={image} className={className} />;
  };
});

// Mock the @headlessui/react Disclosure component
jest.mock('@headlessui/react', () => {
  const Disclosure = ({ children }: { children: any }) => {
    // Simulate the function that Disclosure passes to its children
    return children({ open: true });
  };
  
  Disclosure.Button = ({ children, className }: { children: any; className: string }) => (
    <button data-testid="disclosure-button" className={className}>
      {children}
    </button>
  );
  
  Disclosure.Panel = ({ children, className }: { children: any; className: string }) => (
    <div data-testid="disclosure-panel" className={className}>
      {children}
    </div>
  );
  
  return { Disclosure };
});

// Mock the heroicons
jest.mock('@heroicons/react/outline', () => ({
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
  ChevronUpIcon: () => <div data-testid="chevron-up-icon" />
}));

describe('WrapTile', () => {
  const handlePriceChange = jest.fn();
  const handleSave = jest.fn();
  const handleWrap = jest.fn();
  const handleRefresh = jest.fn();

  // Test case 1: Tile that's not wrapped and has price of 0
  const unwrappedTileZeroPrice: PixelMapTile = {
    id: 123,
    image: 'FFFFFF000000FFFFFF',
    url: 'https://example.com',
    price: '0',
    newPrice: '0.1',
    owner: '0x123456789abcdef',
    wrapped: false
  };

  // Test case 2: Tile that's not wrapped but has a price set
  const unwrappedTileWithPrice: PixelMapTile = {
    id: 456,
    image: '000000FFFFFF000000',
    url: 'https://example.com',
    price: '0.5',
    newPrice: '0.5',
    owner: '0x123456789abcdef',
    wrapped: false
  };

  // Test case 3: Tile that is wrapped
  const wrappedTile: PixelMapTile = {
    id: 789,
    image: 'FF0000FF0000FF0000',
    url: 'https://example.com',
    price: '0.7',
    newPrice: '0.7',
    owner: '0x123456789abcdef',
    wrapped: true,
    openseaPrice: 1.5
  };

  // Test case 4: Unwrapped tile with error message
  const unwrappedTileWithError: PixelMapTile = {
    ...unwrappedTileWithPrice,
    errorMessage: 'Not enough ETH in wallet'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for unwrapped tile with zero price (prepare wrap state)', () => {
    render(
      <WrapTile
        tile={unwrappedTileZeroPrice}
        index={0}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );

    // Check for "Prepare wrap" badge
    expect(screen.getByText('Prepare wrap')).toBeInTheDocument();
    
    // Check that price input exists
    const priceInput = screen.getByLabelText('Price');
    expect(priceInput).toBeInTheDocument();
    expect(priceInput).toHaveValue(unwrappedTileZeroPrice.newPrice);
    
    // Check for warning message
    expect(screen.getByText(/anyone can buy the tile from you/i)).toBeInTheDocument();
    
    // Check for "Set Price" button
    expect(screen.getByText('Set Price')).toBeInTheDocument();
    
    // Check for "Refresh" button
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    
    // Check for Tile ID
    expect(screen.getByText(`Tile #${unwrappedTileZeroPrice.id}`)).toBeInTheDocument();
  });

  it('renders correctly for unwrapped tile with price set (ready to wrap state)', () => {
    render(
      <WrapTile
        tile={unwrappedTileWithPrice}
        index={1}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );

    // Check for "Ready to wrap" badge
    expect(screen.getByText('Ready to wrap')).toBeInTheDocument();
    
    // Check that price display exists
    expect(screen.getByText(/Price:/)).toBeInTheDocument();
    
    // Check for "Wrap tile" button
    expect(screen.getByText('Wrap tile')).toBeInTheDocument();
    
    // Check for "Refresh" button
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('renders correctly for wrapped tile', () => {
    render(
      <WrapTile
        tile={wrappedTile}
        index={2}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );

    // Check for "Wrapped" badge
    expect(screen.getByText('Wrapped')).toBeInTheDocument();
    
    // Check that price display exists
    expect(screen.getByText(/Price:/)).toBeInTheDocument();
    
    // Check for OpenSea link
    expect(screen.getByText('OpenSea')).toBeInTheDocument();
    
    // No "Wrap tile" or "Set Price" buttons should be present
    expect(screen.queryByText('Wrap tile')).not.toBeInTheDocument();
    expect(screen.queryByText('Set Price')).not.toBeInTheDocument();
    
    // No "Refresh" button should be present
    expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
  });

  it('shows error message when present', () => {
    render(
      <WrapTile
        tile={unwrappedTileWithError}
        index={3}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );

    // Check for error message
    expect(screen.getByText(`Error: ${unwrappedTileWithError.errorMessage}`)).toBeInTheDocument();
  });

  it('calls handlePriceChange when price input changes', () => {
    render(
      <WrapTile
        tile={unwrappedTileZeroPrice}
        index={0}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );
    
    // Get price input and change its value
    const priceInput = screen.getByLabelText('Price');
    fireEvent.change(priceInput, { target: { value: '1.5' } });
    
    // Check if handlePriceChange was called with correct args
    expect(handlePriceChange).toHaveBeenCalledWith('1.5', 0);
  });

  it('calls handleSave when Set Price button is clicked', () => {
    render(
      <WrapTile
        tile={unwrappedTileZeroPrice}
        index={0}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );
    
    // Click the Set Price button
    fireEvent.click(screen.getByText('Set Price'));
    
    // Check if handleSave was called with correct args
    expect(handleSave).toHaveBeenCalledWith(unwrappedTileZeroPrice, 0);
  });

  it('calls handleWrap when Wrap tile button is clicked', () => {
    render(
      <WrapTile
        tile={unwrappedTileWithPrice}
        index={1}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );
    
    // Click the Wrap tile button
    fireEvent.click(screen.getByText('Wrap tile'));
    
    // Check if handleWrap was called with correct args
    expect(handleWrap).toHaveBeenCalledWith(unwrappedTileWithPrice, 1);
  });

  it('calls handleRefresh when Refresh button is clicked', () => {
    render(
      <WrapTile
        tile={unwrappedTileWithPrice}
        index={1}
        handlePriceChange={handlePriceChange}
        handleSave={handleSave}
        handleWrap={handleWrap}
        handleRefresh={handleRefresh}
      />
    );
    
    // Click the Refresh button
    fireEvent.click(screen.getByText('Refresh'));
    
    // Check if handleRefresh was called with correct args
    expect(handleRefresh).toHaveBeenCalledWith(unwrappedTileWithPrice, 1);
  });
});