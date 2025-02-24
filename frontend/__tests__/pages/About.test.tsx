import React from 'react';
import { render, screen } from '@testing-library/react';
import About from '../../pages/about/index';

// Mock the Layout component
jest.mock('../../components/Layout', () => {
  const LayoutMock = ({ children }) => <>{children}</>;
  LayoutMock.displayName = 'Layout';
  return LayoutMock;
});

// Mock next/link
jest.mock('next/link', () => {
  const LinkMock = ({ children }) => children;
  LinkMock.displayName = 'Link';
  return LinkMock;
});

describe('About page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<About />);
    
    // Check that the component renders
    expect(screen.getByText('The History of PixelMap')).toBeInTheDocument();
  });

  it('displays the correct page title', () => {
    render(<About />);
    
    // The title should be The History of PixelMap
    expect(screen.getByText('The History of PixelMap')).toBeInTheDocument();
  });

  it('contains key history sections', () => {
    render(<About />);
    
    // Check for main history sections
    expect(screen.getByText('What is PixelMap?')).toBeInTheDocument();
    expect(screen.getByText('How do I buy a PixelMap tile?')).toBeInTheDocument();
    expect(screen.getByText('What inspired PixelMap?')).toBeInTheDocument();
    expect(screen.getByText('PixelMap on "This American Life"?')).toBeInTheDocument();
    expect(screen.getByText('What makes PixelMap special?')).toBeInTheDocument();
    expect(screen.getByText('Did PixelMap influence Decentraland?')).toBeInTheDocument();
    expect(screen.getByText('What was the "rediscovery"?')).toBeInTheDocument();
  });

  it('includes important historical facts', () => {
    render(<About />);
    
    // Check for key facts that should be present
    expect(screen.getByText(/PixelMap \(2016\) is often considered an NFT/)).toBeInTheDocument();
    expect(screen.getByText(/second oldest NFT ever created/)).toBeInTheDocument();
    expect(screen.getByText(/going live with PixelMap on/)).toBeInTheDocument();
    expect(screen.getByText(/November 17, 2016/)).toBeInTheDocument();
  });

  it('contains the correct number of images', () => {
    render(<About />);
    
    // Check that all images are present
    const images = screen.getAllByRole('img');

    
    // Check a few specific images
    expect(images[0]).toHaveAttribute('alt', 'PixelMap Adventure');
    expect(images[1]).toHaveAttribute('alt', 'OpenSea');
    expect(images[2]).toHaveAttribute('alt', 'Million Dollar Homepage');
  });

  it('includes links to external resources', () => {
    render(<About />);
    
    // Check for important links
    const successLinks = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'a' && 
             element.className.includes('nes-text is-success');
    });
    
    // There should be multiple external links
    expect(successLinks.length).toBeGreaterThan(5);
    
    // Check for specific important links
    const openSeaLink = screen.getByText('OpenSea');
    expect(openSeaLink).toBeInTheDocument();
    
    const linkToThePast = screen.getByText('This American Life');
    expect(linkToThePast).toBeInTheDocument();
  });


});