import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import Wrap from '../pages/wrap';
import { useWeb3React } from '@web3-react/core';
import { fetchTiles } from '../utils/api';
import { Contract } from '@ethersproject/contracts';

// Mock dependencies
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn(),
}));

jest.mock('../hooks/useEagerConnect', () => {
  return jest.fn(() => true);
});

jest.mock('../utils/api', () => ({
  fetchTiles: jest.fn(),
}));

jest.mock('@ethersproject/contracts', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    setTile: jest.fn(),
    tiles: jest.fn().mockImplementation(() => Promise.resolve({
      price: '10000000000000000',
      owner: '0xsomeaddress',
    })),
    wrap: jest.fn(),
  })),
}));

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return ({ children }) => <div data-testid="layout-mock">{children}</div>;
});

// Mock the WrapTile component
jest.mock('../components/WrapTile', () => {
  return function MockWrapTile({ tile, index, handlePriceChange, handleSave, handleWrap, handleRefresh }) {
    return (
      <div data-testid="wrap-tile-mock">
        <div>Tile #{tile.id}</div>
        <button data-testid="price-change-btn" onClick={() => handlePriceChange('1.5', index)}>Change Price</button>
        <button data-testid="save-btn" onClick={() => handleSave(tile, index)}>Save</button>
        <button data-testid="wrap-btn" onClick={() => handleWrap(tile, index)}>Wrap</button>
        <button data-testid="refresh-btn" onClick={() => handleRefresh(tile, index)}>Refresh</button>
      </div>
    );
  };
});

// Mock Account component
jest.mock('../components/Account', () => {
  return function MockAccount() {
    return <div data-testid="account-mock">Account Component</div>;
  };
});

describe('Wrap page', () => {
  const mockTiles = [
    {
      id: 1,
      image: 'FFFFFF000000FFFFFF',
      url: 'https://example.com',
      price: '0',
      newPrice: '0.1',
      owner: '0x123456789abcdef',
      wrapped: false
    },
    {
      id: 2,
      image: '000000FFFFFF000000',
      url: 'https://example2.com',
      price: '10000000000000000',
      newPrice: '0.5',
      owner: '0x123456789abcdef',
      wrapped: false
    },
    {
      id: 3,
      image: 'FF0000FF0000FF0000',
      url: 'https://example3.com',
      price: '0',
      newPrice: '0.7',
      owner: '0xdifferent',
      wrapped: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useWeb3React as jest.Mock).mockReturnValue({
      account: '0x123456789abcdef',
      library: {
        getSigner: jest.fn().mockReturnValue('signer')
      }
    });
    
    (fetchTiles as jest.Mock).mockResolvedValue(mockTiles);
  });

  it('renders the page title correctly', async () => {
    await act(async () => {
      render(<Wrap />);
    });
    
    expect(screen.getByText('Wrap your tiles')).toBeInTheDocument();
  });

  it('filters tiles by owner when account is connected', async () => {
    await act(async () => {
      render(<Wrap />);
    });
    
    // Should show two tiles (id 1 and 2) owned by the connected account
    const wrapTiles = screen.getAllByTestId('wrap-tile-mock');
    expect(wrapTiles).toHaveLength(2);
    expect(screen.getByText('Tile #1')).toBeInTheDocument();
    expect(screen.getByText('Tile #2')).toBeInTheDocument();
    expect(screen.queryByText('Tile #3')).not.toBeInTheDocument();
  });

  it('shows connect account message when no account is connected', async () => {
    (useWeb3React as jest.Mock).mockReturnValue({
      account: null,
      library: null
    });
    
    await act(async () => {
      render(<Wrap />);
    });
    
    expect(screen.getByText('Connect your account to wrap your tiles.')).toBeInTheDocument();
    expect(screen.getByTestId('account-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('wrap-tile-mock')).not.toBeInTheDocument();
  });

  it('handles price change correctly', async () => {
    await act(async () => {
      render(<Wrap />);
    });
    
    const priceChangeButtons = screen.getAllByTestId('price-change-btn');
    
    await act(async () => {
      fireEvent.click(priceChangeButtons[0]);
    });
    
    // After price change, the state should be updated
    // We can't directly check state, but we can verify the Contract wasn't called yet
    expect(Contract).not.toHaveBeenCalled();
  });

  it('handles save correctly', async () => {
    await act(async () => {
      render(<Wrap />);
    });
    
    const saveButtons = screen.getAllByTestId('save-btn');
    
    await act(async () => {
      fireEvent.click(saveButtons[0]);
    });
    
    // Contract should be created and setTile should be called
    expect(Contract).toHaveBeenCalledTimes(1);
    const mockContractInstance = (Contract as jest.Mock).mock.results[0].value;
    expect(mockContractInstance.setTile).toHaveBeenCalledWith(
      1, // tile id
      'FFFFFF000000FFFFFF', // image
      'https://example.com', // url
      expect.any(Object) // price in wei (BigNumber)
    );
  });

  it('handles wrap correctly', async () => {
    await act(async () => {
      render(<Wrap />);
    });
    
    const wrapButtons = screen.getAllByTestId('wrap-btn');
    
    await act(async () => {
      fireEvent.click(wrapButtons[1]); // Using the second tile which has a price set
    });
    
    // Contract should be created and wrap should be called
    expect(Contract).toHaveBeenCalledTimes(1);
    const mockContractInstance = (Contract as jest.Mock).mock.results[0].value;
    expect(mockContractInstance.wrap).toHaveBeenCalledWith(
      2, // tile id
      { value: '10000000000000000' } // price
    );
  });

  it('handles refresh correctly', async () => {
    await act(async () => {
      render(<Wrap />);
    });
    
    const refreshButtons = screen.getAllByTestId('refresh-btn');
    
    await act(async () => {
      fireEvent.click(refreshButtons[0]);
    });
    
    // Contract should be created and tiles should be called
    expect(Contract).toHaveBeenCalledTimes(1);
    const mockContractInstance = (Contract as jest.Mock).mock.results[0].value;
    expect(mockContractInstance.tiles).toHaveBeenCalledWith(1); // tile id
  });

  it('handles error during contract interactions', async () => {
    // Mock Contract to throw an error
    (Contract as jest.Mock).mockImplementationOnce(() => ({
      setTile: jest.fn().mockImplementation(() => {
        throw { code: 'INSUFFICIENT_FUNDS' };
      }),
      tiles: jest.fn(),
      wrap: jest.fn()
    }));
    
    await act(async () => {
      render(<Wrap />);
    });
    
    const saveButtons = screen.getAllByTestId('save-btn');
    
    await act(async () => {
      fireEvent.click(saveButtons[0]);
    });
    
    // Error should be handled without crashing the component
    expect(screen.getByText('Wrap your tiles')).toBeInTheDocument();
  });
});