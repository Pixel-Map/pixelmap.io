import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../components/Footer';

// Mock the environment variables
const originalEnv = process.env;

describe('Footer', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_PIXELMAP_CONTRACT: '0x1234567890abcdef1234567890abcdef12345678',
      NEXT_PUBLIC_PIXELMAP_WRAPPER_CONTRACT: '0xabcdef1234567890abcdef1234567890abcdef12'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders without crashing', () => {
    render(<Footer />);
    expect(screen.getByText('PixelMap Contract')).toBeInTheDocument();
    expect(screen.getByText('Wrapped PixelMap Contract')).toBeInTheDocument();
    expect(screen.getByText('Created in 2016 by kenerwin88')).toBeInTheDocument();
  });

  it('has correct links to contracts on Etherscan', () => {
    render(<Footer />);
    
    const pixelmapContractLink = screen.getByText('PixelMap Contract');
    expect(pixelmapContractLink).toHaveAttribute(
      'href', 
      `https://etherscan.io/address/${process.env.NEXT_PUBLIC_PIXELMAP_CONTRACT}`
    );
    expect(pixelmapContractLink).toHaveAttribute('target', '_blank');
    expect(pixelmapContractLink).toHaveAttribute('rel', 'noreferrer');
    
    const wrappedPixelmapContractLink = screen.getByText('Wrapped PixelMap Contract');
    expect(wrappedPixelmapContractLink).toHaveAttribute(
      'href', 
      `https://etherscan.io/address/${process.env.NEXT_PUBLIC_PIXELMAP_WRAPPER_CONTRACT}`
    );
    expect(wrappedPixelmapContractLink).toHaveAttribute('target', '_blank');
    expect(wrappedPixelmapContractLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('has correct social media link', () => {
    render(<Footer />);
    
    const twitterLink = screen.getByText('Created in 2016 by kenerwin88');
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/KenErwin88');
    expect(twitterLink).toHaveAttribute('target', '_blank');
    expect(twitterLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('applies correct styling to contract links', () => {
    render(<Footer />);
    
    const pixelmapContractLink = screen.getByText('PixelMap Contract');
    expect(pixelmapContractLink).toHaveClass('nes-btn', 'is-primary', 'text-sm', 'font-semibold', 'text-gray-700');
    
    const wrappedPixelmapContractLink = screen.getByText('Wrapped PixelMap Contract');
    expect(wrappedPixelmapContractLink).toHaveClass('nes-btn', 'is-primary', 'text-sm', 'font-semibold', 'text-gray-700');
  });

  it('applies correct styling to footer container', () => {
    render(<Footer />);
    
    const footer = document.querySelector('footer');
    expect(footer).toHaveClass('py-4', 'px-4', 'sm:px-6');
    
    // Check the inner div for responsive classes
    const innerDiv = footer.querySelector('div');
    expect(innerDiv).toHaveClass('text-center', 'md:text-left', 'md:flex', 'md:justify-between');
  });
});