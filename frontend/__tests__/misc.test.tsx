import { BigNumber } from '@ethersproject/bignumber';
import {
  shortenIfHex,
  formatEtherscanLink,
  parseBalance,
  cleanUrl,
  formatPrice,
  openseaLink,
  convertEthToWei
} from '../utils/misc';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

describe('misc utils', () => {
  describe('shortenIfHex', () => {
    it('shortens long strings', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const shortened = shortenIfHex(address);
      // Just verify it contains the beginning and end with ellipsis in between
      expect(shortened).toContain('0x1234567890ab');
      expect(shortened).toContain('12345678');
      expect(shortened).toContain('…');
    });

    it('keeps short strings as is', () => {
      const shortAddress = '0x1234';
      const result = shortenIfHex(shortAddress);
      expect(result).toEqual(shortAddress);
    });

    it('respects custom length parameter', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const shortened = shortenIfHex(address, 6);
      // Just verify it contains the beginning and end with ellipsis in between
      expect(shortened).toContain('0x12345');
      expect(shortened).toContain('345678');
      expect(shortened).toContain('…');
    });
  });

  describe('formatEtherscanLink', () => {
    it('formats account links correctly', () => {
      const chainId = 1; // Mainnet
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const link = formatEtherscanLink('Account', [chainId, address]);
      expect(link).toEqual(`https://etherscan.io/address/${address}`);
    });

    it('formats transaction links correctly', () => {
      const chainId = 4; // Rinkeby
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const link = formatEtherscanLink('Transaction', [chainId, txHash]);
      expect(link).toEqual(`https://rinkeby.etherscan.io/tx/${txHash}`);
    });

    it('uses correct prefixes for different networks', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      
      expect(formatEtherscanLink('Account', [1, address])).toContain('https://etherscan.io');
      expect(formatEtherscanLink('Account', [3, address])).toContain('https://ropsten.etherscan.io');
      expect(formatEtherscanLink('Account', [4, address])).toContain('https://rinkeby.etherscan.io');
      expect(formatEtherscanLink('Account', [5, address])).toContain('https://goerli.etherscan.io');
      expect(formatEtherscanLink('Account', [42, address])).toContain('https://kovan.etherscan.io');
    });
  });

  describe('parseBalance', () => {
    it('formats BigNumber values correctly', () => {
      const wei = BigNumber.from('1000000000000000000'); // 1 ETH in wei
      const formatted = parseBalance(wei);
      expect(formatted).toEqual('1');
    });

    it('respects custom decimals parameter', () => {
      const value = BigNumber.from('1000000'); // 1 token with 6 decimals
      const formatted = parseBalance(value, 6);
      expect(formatted).toEqual('1');
    });

    it('handles large numbers correctly', () => {
      const value = BigNumber.from('123456789000000000000000000'); // 123,456,789 ETH
      const formatted = parseBalance(value);
      expect(formatted).toEqual('123,456,789');
    });
  });

  describe('cleanUrl', () => {
    it('leaves URLs with http:// or https:// intact', () => {
      expect(cleanUrl('http://example.com')).toEqual('http://example.com');
      expect(cleanUrl('https://example.com')).toEqual('https://example.com');
    });

    it('adds https:// to URLs without protocol', () => {
      expect(cleanUrl('example.com')).toEqual('https://example.com');
    });

    it('works with URLs containing paths and parameters', () => {
      expect(cleanUrl('example.com/path?param=value')).toEqual('https://example.com/path?param=value');
    });
  });

  describe('formatPrice', () => {
    it('returns "–" for zero price', () => {
      const tile = { openseaPrice: 0 } as PixelMapTile;
      expect(formatPrice(tile)).toEqual('–');
    });

    it('formats non-zero prices with ETH symbol', () => {
      const tile = { openseaPrice: 1.5 } as PixelMapTile;
      expect(formatPrice(tile)).toEqual('1.5Ξ');
    });
  });

  describe('openseaLink', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
      process.env.NEXT_PUBLIC_PIXELMAP_WRAPPER_CONTRACT = '0xWrapperContract';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('generates correct OpenSea links', () => {
      const tileId = 123;
      const link = openseaLink(tileId);
      expect(link).toEqual(`https://opensea.io/assets/${process.env.NEXT_PUBLIC_PIXELMAP_WRAPPER_CONTRACT}/${tileId}`);
    });
  });

  describe('convertEthToWei', () => {
    it('converts ETH strings to wei BigNumber', () => {
      const ethAmount = '1.5';
      const weiAmount = convertEthToWei(ethAmount);
      
      // 1.5 ETH = 1.5 * 10^18 wei = 1500000000000000000 wei
      expect(weiAmount.toString()).toEqual('1500000000000000000');
    });

    it('handles empty or undefined input by returning 0', () => {
      expect(convertEthToWei('').toString()).toEqual('0');
      expect(convertEthToWei(null).toString()).toEqual('0');
      expect(convertEthToWei(undefined).toString()).toEqual('0');
    });
  });
});