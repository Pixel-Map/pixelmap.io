import React from 'react';
import { render, screen } from '@testing-library/react';
import { countPixelDifferences } from '../utils/pixelDifferences';
import { compressTileCode } from '../utils/ImageUtils';
import TileImageComparison from '../components/TileImageComparison';

jest.mock('../components/TileImage', () => () => null);

it('compares pixels across compressed and uncompressed encodings', () => {
  const before = 'fff'.repeat(256);
  const after = '000' + 'fff'.repeat(255);
  const compressed = compressTileCode(after);
  expect(compressed).not.toBe(after);
  expect(countPixelDifferences(before, compressed)).toBe(1);
  expect(countPixelDifferences(after.toUpperCase(), compressed)).toBe(0);
  expect(countPixelDifferences('0', compressed)).toBeNull();
});

it('handles empty history and shrinking image lists', () => {
  const images = [1, 2, 3].map(blockNumber => ({ blockNumber, image: 'fff'.repeat(256), image_url: '', date: new Date('2026-01-01') }));
  const view = render(<TileImageComparison images={images} />);
  view.rerender(<TileImageComparison images={images.slice(0, 1)} />);
  view.rerender(<TileImageComparison images={[]} />);
  expect(screen.getByText(/no images/i)).toBeInTheDocument();
});
