import React from 'react';
import { render, act } from '@testing-library/react';
import Loader from '../components/Loader';

// Properly mock setInterval and clearInterval
jest.useFakeTimers();

describe('Loader', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<Loader />);
    const starIcon = container.querySelector('.nes-icon.star.is-large');
    expect(starIcon).toBeInTheDocument();
  });

  it('initially renders with transparent star', () => {
    const { container } = render(<Loader />);
    const starIcon = container.querySelector('.nes-icon.star.is-large');
    expect(starIcon).toHaveClass('is-transparent');
  });

  it('cycles through animation states correctly', () => {
    const { container } = render(<Loader />);
    const starIcon = container.querySelector('.nes-icon.star.is-large');
    
    // Initially transparent
    expect(starIcon).toHaveClass('is-transparent');
    
    // After 500ms, should be half
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-half');
    
    // After another 500ms, should be full
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-full');
    
    // After another 500ms, should be transparent again
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-transparent');
  });

  it('completes multiple animation cycles', () => {
    const { container } = render(<Loader />);
    const starIcon = container.querySelector('.nes-icon.star.is-large');
    
    // First cycle
    expect(starIcon).toHaveClass('is-transparent');
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-half');
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-full');
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-transparent');
    
    // Second cycle
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-half');
    
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(starIcon).toHaveClass('is-full');
  });

  it('clears interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    const { unmount } = render(<Loader />);
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('has correct container styling', () => {
    const { container } = render(<Loader />);
    const loaderContainer = container.firstChild;
    expect(loaderContainer).toHaveClass('flex', 'items-center', 'justify-center', 'my-4', 'lg:my-12');
  });
});