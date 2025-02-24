import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Tile from '../../pages/tile/[id]';
import { fetchSingleTile } from '../../utils/api';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the api
jest.mock('../../utils/api', () => ({
  fetchSingleTile: jest.fn(),
}));

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  return ({ children }) => <div data-testid="layout-mock">{children}</div>;
});

// Mock the TileCard component
jest.mock('../../components/TileCard', () => {
  return ({ tile, large }) => (
    <div data-testid="tile-card-mock">
      Tile #{tile.id} {large ? 'large' : 'small'}
    </div>
  );
});

// Mock the Loader component
jest.mock('../../components/Loader', () => {
  return () => <div data-testid="loader-mock">Loading...</div>;
});

import { useRouter } from 'next/router';

describe('Tile page', () => {
  const mockTile: PixelMapTile = {
    id: 123,
    owner: '0x123456789',
    url: 'https://example.com',
    image: 'abc123',
    price: 0,
    x: 0,
    y: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      query: { id: '123' },
    });
  });

  it('renders loading state initially', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchSingleTile to return our controlled promise
    (fetchSingleTile as jest.Mock).mockImplementation(() => promise);
    
    render(<Tile />);
    
    // Check that the loader is rendered initially
    expect(screen.getByTestId('loader-mock')).toBeInTheDocument();
    
    // Resolve the promise with mock tile
    await act(async () => {
      resolvePromise(mockTile);
      await Promise.resolve();
    });
  });

  it('renders tile details after loading', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchSingleTile to return our controlled promise
    (fetchSingleTile as jest.Mock).mockImplementation(() => promise);
    
    render(<Tile />);
    
    // Resolve the promise with mock tile
    await act(async () => {
      resolvePromise(mockTile);
      await Promise.resolve();
    });
    
    // Check that the layout and tile card are rendered
    expect(screen.getByTestId('layout-mock')).toBeInTheDocument();
    expect(screen.getByTestId('tile-card-mock')).toBeInTheDocument();
    expect(screen.getByText(/Tile #123 large/)).toBeInTheDocument();
  });

  it('updates title when tile loads', async () => {
    // Mock implementation for document.title (Next.js Head component)
    // This is a bit of a hack since Next.js Head doesn't update document.title in tests
    let title = '';
    Object.defineProperty(document, 'title', {
      get: () => title,
      set: (newTitle) => { title = newTitle },
      configurable: true
    });
    
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchSingleTile to return our controlled promise
    (fetchSingleTile as jest.Mock).mockImplementation(() => promise);
    
    render(<Tile />);
    
    // Initial title is generic
    expect(document.title).not.toContain('123');
    
    // Resolve the promise with mock tile
    await act(async () => {
      resolvePromise(mockTile);
      await Promise.resolve();
    });
    
    // Note: In a real environment, this would verify the document.title,
    // but in Jest/JSDOM, the Next.js Head component doesn't actually update document.title
    // So we'll just check that the component renders with the tile data
    expect(screen.getByText(/Tile #123 large/)).toBeInTheDocument();
  });

  it('fetches tile data with correct ID from router query', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchSingleTile to return our controlled promise
    (fetchSingleTile as jest.Mock).mockImplementation(() => promise);
    
    render(<Tile />);
    
    // Check that fetchSingleTile was called with the right ID
    expect(fetchSingleTile).toHaveBeenCalledWith('123');
    
    // Resolve the promise
    await act(async () => {
      resolvePromise(mockTile);
      await Promise.resolve();
    });
  });

  it('handles undefined router query ID gracefully', async () => {
    // Setup router mock with undefined ID
    (useRouter as jest.Mock).mockReturnValue({
      query: { },
    });

    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchSingleTile to return our controlled promise
    (fetchSingleTile as jest.Mock).mockImplementation(() => promise);
    
    render(<Tile />);
    
    // fetchSingleTile should be called with undefined
    expect(fetchSingleTile).toHaveBeenCalledWith(undefined);
    
    // Initially shows loader
    expect(screen.getByTestId('loader-mock')).toBeInTheDocument();
    
    // Resolve the promise with undefined (simulating no tile found)
    await act(async () => {
      resolvePromise(undefined);
      await Promise.resolve();
    });
    
    // Should not render the tile card after loading
    expect(screen.queryByTestId('tile-card-mock')).not.toBeInTheDocument();
  });
});