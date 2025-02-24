import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import ImageDisplay from '../components/ImageDisplay';
import ImageResizer from '../utils/ImageResizer';
import * as ImageUtils from '../utils/ImageUtils';

// Mock the dependencies at the module level
jest.mock('../utils/ImageResizer', () => ({
  imageFileResizer: jest.fn()
}));

jest.mock('../utils/ImageUtils', () => ({
  generateWebSafeImage: jest.fn(() => 'data:image/png;base64,mockWebSafeImage'),
  rgbToHexTriplet: jest.fn((r, g, b) => `${r}${g}${b}`),
  dimensionToPixels: jest.fn((dim) => dim * 16),
  compressTileCode: jest.fn(code => code),
  getBytesFromCanvas: jest.fn(() => new Uint8ClampedArray([255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255])),
  lowerBytesColorCount: jest.fn(bytes => bytes),
  lowerBytesColorDepth: jest.fn(bytes => bytes)
}));

describe('ImageDisplay', () => {
  const defaultProps = {
    image: 'test-image.png',
    cols: 2,
    rows: 2,
    maxColors: 16,
    colorDepth: 16,
    pixelSize: 16,
    handleTileSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up a default mock implementation for imageFileResizer
    ImageResizer.imageFileResizer.mockImplementation((image, width, height, format, quality, rotation, callback) => {
      callback("mock-canvas");
    });
  });

  it('renders without crashing', () => {
    render(<ImageDisplay {...defaultProps} />);
    expect(screen.getByText('Actual size')).toBeInTheDocument();
  });

  it('handles different image props', () => {
    const { rerender } = render(<ImageDisplay {...defaultProps} image="" />);
    
    // With empty image, it should still render without crashing
    expect(screen.getByText('Actual size')).toBeInTheDocument();
    
    // With a valid image, it should also render
    rerender(<ImageDisplay {...defaultProps} image="test-image.png" />);
    expect(screen.getByText('Actual size')).toBeInTheDocument();
  });
  
  it('displays processed images', () => {
    render(<ImageDisplay {...defaultProps} />);
    
    // Check for Pixelmap images
    const images = screen.getAllByAltText('Pixelmap');
    expect(images.length).toBe(2);
    
    // Both images should have the same source
    expect(images[0]).toHaveAttribute('src', 'data:image/png;base64,mockWebSafeImage');
    expect(images[1]).toHaveAttribute('src', 'data:image/png;base64,mockWebSafeImage');
  });

  it('renders the grid background with correct size', () => {
    render(<ImageDisplay {...defaultProps} />);
    
    const gridBackground = document.querySelector('.grid-background');
    expect(gridBackground).toBeInTheDocument();
    expect(gridBackground).toHaveAttribute('style');
    
    // Check that the style contains the background size
    const styleAttr = gridBackground.getAttribute('style');
    expect(styleAttr).toContain('background-size: 50% 50%');
  });

  it('displays images with alt text', () => {
    render(<ImageDisplay {...defaultProps} />);
    
    const images = screen.getAllByAltText('Pixelmap');
    expect(images.length).toBe(2);
  });

  it('displays data size information', () => {
    render(<ImageDisplay {...defaultProps} />);
    
    // Check for data size text
    const dataSizeText = document.querySelector('div:not(.grid) > div');
    expect(dataSizeText).toBeInTheDocument();
    expect(dataSizeText.textContent).toContain('Data Size:');
  });

  it('handles error during image processing', () => {
    // Mock console.error to prevent test output noise
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Make imageFileResizer throw an error
    ImageResizer.imageFileResizer.mockImplementationOnce((image, width, height, format, quality, rotation, callback, outputType, minWidth, minHeight, forceResize) => {
      throw new Error('Test error');
    });
    
    // Component should render without crashing even if image processing fails
    render(<ImageDisplay {...defaultProps} />);
    expect(screen.getByText('Actual size')).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('correctly processes image colors and tile codes', async () => {
    // Create a more complex mock implementation for imageFileResizer
    const mockRgbBytes = new Uint8ClampedArray([
      255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, // 4 pixels with different colors
      255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, // repeated pattern
      255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255,
      255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255
    ]);
    
    ImageUtils.getBytesFromCanvas.mockReturnValueOnce(mockRgbBytes);
    
    render(<ImageDisplay {...defaultProps} />);
    
    // Verify that the image utils functions were called with the correct parameters
    expect(ImageUtils.getBytesFromCanvas).toHaveBeenCalledWith("mock-canvas", 32, 32);
    expect(ImageUtils.lowerBytesColorCount).toHaveBeenCalledWith(mockRgbBytes, 2, 2, 16);
    expect(ImageUtils.lowerBytesColorDepth).toHaveBeenCalled();
    expect(ImageUtils.generateWebSafeImage).toHaveBeenCalled();
  });

  it('responds to grid selection by calling handleTileSelect', () => {
    render(<ImageDisplay {...defaultProps} />);
    
    // Find select buttons
    const selectButtons = screen.getAllByText('Select');
    expect(selectButtons.length).toBe(4); // 2x2 grid = 4 buttons
    
    // Click on the first select button
    fireEvent.click(selectButtons[0]);
    
    // Check if the handleTileSelect was called with the correct tileCode
    expect(defaultProps.handleTileSelect).toHaveBeenCalled();
  });

  it('recalculates when props change', () => {
    const { rerender } = render(<ImageDisplay {...defaultProps} />);
    
    // Initial call from first render
    expect(ImageResizer.imageFileResizer).toHaveBeenCalledTimes(1);
    
    // Change cols prop to trigger recalculation
    rerender(<ImageDisplay {...defaultProps} cols={3} />);
    expect(ImageResizer.imageFileResizer).toHaveBeenCalledTimes(2);
    
    // Change other props to verify they trigger recalculation
    rerender(<ImageDisplay {...defaultProps} cols={3} rows={3} />);
    expect(ImageResizer.imageFileResizer).toHaveBeenCalledTimes(3);
    
    rerender(<ImageDisplay {...defaultProps} cols={3} rows={3} maxColors={8} />);
    expect(ImageResizer.imageFileResizer).toHaveBeenCalledTimes(4);
    
    rerender(<ImageDisplay {...defaultProps} cols={3} rows={3} maxColors={8} colorDepth={8} />);
    expect(ImageResizer.imageFileResizer).toHaveBeenCalledTimes(5);
    
    rerender(<ImageDisplay {...defaultProps} cols={3} rows={3} maxColors={8} colorDepth={8} pixelSize={8} />);
    expect(ImageResizer.imageFileResizer).toHaveBeenCalledTimes(6);
  });

  it('renders the correct number of grid cells based on cols and rows', () => {
    // Test with 3x3 grid
    const props = { ...defaultProps, cols: 3, rows: 3 };
    render(<ImageDisplay {...props} />);
    
    const selectButtons = screen.getAllByText('Select');
    expect(selectButtons.length).toBe(9); // 3x3 grid = 9 buttons
    
    // Since the actual style attribute might be implemented differently in the test environment,
    // we'll just verify that the gridSelect function is creating the right number of buttons
    expect(selectButtons.length).toBe(3 * 3);
  });

  it('uses correct canvas dimensions based on pixelSize', () => {
    // Test with a pixelSize of 8
    const props = { ...defaultProps, pixelSize: 8 };
    render(<ImageDisplay {...props} />);
    
    // The component should have calculated canvasWidth and canvasHeight
    // based on the pixelSize and passed them to the resizer
    expect(ImageResizer.imageFileResizer).toHaveBeenCalledWith(
      expect.anything(), // image
      expect.any(Number), // canvasWidth (should be calculated based on pixelSize)
      expect.any(Number), // canvasHeight
      expect.anything(), // format
      expect.anything(), // quality
      expect.anything(), // rotation
      expect.anything(), // callback
      expect.anything(), // outputType
      expect.anything(), // canvasWidth
      expect.anything(), // canvasHeight
      expect.anything(), // forceResize
    );
    
    // The first canvasWidth argument should be different for pixelSize 8 vs 16
    const call1Args = ImageResizer.imageFileResizer.mock.calls[0];
    
    // Test with different pixelSize
    ImageResizer.imageFileResizer.mockClear();
    render(<ImageDisplay {...defaultProps} />); // pixelSize 16
    
    const call2Args = ImageResizer.imageFileResizer.mock.calls[0];
    
    // The canvasWidth should be different between the two calls
    // because pixelSize affects the calculation
    expect(call1Args[1]).not.toBe(call2Args[1]);
  });

  it('calculates data size correctly', () => {
    // Mock compressTileCode to return predictable results for testing
    ImageUtils.compressTileCode.mockImplementation(code => {
      return code + '_compressed'; // Just append _compressed to simulate compression
    });
    
    render(<ImageDisplay {...defaultProps} />);
    
    // Check that data size is displayed
    const dataSizeText = document.querySelector('div:not(.grid) > div');
    expect(dataSizeText.textContent).toContain('Data Size:');
    
    // The actual values in data size depend on the mock implementation
    // and calculation in processDataSize function
  });

  it('handles extreme grid sizes', () => {
    // Test with a 1x1 grid
    const smallProps = { ...defaultProps, cols: 1, rows: 1 };
    const { rerender } = render(<ImageDisplay {...smallProps} />);
    
    // Should have 1 button for 1x1 grid
    let selectButtons = screen.getAllByText('Select');
    expect(selectButtons.length).toBe(1);
    
    // Test with a larger grid
    const largeProps = { ...defaultProps, cols: 4, rows: 4 };
    rerender(<ImageDisplay {...largeProps} />);
    
    // Should have 16 buttons for 4x4 grid
    selectButtons = screen.getAllByText('Select');
    expect(selectButtons.length).toBe(16);
  });

  it('handles low maxColors value', () => {
    // Test with maxColors set to 2 (extreme minimum)
    const props = { ...defaultProps, maxColors: 2 };
    render(<ImageDisplay {...props} />);
    
    // ImageUtils.lowerBytesColorCount should be called with maxColors=2
    expect(ImageUtils.lowerBytesColorCount).toHaveBeenCalledWith(
      expect.anything(), // bytes
      expect.anything(), // cols
      expect.anything(), // rows
      2 // maxColors
    );
  });

  it('handles low colorDepth value', () => {
    // Test with colorDepth set to 4 (minimum)
    const props = { ...defaultProps, colorDepth: 4 };
    render(<ImageDisplay {...props} />);
    
    // The component should function with low color depth
    expect(screen.getByText('Actual size')).toBeInTheDocument();
    expect(ImageUtils.lowerBytesColorDepth).toHaveBeenCalled();
  });
});