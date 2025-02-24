import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ImageDisplay from '../components/ImageDisplay';
import ImageResizer from '../utils/ImageResizer';

// Mock the dependencies at the module level
jest.mock('../utils/ImageResizer', () => ({
  imageFileResizer: jest.fn()
}));

jest.mock('../utils/ImageUtils', () => ({
  generateWebSafeImage: jest.fn(() => 'data:image/png;base64,mockWebSafeImage'),
  rgbToHexTriplet: jest.fn(),
  dimensionToPixels: jest.fn((dim) => dim * 16),
  compressTileCode: jest.fn(),
  getBytesFromCanvas: jest.fn(() => new Uint8ClampedArray([0, 0, 0, 0, 0, 0])),
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
});