import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditTile from '../components/EditTile';
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

describe('EditTile', () => {
  const mockTile: PixelMapTile = {
    id: 123,
    image: 'FFFFFF000000FFFFFF',
    url: 'https://example.com',
    price: '0.1',
    newPrice: '0.1',
    owner: '0x123456789abcdef',
    wrapped: false
  };

  const mockWrappedTile: PixelMapTile = {
    ...mockTile,
    wrapped: true
  };

  const mockHandlers = {
    handleImageEditor: jest.fn(),
    handleLinkChange: jest.fn(),
    handlePriceChange: jest.fn(),
    handleSave: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the tile ID correctly', () => {
    render(
      <EditTile
        tile={mockTile}
        index={0}
        handleImageEditor={mockHandlers.handleImageEditor}
        handleLinkChange={mockHandlers.handleLinkChange}
        handlePriceChange={mockHandlers.handlePriceChange}
        handleSave={mockHandlers.handleSave}
      />
    );

    expect(screen.getByText(`Tile #${mockTile.id}`)).toBeInTheDocument();
  });

  it('displays tile image and allows editing it', () => {
    render(
      <EditTile
        tile={mockTile}
        index={0}
        handleImageEditor={mockHandlers.handleImageEditor}
        handleLinkChange={mockHandlers.handleLinkChange}
        handlePriceChange={mockHandlers.handlePriceChange}
        handleSave={mockHandlers.handleSave}
      />
    );

    const tileImages = screen.getAllByTestId('mock-tile-image');
    expect(tileImages.length).toBeGreaterThan(0);
    
    // Find the change image button and click it
    const changeImageButton = screen.getByText('Change image').parentElement?.parentElement;
    fireEvent.click(changeImageButton!);
    
    expect(mockHandlers.handleImageEditor).toHaveBeenCalledWith(mockTile);
  });

  it('allows changing the tile link', () => {
    render(
      <EditTile
        tile={mockTile}
        index={0}
        handleImageEditor={mockHandlers.handleImageEditor}
        handleLinkChange={mockHandlers.handleLinkChange}
        handlePriceChange={mockHandlers.handlePriceChange}
        handleSave={mockHandlers.handleSave}
      />
    );

    const linkInput = screen.getByLabelText('Link');
    expect(linkInput).toHaveValue(mockTile.url);
    
    fireEvent.change(linkInput, { target: { value: 'https://new-example.com' } });
    
    expect(mockHandlers.handleLinkChange).toHaveBeenCalledWith('https://new-example.com', 0);
  });

  it('allows changing the tile price for unwrapped tiles', () => {
    render(
      <EditTile
        tile={mockTile}
        index={0}
        handleImageEditor={mockHandlers.handleImageEditor}
        handleLinkChange={mockHandlers.handleLinkChange}
        handlePriceChange={mockHandlers.handlePriceChange}
        handleSave={mockHandlers.handleSave}
      />
    );

    const priceInput = screen.getByLabelText('Price');
    expect(priceInput).toHaveValue(mockTile.newPrice);
    
    fireEvent.change(priceInput, { target: { value: '0.5' } });
    
    expect(mockHandlers.handlePriceChange).toHaveBeenCalledWith('0.5', 0);
  });

  it('shows OpenSea link for wrapped tiles instead of price input', () => {
    render(
      <EditTile
        tile={mockWrappedTile}
        index={0}
        handleImageEditor={mockHandlers.handleImageEditor}
        handleLinkChange={mockHandlers.handleLinkChange}
        handlePriceChange={mockHandlers.handlePriceChange}
        handleSave={mockHandlers.handleSave}
      />
    );

    // Price input should not be present
    expect(screen.queryByLabelText('Price')).not.toBeInTheDocument();
    
    // OpenSea link should be present
    expect(screen.getByText('OpenSea')).toBeInTheDocument();
  });

  it('calls handleSave when save button is clicked', () => {
    render(
      <EditTile
        tile={mockTile}
        index={0}
        handleImageEditor={mockHandlers.handleImageEditor}
        handleLinkChange={mockHandlers.handleLinkChange}
        handlePriceChange={mockHandlers.handlePriceChange}
        handleSave={mockHandlers.handleSave}
      />
    );

    const saveButton = screen.getByText('Save changes');
    fireEvent.click(saveButton);
    
    expect(mockHandlers.handleSave).toHaveBeenCalledWith(mockTile);
  });
});