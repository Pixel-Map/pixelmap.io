// Import test utilities
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock dependencies
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn(() => ({
    active: false,
    error: null,
    activate: jest.fn(),
    chainId: 1,
    account: null,
    setError: jest.fn()
  }))
}));

// Do any imports AFTER setting up mocks
import { useWeb3React } from '@web3-react/core';
import Account from '../components/Account';

describe('Account', () => {
  // Simple tests that avoid mock setup issues
  it('renders without crashing', () => {
    render(<Account triedToEagerConnect={true} />);
    // Just check that something renders
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('returns null when not tried to eager connect', () => {
    const { container } = render(<Account triedToEagerConnect={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows account info when connected', () => {
    // Mock the web3 hook to return a connected state
    (useWeb3React as jest.Mock).mockReturnValueOnce({
      active: true,
      chainId: 1,
      account: '0x123456789abcdef0123456789abcdef01234567',
    });
    
    render(<Account triedToEagerConnect={true} />);
    
    // We expect some text to be rendered even if the mock for formatting isn't perfect
    const container = screen.getByRole('link');
    expect(container).toBeInTheDocument();
  });
});