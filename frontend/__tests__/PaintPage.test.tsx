/** @jest-environment-options {"url":"https://pixelmap.io/paint/293"} */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PaintPage, { getStaticPaths, getStaticProps } from '../pages/paint/[id]';
import { fetchSingleTile } from '../utils/api';
import * as paintUtils from '../utils/marioPaint';

jest.mock('next/router', () => ({ useRouter: () => ({ query: {} }) }));
jest.mock('next/head', () => ({ children }) => <>{children}</>);
jest.mock('next/link', () => ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>);
jest.mock('../utils/api', () => ({ fetchSingleTile: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: jest.fn() } as any);
});
afterEach(() => jest.restoreAllMocks());

test('exports all tile URLs with stable initial route identity', () => {
  const paths = getStaticPaths();
  expect(paths.paths).toHaveLength(3970);
  expect(paths.paths[3969].params.id).toBe('3969');
  expect(paths.fallback).toBe(false);
  expect(getStaticProps({ params: { id: '439' } })).toEqual({ props: { id: '439' } });
});

test('offers local ROM selection for valid art and rejects an invalid file', async () => {
  (fetchSingleTile as jest.Mock).mockResolvedValue({ id: 439, image: 'f00'.repeat(256) });
  render(<PaintPage id="439" />);
  const input = await screen.findByLabelText('Choose Mario Paint ROM');
  expect(screen.getByRole('img', { name: /approximated/ })).toBeInTheDocument();
  expect(screen.queryByTitle('Mario Paint drawing tile 439')).not.toBeInTheDocument();
  fireEvent.change(input, { target: { files: [new File(['bad'], 'bad.sfc')] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose the Mario Paint');
});

test('does not invent artwork for a malformed tile', async () => {
  (fetchSingleTile as jest.Mock).mockResolvedValue({ id: 123, image: '1' });
  render(<PaintPage id="123" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('valid 16 × 16');
  expect(screen.queryByLabelText('Choose Mario Paint ROM')).not.toBeInTheDocument();
});

test('lets a visitor retry a failed tile request', async () => {
  (fetchSingleTile as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ id: 439, image: '000'.repeat(256) });
  render(<PaintPage id="439" />);
  fireEvent.click(await screen.findByRole('button', { name: /try again/i }));
  await waitFor(() => expect(screen.getByLabelText('Choose Mario Paint ROM')).toBeInTheDocument());
  expect(fetchSingleTile).toHaveBeenCalledTimes(2);
});

test('automatically loads and validates the hosted ROM on the production domain', async () => {
  (fetchSingleTile as jest.Mock).mockResolvedValue({ id: 293, image: 'f00'.repeat(256) });
  (fetch as jest.Mock).mockResolvedValue({ ok: true, blob: async () => new Blob(['rom']) });
  const read = jest.spyOn(paintUtils, 'readMarioRom').mockResolvedValue(new ArrayBuffer(1048576));
  render(<PaintPage id="293" />);
  expect(await screen.findByTitle('Mario Paint drawing tile 293')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('/mario.sfc', expect.objectContaining({ cache: 'no-store' }));
  expect(read).toHaveBeenCalledWith(expect.objectContaining({ name: 'mario.sfc' }));
  expect(screen.queryByLabelText('Choose Mario Paint ROM')).not.toBeInTheDocument();
});

test('keeps manual selection available when the local ROM is absent', async () => {
  (fetchSingleTile as jest.Mock).mockResolvedValue({ id: 293, image: '000'.repeat(256) });
  render(<PaintPage id="293" />);
  await waitFor(() => expect(screen.getByLabelText('Choose Mario Paint ROM')).toBeEnabled());
  expect(fetch).toHaveBeenCalledWith('/mario.sfc', expect.anything());
  expect(screen.queryByTitle('Mario Paint drawing tile 293')).not.toBeInTheDocument();
});
