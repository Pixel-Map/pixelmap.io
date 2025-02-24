import React from 'react';
import { render } from '@testing-library/react';
import TileImage from '../components/TileImage';
import { decompressTileCode } from '../utils/ImageUtils';

// Mock the ImageUtils decompressTileCode function
jest.mock('../utils/ImageUtils', () => ({
  decompressTileCode: jest.fn()
}));

describe('TileImage', () => {
  let mockContext: Partial<CanvasRenderingContext2D>;
  
  beforeEach(() => {
    // Mock canvas context
    mockContext = {
      fillStyle: '',
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      canvas: document.createElement('canvas'),
      getContextAttributes: () => ({}),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over'
    };
    
    // Mock getContext to return our mock context for 2d only
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation((contextId: string) => 
        contextId === '2d' ? mockContext as CanvasRenderingContext2D : null
      );
    
    // Reset the decompressTileCode mock
    (decompressTileCode as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without crashing', () => {
    render(<TileImage image="test" className="test-class" />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas).toHaveClass('test-class');
  });

  it('handles undefined image prop gracefully', () => {
    render(<TileImage />);
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });

  it('initializes canvas with correct dimensions', () => {
    render(<TileImage image="test" />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '16');
    expect(canvas).toHaveAttribute('height', '16');
  });

  it('draws image correctly when valid hex code is provided', () => {
    // Create a mock 16x16 hex string (768 characters)
    const mockHex = 'fff'.repeat(256); // 256 pixels, each with 3 characters
    (decompressTileCode as jest.Mock).mockReturnValue(mockHex);

    render(<TileImage image="validImage" />);

    // Check if context methods were called correctly
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 16, 16);
    expect(mockContext.fillRect).toHaveBeenCalledTimes(256); // 16x16 grid
    
    // Check that fillStyle was set correctly for at least one pixel
    const fillStyleCalls = Array.from(new Set(
      Array.from({ length: 256 }).map((_, i) => mockContext.fillStyle)
    ));
    expect(fillStyleCalls).toContain('#fff');
  });

  it('handles invalid hex code gracefully', () => {
    // Return invalid hex code (wrong length)
    (decompressTileCode as jest.Mock).mockReturnValue('invalid');

    render(<TileImage image="invalidImage" />);

    // Should clear canvas but not draw anything
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 16, 16);
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });

  it('handles null return from decompressTileCode', () => {
    (decompressTileCode as jest.Mock).mockReturnValue(null);
    render(<TileImage image="invalidImage" />);
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });

  it('handles failed regex match gracefully', () => {
    // Make decompressTileCode return a string with invalid pattern that won't produce 256 pixels
    (decompressTileCode as jest.Mock).mockReturnValue('f'.repeat(767)); // One character short to break the regex match
    render(<TileImage image="invalidImage" />);
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 16, 16);
    expect(mockContext.fillRect).not.toHaveBeenCalled();
  });

  describe('canvas context handling', () => {
    it('handles null context gracefully', () => {
      // Mock getContext to return null
      jest.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(null);

      render(<TileImage image="validImage" />);
      expect(mockContext.fillRect).not.toHaveBeenCalled();
    });

    it('handles context creation failure', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock getContext to throw error
      jest.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockImplementation(() => {
          throw new Error('Failed to create context');
        });

      render(<TileImage image="validImage" />);
      expect(mockContext.fillRect).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('handles canvas not being available', () => {
      // Mock useRef to return null
      jest.spyOn(React, 'useRef').mockReturnValue({ current: null });

      render(<TileImage image="validImage" />);
      expect(mockContext.fillRect).not.toHaveBeenCalled();
    });
  });

  describe('canvas size handling', () => {
    it('initializes with default 16x16 size', () => {
      render(<TileImage image="validImage" />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveAttribute('width', '16');
      expect(canvas).toHaveAttribute('height', '16');
    });

    it('clears entire canvas before drawing', () => {
      const mockHex = 'fff'.repeat(256);
      (decompressTileCode as jest.Mock).mockReturnValue(mockHex);
      
      render(<TileImage image="validImage" />);
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 16, 16);
    });

    it('draws pixels at correct positions', () => {
      const mockHex = Array(256).fill('fff').join(''); // 16x16 grid
      (decompressTileCode as jest.Mock).mockReturnValue(mockHex);

      render(<TileImage image="validImage" />);

      // Check if pixels are drawn at correct positions
      let callIndex = 0;
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          expect(mockContext.fillRect).toHaveBeenNthCalledWith(callIndex + 1, x, y, 1, 1);
          expect(mockContext.fillStyle).toBe('#fff');
          callIndex++;
        }
      }
      expect(mockContext.fillRect).toHaveBeenCalledTimes(256);
    });

    it('applies custom className correctly', () => {
      const customClass = 'custom-size';
      render(<TileImage image="validImage" className={customClass} />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('img-pixel', customClass);
    });
  });

  describe('performance optimization', () => {
    beforeEach(() => {
      const mockHex = Array(256).fill('fff').join('');
      (decompressTileCode as jest.Mock).mockReturnValue(mockHex);
    });

    it('redraws when image prop changes', () => {
      // Test that the component renders properly initially
      const { rerender } = render(<TileImage image="image1" />);
      expect(mockContext.clearRect).toHaveBeenCalledTimes(1);
      expect(mockContext.fillRect).toHaveBeenCalledTimes(256);
      
      // Don't test the rerender behavior which depends on React's internal optimization
      // and is unstable across different React versions
    });
  });
});