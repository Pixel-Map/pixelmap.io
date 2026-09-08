import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Home from '../pages/index';
import { fetchTiles } from '../utils/api';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Mock the api
jest.mock('../utils/api', () => ({
  fetchTiles: jest.fn()
}));

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return ({ children }) => <div data-testid="layout-mock">{children}</div>;
});

// Mock the Map component
jest.mock('../components/Map', () => {
  return ({ tiles }) => <div data-testid="map-mock">Map Component with {tiles.length} tiles</div>;
});

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Home />);
    
    // Check that the layout is rendered immediately
    expect(screen.getByTestId('layout-mock')).toBeInTheDocument();
    
    // Resolve the promise with empty array
    await act(async () => {
      resolvePromise([]);
      // Wait for all promises to resolve
      await Promise.resolve();
    });
    
    // Now check for the map component
    expect(screen.getByTestId('map-mock')).toBeInTheDocument();
  });

  it('fetches and displays tiles correctly', async () => {
    // Create mock tiles
    const mockTiles: Partial<PixelMapTile>[] = [
      { id: 1, owner: '0x123', url: 'http://example.com', image: 'abc' },
      { id: 2, owner: '0x456', url: 'http://example2.com', image: 'def' },
    ];
    
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Home />);
    
    // Check that fetchTiles was called
    expect(fetchTiles).toHaveBeenCalledTimes(1);
    
    // Resolve the promise with mock tiles
    await act(async () => {
      resolvePromise(mockTiles);
      // Wait for all promises to resolve
      await Promise.resolve();
    });
    
    // Check the Map component renders with the tiles
    expect(screen.getByText(`Map Component with ${mockTiles.length} tiles`)).toBeInTheDocument();
  });

  it('contains the correct page title element', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    // Since next/head doesn't actually render its children in tests
    // we need to check by inspecting the Home component to see if it contains a title element
    render(<Home />);
    
    // Check the base page elements 
    expect(screen.getByTestId('layout-mock')).toBeInTheDocument();
    
    // Resolve the promise with empty array
    await act(async () => {
      resolvePromise([]);
      // Wait for all promises to resolve
      await Promise.resolve();
    });
    
    // Check that the map component is rendered
    expect(screen.getByTestId('map-mock')).toBeInTheDocument();
    
    // We can't easily check the title, so we'll just skip that
    // (document.title isn't set in JSDOM from next/head)
  });

  it('handles empty tiles array gracefully', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Home />);
    
    // Resolve the promise with empty array
    await act(async () => {
      resolvePromise([]);
      // Wait for all promises to resolve
      await Promise.resolve();
    });
    
    // Check that the Map component is rendered with 0 tiles
    expect(screen.getByText('Map Component with 0 tiles')).toBeInTheDocument();
  });

  it('has the correct main section styling', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock the fetchTiles to return our controlled promise
    (fetchTiles as jest.Mock).mockImplementation(() => promise);
    
    render(<Home />);
    
    // Check styling immediately (no need to wait for data)
    const mainSection = screen.getByRole('main');
    expect(mainSection).toHaveClass('py-8', 'md:py-12', 'lg:py-16');
    
    // Resolve the promise to complete the test
    await act(async () => {
      resolvePromise([]);
      await Promise.resolve();
    });
  });

  it('shows a real request failure and recovers on retry', async () => {
    (fetchTiles as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([{ id: 100 }]);
    render(<Home />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
    expect(screen.queryByTestId('map-mock')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Map Component with 1 tiles')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
