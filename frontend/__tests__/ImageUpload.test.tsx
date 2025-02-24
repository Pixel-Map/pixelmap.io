import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ImageUpload from '../components/ImageUpload';

describe('ImageUpload', () => {
  const mockChangeImage = jest.fn();

  beforeEach(() => {
    mockChangeImage.mockClear();
  });

  it('renders without crashing', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    expect(screen.getByText('Select image')).toBeInTheDocument();
    expect(screen.getByText(/PNG only/)).toBeInTheDocument();
  });

  it('has a file input with correct attributes', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    const fileInput = screen.getByLabelText('Select image');
    
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.png');
    expect(fileInput).toHaveAttribute('id', 'file-upload');
    expect(fileInput).toHaveAttribute('name', 'file-upload');
  });

  it('calls changeImage when file is selected', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    const fileInput = screen.getByLabelText('Select image');
    
    // Create a mock file
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Check if changeImage was called with the file
    expect(mockChangeImage).toHaveBeenCalledTimes(1);
    expect(mockChangeImage).toHaveBeenCalledWith(file);
  });

  it('does not call changeImage when no file is selected', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    const fileInput = screen.getByLabelText('Select image');
    
    // Simulate change event with no files
    fireEvent.change(fileInput, { target: { files: null } });
    
    // Check that changeImage was not called
    expect(mockChangeImage).not.toHaveBeenCalled();
  });

  it('shows the SVG icon', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    const svgIcon = document.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass('mx-auto', 'h-12', 'w-12', 'text-gray-400');
  });

  it('has the correct form attributes', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('encType', 'multipart/form-data');
    expect(form).toHaveClass('flex', 'flex-0', 'flex-grow');
  });

  it('shows help text about PNG requirements', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    const helpText = screen.getByText(/PNG only. For best results, ensure your image is crisp and pixel edges are sharp./);
    expect(helpText).toBeInTheDocument();
    expect(helpText).toHaveClass('text-xs', 'text-gray-400', 'mt-3');
  });

  it('has a styled button label for file input', () => {
    render(<ImageUpload changeImage={mockChangeImage} />);
    const buttonLabel = screen.getByText('Select image').closest('label');
    expect(buttonLabel).toHaveClass('nes-btn', 'is-warning');
  });
});