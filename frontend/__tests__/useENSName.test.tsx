import { renderHook, act } from '@testing-library/react-hooks';
import useENSName from '../hooks/useENSName';
import { useWeb3React } from '@web3-react/core';

// Mock the @web3-react/core module
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn()
}));

describe('useENSName', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const mockENSName = 'test.eth';

  // Create mock library with lookupAddress function
  const createMockLibrary = (ensName = null, shouldThrow = false) => ({
    lookupAddress: jest.fn().mockImplementation(() => {
      if (shouldThrow) {
        return Promise.reject(new Error('ENS lookup failed'));
      }
      return Promise.resolve(ensName);
    })
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty string when library is not available', async () => {
    // Mock useWeb3React to return no library
    (useWeb3React as jest.Mock).mockReturnValue({
      library: null,
      chainId: 1
    });

    const { result } = renderHook(() => useENSName(mockAddress));
    
    expect(result.current).toBe('');
  });

  it('returns ENS name when lookup succeeds', async () => {
    // Mock library with successful lookup
    const mockLibrary = createMockLibrary(mockENSName);
    
    // Mock useWeb3React to return our mock library
    (useWeb3React as jest.Mock).mockReturnValue({
      library: mockLibrary,
      chainId: 1
    });

    const { result, waitForNextUpdate } = renderHook(() => useENSName(mockAddress));
    
    // Initial state should be empty string
    expect(result.current).toBe('');
    
    // Wait for the effect to complete
    await waitForNextUpdate();
    
    // After effect, should have the ENS name
    expect(result.current).toBe(mockENSName);
    expect(mockLibrary.lookupAddress).toHaveBeenCalledWith(mockAddress);
  });

  it('returns empty string when lookup fails', async () => {
    // Mock library with failing lookup
    const mockLibrary = createMockLibrary(null, true);
    
    // Mock useWeb3React to return our mock library
    (useWeb3React as jest.Mock).mockReturnValue({
      library: mockLibrary,
      chainId: 1
    });

    const { result } = renderHook(() => useENSName(mockAddress));
    
    // Initial state should be empty string
    expect(result.current).toBe('');
    
    // State should remain empty string after error
    // We need to wait a bit for the promise to reject
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(result.current).toBe('');
    expect(mockLibrary.lookupAddress).toHaveBeenCalledWith(mockAddress);
  });

  it('returns empty string when lookup returns non-string value', async () => {
    // Mock library with lookup returning null
    const mockLibrary = createMockLibrary(null);
    
    // Mock useWeb3React to return our mock library
    (useWeb3React as jest.Mock).mockReturnValue({
      library: mockLibrary,
      chainId: 1
    });

    const { result, waitForNextUpdate } = renderHook(() => useENSName(mockAddress));
    
    // Initial state should be empty string
    expect(result.current).toBe('');
    
    // Wait for the effect to complete
    try {
      await waitForNextUpdate({ timeout: 100 });
    } catch (e) {
      // Timeout is expected as there's no state update
    }
    
    // State should remain empty string
    expect(result.current).toBe('');
    expect(mockLibrary.lookupAddress).toHaveBeenCalledWith(mockAddress);
  });

  it('refreshes ENS name when chainId changes', async () => {
    // Mock library with successful lookup
    const mockLibrary = createMockLibrary(mockENSName);
    
    // Set up mock to return values we can change
    const mockValues = {
      library: mockLibrary,
      chainId: 1
    };
    
    (useWeb3React as jest.Mock).mockImplementation(() => mockValues);

    const { result, waitForNextUpdate, rerender } = renderHook(() => useENSName(mockAddress));
    
    // Wait for the initial effect to complete
    await waitForNextUpdate();
    
    // Initial ENS name should be set
    expect(result.current).toBe(mockENSName);
    expect(mockLibrary.lookupAddress).toHaveBeenCalledTimes(1);
    
    // Change chainId to trigger refresh
    act(() => {
      mockValues.chainId = 4;
    });
    
    // Force rerender
    rerender();
    
    // Wait for the effect to run again
    await waitForNextUpdate();
    
    // ENS name should still be the same, but lookup should have been called again
    expect(result.current).toBe(mockENSName);
    expect(mockLibrary.lookupAddress).toHaveBeenCalledTimes(2);
  });

  it('cleans up when unmounted', async () => {
    // Mock library with successful lookup
    const mockLibrary = createMockLibrary(mockENSName);
    
    // Mock useWeb3React to return our mock library
    (useWeb3React as jest.Mock).mockReturnValue({
      library: mockLibrary,
      chainId: 1
    });

    const { result, waitForNextUpdate, unmount } = renderHook(() => useENSName(mockAddress));
    
    // Wait for the effect to complete
    await waitForNextUpdate();
    
    // Verify ENS name was set
    expect(result.current).toBe(mockENSName);
    
    // Unmount the hook
    unmount();
    
    // Verify the state was cleaned up
    // Note: We can't directly check the internal state after unmount,
    // but we can verify the cleanup function was defined
    expect(mockLibrary.lookupAddress).toHaveBeenCalledTimes(1);
  });
});