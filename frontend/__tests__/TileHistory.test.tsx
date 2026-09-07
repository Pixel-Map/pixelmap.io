import React, { Profiler } from 'react';
import { render, screen } from '@testing-library/react';
import TileHistory from '../components/TileHistory';

jest.mock('../components/TileImage', () => () => null);
jest.mock('../components/TileImageComparison', () => () => null);
jest.mock('../utils/mockTileHistory', () => ({ shouldUseMockData: () => false }));

it('renders stable history without an effect loop and responds to new history', () => {
  const commits = jest.fn();
  const tile = { id: 100, owner: 'owner', purchase_history: [], data_history: [] };
  const view = render(<Profiler id="history" onRender={commits}><TileHistory tile={tile} /></Profiler>);
  expect(commits.mock.calls.length).toBeLessThanOrEqual(2);
  expect(screen.getByText(/GENESIS/)).toBeInTheDocument();
  const updated = { ...tile, purchase_history: [{ id: 1, timestamp: '2026-09-01', block_number: 100, tx: 'tx', sold_by: 'seller', purchased_by: 'buyer', price: '2' }] };
  view.rerender(<Profiler id="history" onRender={commits}><TileHistory tile={updated} /></Profiler>);
  expect(screen.getByText(/Purchased for/)).toBeInTheDocument();
  expect(commits.mock.calls.length).toBeLessThanOrEqual(4);
});
