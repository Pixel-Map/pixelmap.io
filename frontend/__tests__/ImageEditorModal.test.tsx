import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ImageEditorModal from '../components/ImageEditorModal';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

// Mock required components
jest.mock('../components/ImageUpload', () => {
  return function MockImageUpload({ changeImage }: { changeImage: (src: string) => void }) {
    return (
      <div data-testid="mock-image-upload">
        <button onClick={() => changeImage('mock-image-src')}>Upload Image</button>
      </div>
    );
  };
});

jest.mock('../components/GridSelect', () => {
  return function MockGridSelect({ changeGrid, col, row }: { changeGrid: (col: number, row: number) => void, col: number, row: number }) {
    return (
      <div data-testid="mock-grid-select" data-col={col} data-row={row}>
        <button onClick={() => changeGrid(2, 2)}>Select 2x2</button>
      </div>
    );
  };
});

jest.mock('../components/ImageDisplay', () => {
  return function MockImageDisplay({ 
    image, 
    cols, 
    rows, 
    maxColors, 
    colorDepth, 
    pixelSize, 
    handleTileSelect 
  }: { 
    image: string, 
    cols: number, 
    rows: number, 
    maxColors: number, 
    colorDepth: number, 
    pixelSize: number, 
    handleTileSelect: (code: string) => void 
  }) {
    return (
      <div 
        data-testid="mock-image-display" 
        data-image={image}
        data-cols={cols}
        data-rows={rows}
        data-max-colors={maxColors}
        data-color-depth={colorDepth}
        data-pixel-size={pixelSize}
      >
        <button onClick={() => handleTileSelect('MOCK_TILE_CODE')}>Select Tile</button>
      </div>
    );
  };
});

// Mock Dialog from @headlessui/react
jest.mock('@headlessui/react', () => {
  const Dialog = ({ children, open, onClose, as: Component = 'div', className }) => {
    if (!open) return null;
    return (
      <Component className={className} data-testid="mock-dialog">
        {children}
      </Component>
    );
  };
  
  Dialog.Overlay = ({ className }) => <div className={className} data-testid="mock-dialog-overlay" />;
  Dialog.Title = ({ children, as: Component = 'h3', className }) => (
    <Component className={className} data-testid="mock-dialog-title">{children}</Component>
  );
  
  return {
    Dialog,
    Switch: ({ checked, onChange }) => (
      <button 
        data-testid="mock-switch" 
        data-checked={checked} 
        onClick={() => onChange(!checked)}
      >
        Toggle
      </button>
    )
  };
});

describe('ImageEditorModal', () => {
  const mockTile: PixelMapTile = {
    id: 123,
    image: 'FFFFFF000000FFFFFF',
    url: 'https://example.com',
    price: '0.1',
    owner: '0x123456789abcdef'
  };
  
  const mockSetIsOpen = jest.fn();
  const mockChangeImage = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders when isOpen is true', () => {
    render(
      <ImageEditorModal 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        tile={mockTile} 
        changeImage={mockChangeImage} 
      />
    );
    
    // Dialog should be rendered
    expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
    
    // Title should have the tile ID
    expect(screen.getByTestId('mock-dialog-title')).toHaveTextContent(`Tile #${mockTile.id} image`);
    
    // Components should be rendered
    expect(screen.getByTestId('mock-image-upload')).toBeInTheDocument();
    expect(screen.getByTestId('mock-grid-select')).toBeInTheDocument();
    expect(screen.getByTestId('mock-image-display')).toBeInTheDocument();
  });
  
  it('does not render when isOpen is false', () => {
    render(
      <ImageEditorModal 
        isOpen={false} 
        setIsOpen={mockSetIsOpen} 
        tile={mockTile} 
        changeImage={mockChangeImage} 
      />
    );
    
    // Dialog should not be rendered
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });
  
  it('updates image when image upload occurs', () => {
    render(
      <ImageEditorModal 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        tile={mockTile} 
        changeImage={mockChangeImage} 
      />
    );
    
    // Initially, no image is set
    const imageDisplay = screen.getByTestId('mock-image-display');
    expect(imageDisplay.getAttribute('data-image')).toBeFalsy();
    
    // Trigger image upload
    fireEvent.click(screen.getByText('Upload Image'));
    
    // Image should be updated
    expect(imageDisplay.getAttribute('data-image')).toBe('mock-image-src');
  });
  
  it('updates grid when grid selection changes', () => {
    render(
      <ImageEditorModal 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        tile={mockTile} 
        changeImage={mockChangeImage} 
      />
    );
    
    // Initial grid values
    const gridSelect = screen.getByTestId('mock-grid-select');
    expect(gridSelect.getAttribute('data-col')).toBe('1');
    expect(gridSelect.getAttribute('data-row')).toBe('1');
    
    // Change grid
    fireEvent.click(screen.getByText('Select 2x2'));
    
    // Grid values should update
    expect(gridSelect.getAttribute('data-col')).toBe('2');
    expect(gridSelect.getAttribute('data-row')).toBe('2');
  });
  
  it('calls changeImage and closes when tile is selected', () => {
    render(
      <ImageEditorModal 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        tile={mockTile} 
        changeImage={mockChangeImage} 
      />
    );
    
    // Select the tile
    fireEvent.click(screen.getByText('Select Tile'));
    
    // changeImage should be called with the tile code
    expect(mockChangeImage).toHaveBeenCalledWith('MOCK_TILE_CODE');
    
    // setIsOpen should be called to close the modal
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });
  
  it('closes the modal when cancel is clicked', () => {
    render(
      <ImageEditorModal 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        tile={mockTile} 
        changeImage={mockChangeImage} 
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // setIsOpen should be called with false
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });
  
  it('updates compression settings when buttons are clicked', () => {
    render(
      <ImageEditorModal 
        isOpen={true} 
        setIsOpen={mockSetIsOpen} 
        tile={mockTile} 
        changeImage={mockChangeImage} 
      />
    );
    
    // Initial values
    const imageDisplay = screen.getByTestId('mock-image-display');
    expect(imageDisplay.getAttribute('data-pixel-size')).toBe('16');
    expect(imageDisplay.getAttribute('data-color-depth')).toBe('12');
    expect(imageDisplay.getAttribute('data-max-colors')).toBe('64');
    
    // Change pixel size to 8x8
    fireEvent.click(screen.getByText('8x8'));
    expect(imageDisplay.getAttribute('data-pixel-size')).toBe('8');
    
    // Change color depth to 8bit
    fireEvent.click(screen.getByText('8bit'));
    expect(imageDisplay.getAttribute('data-color-depth')).toBe('8');
    
    // Change pixel size to 4x4
    fireEvent.click(screen.getByText('4x4'));
    expect(imageDisplay.getAttribute('data-pixel-size')).toBe('4');
    
    // Change color depth to 4bit
    fireEvent.click(screen.getByText('4bit'));
    expect(imageDisplay.getAttribute('data-color-depth')).toBe('4');
  });
});