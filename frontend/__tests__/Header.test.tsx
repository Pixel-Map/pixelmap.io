import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../components/Header';
import { useWeb3React } from '@web3-react/core';

// Mock required hooks and components
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn()
}));

jest.mock('../hooks/useEagerConnect', () => {
  return jest.fn(() => true);
});

jest.mock('../components/Account', () => {
  return function MockAccount({ triedToEagerConnect }: { triedToEagerConnect: boolean }) {
    return <div data-testid="mock-account" data-tried-to-eager-connect={triedToEagerConnect}>Account Component</div>;
  };
});

jest.mock('../components/SearchBar', () => {
  return function MockSearchBar() {
    return <div data-testid="mock-search-bar">Search Bar</div>;
  };
});

// Mock next/link
jest.mock('next/link', () => {
  const NextLink = ({ children, href }) => {
    return (
      <span data-testid="next-link" href={href}>
        {children}
      </span>
    );
  };
  NextLink.displayName = 'NextLink';
  return NextLink;
});

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useWeb3React as jest.Mock).mockReturnValue({
      account: null,
      library: null
    });
  });

  it('renders the header with logo and navigation links', () => {
    render(<Header />);
    
    // Logo should be present
    expect(screen.getByAltText('PixelMap')).toBeInTheDocument();
    
    // Navigation links should be present - using getAllByText since there are desktop and mobile versions
    expect(screen.getAllByText('Wrapper').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Discord').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tile Updates Log').length).toBeGreaterThan(0);
 
    
    // Components should be rendered
    expect(screen.getByTestId('mock-account')).toBeInTheDocument();
    expect(screen.getByTestId('mock-search-bar')).toBeInTheDocument();
  });

  it('does not show Edit tiles link when wallet is not connected', () => {
    render(<Header />);
    
    // Edit tiles link should not be present
    expect(screen.queryByText('Edit tiles')).not.toBeInTheDocument();
  });

  it('shows Edit tiles link when wallet is connected', () => {
    // Mock a connected wallet
    (useWeb3React as jest.Mock).mockReturnValue({
      account: '0x123456789abcdef',
      library: {}
    });
    
    render(<Header />);
    
    // Edit tiles link should be present
    const editTilesLinks = screen.getAllByText('Edit tiles');
    expect(editTilesLinks.length).toBeGreaterThan(0); // Should have at least one (desktop or mobile)
  });

  it('passes triedToEagerConnect to Account component', () => {
    render(<Header />);
    
    // Account component should receive triedToEagerConnect
    const accountComponent = screen.getByTestId('mock-account');
    expect(accountComponent.getAttribute('data-tried-to-eager-connect')).toBe('true');
  });

  it('renders external links with target attribute', () => {
    render(<Header />);
    
    // Use a more specific query to get the Discord link (which is external)
    // This needs a more precise selector since there are multiple Discord text elements
    const discordLinks = screen.getAllByText('Discord');
    // Find the link that has the target attribute
    const discordLink = discordLinks.find(link => 
      link.closest('a')?.hasAttribute('target')
    )?.closest('a');
    
    expect(discordLink).toHaveAttribute('href', 'https://discord.pixelmap.io/');
    expect(discordLink).toHaveAttribute('target', '_blank');
  });

  it('renders internal links using Next.js Link component', () => {
    render(<Header />);
    
    // Test for the existence of Next.js links with correct hrefs
    const aboutNextLinks = screen.getAllByTestId('next-link')
      .filter(link => link.getAttribute('href') === '/about');
    
    expect(aboutNextLinks.length).toBeGreaterThan(0);
    expect(aboutNextLinks[0]).toHaveAttribute('href', '/about');
  });
});