import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapToggles from '../components/MapToggles';
import { useWeb3React } from '@web3-react/core';

// Mock the web3React hook
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn()
}));

describe('MapToggles', () => {
  const mockSetShowOwned = jest.fn();
  const mockSetShowForSale = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useWeb3React as jest.Mock).mockReturnValue({
      account: '0x123456789abcdef'
    });
  });

  it('renders both toggles when wallet is connected', () => {
    render(
      <MapToggles
        showOwned={false}
        setShowOwned={mockSetShowOwned}
        showForSale={false}
        setShowForSale={mockSetShowForSale}
      />
    );
    
    // Both toggles should be visible
    expect(screen.getByText('For Sale')).toBeInTheDocument();
    expect(screen.getByText('Owned')).toBeInTheDocument();
    
    // Both checkboxes should be unchecked
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('renders only the For Sale toggle when wallet is not connected', () => {
    // Mock wallet not connected
    (useWeb3React as jest.Mock).mockReturnValue({
      account: null
    });
    
    render(
      <MapToggles
        showOwned={false}
        setShowOwned={mockSetShowOwned}
        showForSale={false}
        setShowForSale={mockSetShowForSale}
      />
    );
    
    // Only For Sale toggle should be visible
    expect(screen.getByText('For Sale')).toBeInTheDocument();
    expect(screen.queryByText('Owned')).not.toBeInTheDocument();
    
    // Only one checkbox should be present
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(1);
  });

  it('renders with correct checked state for toggles', () => {
    render(
      <MapToggles
        showOwned={true}
        setShowOwned={mockSetShowOwned}
        showForSale={true}
        setShowForSale={mockSetShowForSale}
      />
    );
    
    // Both checkboxes should be checked
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  it('calls setShowForSale when For Sale toggle is clicked', () => {
    render(
      <MapToggles
        showOwned={false}
        setShowOwned={mockSetShowOwned}
        showForSale={false}
        setShowForSale={mockSetShowForSale}
      />
    );
    
    // Get the For Sale checkbox and click it
    const forSaleCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(forSaleCheckbox);
    
    // setShowForSale should be called with true
    expect(mockSetShowForSale).toHaveBeenCalledWith(true);
  });

  it('calls setShowOwned when Owned toggle is clicked', () => {
    render(
      <MapToggles
        showOwned={false}
        setShowOwned={mockSetShowOwned}
        showForSale={false}
        setShowForSale={mockSetShowForSale}
      />
    );
    
    // Get the Owned checkbox and click it
    const ownedCheckbox = screen.getAllByRole('checkbox')[1];
    fireEvent.click(ownedCheckbox);
    
    // setShowOwned should be called with true
    expect(mockSetShowOwned).toHaveBeenCalledWith(true);
  });

  it('calls setShowForSale with false when For Sale toggle is unchecked', () => {
    render(
      <MapToggles
        showOwned={false}
        setShowOwned={mockSetShowOwned}
        showForSale={true}
        setShowForSale={mockSetShowForSale}
      />
    );
    
    // Get the For Sale checkbox and click it to uncheck
    const forSaleCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(forSaleCheckbox);
    
    // setShowForSale should be called with false
    expect(mockSetShowForSale).toHaveBeenCalledWith(false);
  });
});