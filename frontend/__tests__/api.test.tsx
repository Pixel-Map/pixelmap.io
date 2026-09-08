import { fetchTiles, fetchSingleTile, fetchTimeCapsuleTiles, fetchAllTilesEver, TimeCapsuleTile } from '../utils/api';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Create a mock for fetch
global.fetch = jest.fn();

describe('API utility functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('fetchTiles', () => {
    it('fetches tiles data from the correct URL', async () => {
      // Mock the fetch response
      const mockTiles: PixelMapTile[] = [
        {
          id: 1,
          image: 'FFFFFF000000FFFFFF',
          url: 'https://example.com/1',
          price: '0.1',
          owner: '0x123456789abcdef'
        },
        {
          id: 2,
          image: '000000FFFFFF000000',
          url: 'https://example.com/2',
          price: '0.2',
          owner: '0x123456789abcdef'
        }
      ];

      // Set up the fetch mock to return the mock data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true, json: jest.fn().mockResolvedValueOnce(mockTiles)
      });

      // Call the function
      const result = await fetchTiles();

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith('https://pixelmap.art/tiledata.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      
      // Check that the function returns the expected data
      expect(result).toEqual(mockTiles);
    });

    it('propagates network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchTiles()).rejects.toThrow('Network error');
    });
  });

  describe('fetchSingleTile', () => {
    it('fetches a single tile data from the correct URL', async () => {
      // Mock the fetch response
      const mockTile: PixelMapTile = {
        id: 123,
        image: 'FFFFFF000000FFFFFF',
        url: 'https://example.com',
        price: '0.1',
        owner: '0x123456789abcdef'
      };

      // Set up the fetch mock to return the mock data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true, json: jest.fn().mockResolvedValueOnce(mockTile)
      });

      // Call the function
      const result = await fetchSingleTile('123');

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith('https://pixelmap.art/tile/123.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      
      // Check that the function returns the expected data
      expect(result).toEqual(mockTile);
    });

    it('propagates tile failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchSingleTile('123')).rejects.toThrow('Network error');
    });

    it('handles undefined id', async () => {
      // Call the function with undefined id
      const result = await fetchSingleTile(undefined);

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Check that the function returns undefined
      expect(result).toBeUndefined();
    });
  });

  describe('fetchTimeCapsuleTiles', () => {
    it('fetches time capsule tiles data from the correct URL', async () => {
      // Mock the fetch response
      const mockTimeCapsuleTiles: TimeCapsuleTile[] = [
        {
          tileId: 1,
          orderImageSetOnTile: 1,
          currentOwner: 123,
          claimed: false
        },
        {
          tileId: 2,
          orderImageSetOnTile: 2,
          currentOwner: 456,
          claimed: true
        }
      ];

      // Set up the fetch mock to return the mock data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true, json: jest.fn().mockResolvedValueOnce(mockTimeCapsuleTiles)
      });

      // Call the function
      const result = await fetchTimeCapsuleTiles();

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith('https://pixelmap.art/timecapsuleI.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      
      // Check that the function returns the expected data
      expect(result).toEqual(mockTimeCapsuleTiles);
    });

    it('propagates network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchTimeCapsuleTiles()).rejects.toThrow('Network error');
    });
  });

  describe('fetchAllTilesEver', () => {
    it('fetches all tiles data from the correct URL', async () => {
      // Mock the fetch response
      const mockAllTiles: any[] = [
        {
          id: 1,
          blockNumber: 12345,
          timestamp: 1620000000
        },
        {
          id: 2,
          blockNumber: 12346,
          timestamp: 1620000100
        }
      ];

      // Set up the fetch mock to return the mock data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true, json: jest.fn().mockResolvedValueOnce(mockAllTiles)
      });

      // Call the function
      const result = await fetchAllTilesEver();

      // Check that fetch was called with the correct URL
      expect(global.fetch).toHaveBeenCalledWith('https://pixelmap.art/allimages.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      
      // Check that the function returns the expected data
      expect(result).toEqual(mockAllTiles);
    });

    it('propagates network failures', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchAllTilesEver()).rejects.toThrow('Network error');
    });
  });
});
describe('HTTP and payload failures', () => {
  it('rejects error status even when the response contains valid JSON', async () => {
    jest.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503, json: async () => [] } as Response);
    await expect(fetchTiles()).rejects.toThrow('HTTP 503');
  });
  it('rejects malformed collection data', async () => {
    jest.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ error: 'unavailable' }) } as Response);
    await expect(fetchTiles()).rejects.toThrow('unexpected format');
  });
  it('distinguishes a successful empty collection', async () => {
    jest.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);
    await expect(fetchTiles()).resolves.toEqual([]);
  });
});
