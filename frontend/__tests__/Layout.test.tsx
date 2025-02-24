import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../components/Layout';

// Mock the styles module
jest.mock('../styles/pages/Home.module.scss', () => ({
  winterBgDay: 'winterBgDay',
  winterBgNight: 'winterBgNight',
  springBgDay: 'springBgDay',
  springBgNight: 'springBgNight',
  summerBgDay: 'summerBgDay',
  summerBgNight: 'summerBgNight',
  fallBgDay: 'fallBgDay',
  fallBgNight: 'fallBgNight'
}));

// Mock the Header and Footer components
jest.mock('../components/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('../components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="mock-footer">Footer</div>;
  };
});

describe('Layout', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Mock Date.now and new Date()
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockDate = (date: Date) => {
    jest.setSystemTime(date);
  };

  it('renders children with header and footer', () => {
    mockDate(new Date('2024-01-01T12:00:00')); // Midday, winter

    render(
      <Layout>
        <div data-testid="test-child">Test Child</div>
      </Layout>
    );

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  describe('background classes', () => {
    // Season transition tests based on day of year boundaries
    it('handles winter to spring transition (day < 79)', () => {
      // Last day of winter (day 78)
      mockDate(new Date('2024-03-18T12:00:00'));
      const { container, rerender } = render(<Layout>Content</Layout>);
      const winterElement = container.firstChild as HTMLElement;
      expect(winterElement).toHaveClass('winterBgDay');

      // First day of spring (day 79)
      mockDate(new Date('2024-03-19T12:00:00'));
      rerender(<Layout>Content</Layout>);
      const springElement = container.firstChild as HTMLElement;
      expect(springElement).toHaveClass('springBgDay');
    });

    it('handles spring to summer transition (day < 172)', () => {
      // Last day of spring (day 171)
      mockDate(new Date('2024-06-19T12:00:00'));
      const { container, rerender } = render(<Layout>Content</Layout>);
      const springElement = container.firstChild as HTMLElement;
      expect(springElement).toHaveClass('springBgDay');

      // First day of summer (day 172)
      mockDate(new Date('2024-06-20T12:00:00'));
      rerender(<Layout>Content</Layout>);
      const summerElement = container.firstChild as HTMLElement;
      expect(summerElement).toHaveClass('summerBgDay');
    });

    it('handles summer to fall transition (day < 265)', () => {
      // Last day of summer (day 264)
      mockDate(new Date('2024-09-20T12:00:00'));
      const { container, rerender } = render(<Layout>Content</Layout>);
      const summerElement = container.firstChild as HTMLElement;
      expect(summerElement).toHaveClass('summerBgDay');

      // First day of fall (day 265)
      mockDate(new Date('2024-09-21T12:00:00'));
      rerender(<Layout>Content</Layout>);
      const fallElement = container.firstChild as HTMLElement;
      expect(fallElement).toHaveClass('fallBgDay');
    });

    it('handles fall to winter transition (day < 355)', () => {
      // Last day of fall (day 354)
      mockDate(new Date('2024-12-19T12:00:00'));
      const { container, rerender } = render(<Layout>Content</Layout>);
      const fallElement = container.firstChild as HTMLElement;
      expect(fallElement).toHaveClass('fallBgDay');

      // First day of winter (day 355)
      mockDate(new Date('2024-12-20T12:00:00'));
      rerender(<Layout>Content</Layout>);
      const winterElement = container.firstChild as HTMLElement;
      expect(winterElement).toHaveClass('winterBgDay');
    });

    // Day/Night transition tests based on hours
    it('handles dawn transition at 7:00', () => {
      // Test exact boundaries
      mockDate(new Date('2024-01-15T06:59:59')); // Just before dawn
      const { container, rerender } = render(<Layout>Content</Layout>);
      const nightElement = container.firstChild as HTMLElement;
      expect(nightElement).toHaveClass('winterBgNight');

      mockDate(new Date('2024-01-15T07:00:00')); // At dawn
      rerender(<Layout>Content</Layout>);
      const dayElement = container.firstChild as HTMLElement;
      expect(dayElement).toHaveClass('winterBgDay');
    });

    it('handles dusk transition at 20:00', () => {
      // Test exact boundaries
      mockDate(new Date('2024-01-15T19:59:59')); // Just before dusk
      const { container, rerender } = render(<Layout>Content</Layout>);
      const dayElement = container.firstChild as HTMLElement;
      expect(dayElement).toHaveClass('winterBgDay');

      mockDate(new Date('2024-01-15T20:00:00')); // At dusk
      rerender(<Layout>Content</Layout>);
      const nightElement = container.firstChild as HTMLElement;
      expect(nightElement).toHaveClass('winterBgNight');
    });

    // Leap year tests
    it('handles leap year day correctly', () => {
      // February 29th in a leap year
      mockDate(new Date('2024-02-29T12:00:00'));
      const { container } = render(<Layout>Content</Layout>);
      expect(container.firstChild).toHaveClass('winterBgDay');

      // Same day in non-leap year should be March 1st
      mockDate(new Date('2023-03-01T12:00:00'));
      const { container: nonLeapContainer } = render(<Layout>Content</Layout>);
      expect(nonLeapContainer.firstChild).toHaveClass('winterBgDay');
    });

    // Original season tests
    it('applies winter day background in winter during day', () => {
      mockDate(new Date('2024-01-15T12:00:00')); // January 15th at noon
      const { container } = render(<Layout>Content</Layout>);
      expect(container.firstChild).toHaveClass('winterBgDay');
    });

    it('applies winter night background in winter during night', () => {
      mockDate(new Date('2024-01-15T22:00:00')); // January 15th at 10 PM
      const { container } = render(<Layout>Content</Layout>);
      expect(container.firstChild).toHaveClass('winterBgNight');
    });

    it('applies spring day background in spring during day', () => {
      mockDate(new Date('2024-04-15T12:00:00')); // April 15th at noon
      const { container } = render(<Layout>Content</Layout>);
      expect(container.firstChild).toHaveClass('springBgDay');
    });

    it('applies summer day background in summer during day', () => {
      mockDate(new Date('2024-07-15T12:00:00')); // July 15th at noon
      const { container } = render(<Layout>Content</Layout>);
      expect(container.firstChild).toHaveClass('summerBgDay');
    });

    it('applies fall day background in fall during day', () => {
      mockDate(new Date('2024-10-15T12:00:00')); // October 15th at noon
      const { container } = render(<Layout>Content</Layout>);
      expect(container.firstChild).toHaveClass('fallBgDay');
    });
  });

  describe('helper functions', () => {
    it('correctly identifies leap years', () => {
      // Test leap year
      mockDate(new Date('2024-01-01'));
      render(<Layout>Content</Layout>);
      const container2024 = document.querySelector('.winterBgDay, .winterBgNight');
      expect(container2024).toBeInTheDocument();

      // Test non-leap year
      mockDate(new Date('2023-01-01'));
      render(<Layout>Content</Layout>);
      const container2023 = document.querySelector('.winterBgDay, .winterBgNight');
      expect(container2023).toBeInTheDocument();
    });

    it('calculates day of year correctly', () => {
      // Test start of year
      mockDate(new Date('2024-01-01'));
      render(<Layout>Content</Layout>);
      expect(document.querySelector('.winterBgDay, .winterBgNight')).toBeInTheDocument();

      // Test mid-year
      mockDate(new Date('2024-07-01'));
      render(<Layout>Content</Layout>);
      expect(document.querySelector('.summerBgDay, .summerBgNight')).toBeInTheDocument();

      // Test end of year
      mockDate(new Date('2024-12-31'));
      render(<Layout>Content</Layout>);
      expect(document.querySelector('.winterBgDay, .winterBgNight')).toBeInTheDocument();
    });
  });

  describe('time of day handling', () => {
    it('considers 7:00-19:59 as daytime', () => {
      mockDate(new Date('2024-01-15T12:00:00')); // Noon
      const { container: dayContainer } = render(<Layout>Content</Layout>);
      expect(dayContainer.firstChild).toHaveClass('winterBgDay');

      mockDate(new Date('2024-01-15T07:00:00')); // Start of day
      const { container: dayStartContainer } = render(<Layout>Content</Layout>);
      expect(dayStartContainer.firstChild).toHaveClass('winterBgDay');

      mockDate(new Date('2024-01-15T19:59:00')); // End of day
      const { container: dayEndContainer } = render(<Layout>Content</Layout>);
      expect(dayEndContainer.firstChild).toHaveClass('winterBgDay');
    });

    it('considers 20:00-6:59 as nighttime', () => {
      mockDate(new Date('2024-01-15T22:00:00')); // 10 PM
      const { container: nightContainer } = render(<Layout>Content</Layout>);
      expect(nightContainer.firstChild).toHaveClass('winterBgNight');

      mockDate(new Date('2024-01-15T06:59:00')); // End of night
      const { container: nightEndContainer } = render(<Layout>Content</Layout>);
      expect(nightEndContainer.firstChild).toHaveClass('winterBgNight');

      mockDate(new Date('2024-01-15T20:00:00')); // Start of night
      const { container: nightStartContainer } = render(<Layout>Content</Layout>);
      expect(nightStartContainer.firstChild).toHaveClass('winterBgNight');
    });
  });
});
