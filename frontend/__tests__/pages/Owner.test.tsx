import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Owner from '../../pages/owner/[address]';
import { fetchTiles } from '../../utils/api';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the api
jest.mock('../../utils/api', () => ({
  fetchTiles: jest.fn(),
}));

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  return ({ children }) => <div data-testid="layout-mock">{children}</div>;
});

// Mock the TileImage component
jest.mock('../../components/TileImage', () => {
  return ({ image, className }) => (
    <div data-testid="tile-image-mock" className={className}>
      Image: {image}
    </div>
  );
});

// Mock the Loader component
jest.mock('../../components/Loader', () => {
  return () => <div data-testid="loader-mock">Loading...</div>;
});

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }) => (
    <a href={href} data-testid="next-link-mock">
      {children}
    </a>
  );
});

import { useRouter } from 'next/router';

describe('Owner page', () => {
  const mockTiles: PixelMapTile[] = [
    { id: 123, owner: '0xabc123', url: 'https://example.com', image: 'abc123', price: 0, x: 0, y: 0 },
    { id: 456, owner: '0xabc123', url: 'https://test.com', image: 'def456', price: 0, x: 0, y: 0 },
    { id: 789, owner: '0xdifferent', url: 'https://other.com', image: 'ghi789', price: 0, x: 0, y: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      query: { address: '0xabc123' },
    });
  });

  it('renders loading state initially', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Owner />);
    
    // Check that the loader is rendered initially
    expect(screen.getByTestId('loader-mock')).toBeInTheDocument();
    
    // Resolve the promise with mock tiles
    await act(async () => {
      resolvePromise(mockTiles);
      await Promise.resolve();
    });
  });

  it('displays only tiles owned by the address', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Owner />);
    
    // Resolve the promise with mock tiles
    await act(async () => {
      resolvePromise(mockTiles);
      await Promise.resolve();
    });
    
    // Should display title with address
    // The shortenIfHex function is not actually making the 0xabc123… format in tests
    // because the mock address is too short
    expect(screen.getByText(/0xabc123 Tiles/)).toBeInTheDocument();
    
    // Should display only tiles owned by the address (2 tiles)
    const tileIds = screen.getAllByText(/Tile #/);
    expect(tileIds).toHaveLength(2);
    expect(screen.getByText('Tile #123')).toBeInTheDocument();
    expect(screen.getByText('Tile #456')).toBeInTheDocument();
    expect(screen.queryByText('Tile #789')).not.toBeInTheDocument();

    // Should render tile images for owned tiles
    const tileImages = screen.getAllByTestId('tile-image-mock');
    expect(tileImages).toHaveLength(2);
    expect(tileImages[0]).toHaveTextContent('Image: abc123');
    expect(tileImages[1]).toHaveTextContent('Image: def456');
  });

  it('handles address change by filtering tiles correctly', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    const { rerender } = render(<Owner />);
    
    // Resolve the promise with mock tiles
    await act(async () => {
      resolvePromise(mockTiles);
      await Promise.resolve();
    });
    
    // Initially shows tiles for 0xabc123
    expect(screen.getAllByText(/Tile #/)).toHaveLength(2);
    
    // Change the address in the router
    (useRouter as jest.Mock).mockReturnValue({
      query: { address: '0xdifferent' },
    });
    
    // Rerender with new address
    rerender(<Owner />);
    
    // Should now show different tiles
    expect(screen.getAllByText(/Tile #/)).toHaveLength(1);
    expect(screen.queryByText('Tile #123')).not.toBeInTheDocument();
    expect(screen.queryByText('Tile #456')).not.toBeInTheDocument();
    expect(screen.getByText('Tile #789')).toBeInTheDocument();
  });

  it('handles case-insensitive address matching', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    // Set up router with UPPERCASE address
    (useRouter as jest.Mock).mockReturnValue({
      query: { address: '0xABC123' },
    });
    
    render(<Owner />);
    
    // Resolve the promise with mock tiles (which have lowercase addresses)
    await act(async () => {
      resolvePromise(mockTiles);
      await Promise.resolve();
    });
    
    // Should still match the tiles despite case difference
    const tileIds = screen.getAllByText(/Tile #/);
    expect(tileIds).toHaveLength(2);
    expect(screen.getByText('Tile #123')).toBeInTheDocument();
    expect(screen.getByText('Tile #456')).toBeInTheDocument();
  });

  it('handles empty address gracefully', async () => {
    // Setup router mock with undefined address
    (useRouter as jest.Mock).mockReturnValue({
      query: { },
    });

    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Owner />);
    
    // Resolve the promise with mock tiles
    await act(async () => {
      resolvePromise(mockTiles);
      await Promise.resolve();
    });
    
    // Should display title with empty address
    expect(screen.getByText('Tiles')).toBeInTheDocument();
    
    // Should not display any tiles since no address matches
    expect(screen.queryByText(/Tile #/)).not.toBeInTheDocument();
  });

  it('links to individual tile pages', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Owner />);
    
    // Resolve the promise with mock tiles
    await act(async () => {
      resolvePromise(mockTiles);
      await Promise.resolve();
    });
    
    // Should have next/link elements with correct hrefs
    const links = screen.getAllByTestId('next-link-mock');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/tile/123');
    expect(links[1]).toHaveAttribute('href', '/tile/456');
  });
});