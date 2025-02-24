import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TileCard from '../components/TileCard';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';
import * as api from '../utils/api';

// Mock the next/link component
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return (
      <a href={href} data-testid="next-link">
        {children}
      </a>
    );
  };
});

// Mock the TileImage component
jest.mock('../components/TileImage', () => {
  return function MockTileImage({ image, className }: { image: string; className: string }) {
    return <div data-testid="mock-tile-image" data-image={image} className={className} />;
  };
});

// Mock the api functions
jest.mock('../utils/api', () => ({
  fetchSingleTile: jest.fn()
}));

describe('TileCard', () => {
  const mockTile: PixelMapTile = {
    id: 123,
    image: 'FFFFFF000000FFFFFF',
    url: 'https://example.com',
    price: '0.1',
    owner: '0x123456789abcdef',
    wrapped: false,
    historical_images: []
  };

  const mockWrappedTile: PixelMapTile = {
    ...mockTile,
    wrapped: true,
    openseaPrice: 0.5
  };

  const mockTileWithENS: PixelMapTile = {
    ...mockTile,
    ens: 'example.eth'
  };

  const mockTileWithHistory: PixelMapTile = {
    ...mockTile,
    historical_images: [
      {
        image: 'EEEEEE111111EEEEEE',
        image_url: '/historical1.png',
        blockNumber: 100,
        timestamp: 1000
      },
      {
        image: '222222333333222222',
        image_url: '/historical2.png',
        blockNumber: 200,
        timestamp: 2000
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the fetchSingleTile to return a copy of the input tile by default
    (api.fetchSingleTile as jest.Mock).mockImplementation((id) => {
      return Promise.resolve({
        ...mockTile,
        id: parseInt(id)
      });
    });
  });

  it('renders basic tile information correctly', async () => {
    await act(async () => {
      render(<TileCard tile={mockTile} />);
    });
    
    // Tile ID should be visible
    expect(screen.getByText(`PixelMap #${mockTile.id}`)).toBeInTheDocument();
    
    // Shortened owner address should be visible
    expect(screen.getByText(/Owner:/)).toBeInTheDocument();
    
    // URL should be visible
    expect(screen.getByText(mockTile.url)).toBeInTheDocument();
    expect(screen.getByText(mockTile.url).getAttribute('href')).toBe(mockTile.url);

    // Not wrapped message should be visible
    expect(screen.getByText('Not Wrapped')).toBeInTheDocument();
    
    // TileImage should be rendered
    expect(screen.getByTestId('mock-tile-image')).toBeInTheDocument();
  });

  it('shows ENS name when available instead of address', async () => {
    await act(async () => {
      render(<TileCard tile={mockTileWithENS} />);
    });
    
    // ENS name should be visible
    expect(screen.getByText(/Owner:/)).toBeInTheDocument();
    expect(screen.getByText(mockTileWithENS.ens)).toBeInTheDocument();
  });

  it('displays OpenSea button for wrapped tiles', async () => {
    await act(async () => {
      render(<TileCard tile={mockWrappedTile} />);
    });
    
    // OpenSea button should be visible with ETH symbol
    expect(screen.getByText('Buy for 0.5Ξ')).toBeInTheDocument();
  });

  it('shows "View on OpenSea" when openseaPrice is 0', async () => {
    const tileWithZeroPrice = {
      ...mockWrappedTile,
      openseaPrice: 0
    };

    await act(async () => {
      render(<TileCard tile={tileWithZeroPrice} />);
    });
    
    // OpenSea button should show view text
    expect(screen.getByText('View on OpenSea')).toBeInTheDocument();
  });

  it('applies large styles when large prop is true', async () => {
    await act(async () => {
      render(<TileCard tile={mockTile} large={true} />);
    });
    
    const tileImage = screen.getByTestId('mock-tile-image');
    expect(tileImage.className).toContain('h-20 w-20 md:h-40 md:w-40');
  });

  it('displays historical images when available', async () => {
    // Mock api to return tile with history
    (api.fetchSingleTile as jest.Mock).mockResolvedValue(mockTileWithHistory);
    
    await act(async () => {
      render(<TileCard tile={mockTileWithHistory} />);
    });
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.getByText('Previous Images:')).toBeInTheDocument();
    });
    
    // Should have two image tags for historical images
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(3); // 2 historical + 1 portal
  });

  it('changes displayed image on hovering historical images', async () => {
    // Mock api to return tile with history
    (api.fetchSingleTile as jest.Mock).mockResolvedValue(mockTileWithHistory);
    
    await act(async () => {
      render(<TileCard tile={mockTileWithHistory} />);
    });
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.getByText('Previous Images:')).toBeInTheDocument();
    });
    
    // Get historical images
    const histImages = screen.getAllByRole('img').filter(img => img.getAttribute('alt') !== 'Portal');
    
    // Initial image should be the current one
    expect(screen.getByTestId('mock-tile-image').getAttribute('data-image')).toBe(mockTileWithHistory.image);
    
    // Hover over first historical image
    await act(async () => {
      fireEvent.mouseEnter(histImages[0]);
    });
    
    // Image should be updated to the historical one
    expect(screen.getByTestId('mock-tile-image').getAttribute('data-image')).toBe('222222333333222222');
  });
});