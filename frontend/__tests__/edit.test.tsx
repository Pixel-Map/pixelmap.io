import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Edit from '../pages/edit';
import { useWeb3React } from '@web3-react/core';
import { fetchTiles } from '../utils/api';
import { Contract } from 'ethers';

jest.mock('@web3-react/core', () => ({ useWeb3React: jest.fn() }));
jest.mock('../utils/api', () => ({ fetchTiles: jest.fn() }));
jest.mock('ethers', () => ({ ...jest.requireActual('ethers'), Contract: jest.fn() }));
jest.mock('../utils/ImageUtils', () => ({ compressTileCode: () => 'compressed' }));
jest.mock('../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../components/ImageEditorModal', () => () => null);
jest.mock('../components/EditTile', () => ({ tile, handleSave }) => <button onClick={() => handleSave(tile)}>Save tile</button>);

it.each([false, true])('awaits the wallet signer before saving a wrapped=%s tile', async wrapped => {
  const signer = { signer: true };
  const getSigner = jest.fn().mockResolvedValue(signer);
  const contract = { setTile: jest.fn().mockResolvedValue({}), setTileData: jest.fn().mockResolvedValue({}) };
  jest.mocked(useWeb3React).mockReturnValue({ account: 'owner', library: { getSigner } } as any);
  jest.mocked(fetchTiles).mockResolvedValue([{ id: 100, owner: 'owner', wrapped, image: 'fff', url: 'example.com', newPrice: '0.1' }]);
  jest.mocked(Contract).mockImplementation(() => contract as any);
  render(<Edit />);
  fireEvent.click(await screen.findByText('Save tile'));
  await waitFor(() => expect(wrapped ? contract.setTileData : contract.setTile).toHaveBeenCalled());
  expect(getSigner).toHaveBeenCalledWith('owner');
  expect(jest.mocked(Contract).mock.calls.at(-1)?.[2]).toBe(signer);
  if (wrapped) expect(contract.setTileData).toHaveBeenCalledWith(100, 'compressed', 'example.com');
  else expect(contract.setTile).toHaveBeenCalledWith(100, 'compressed', 'example.com', BigInt('100000000000000000'));
});

it('shows wallet errors without an unhandled promise rejection', async () => {
  jest.mocked(useWeb3React).mockReturnValue({ account: 'owner', library: { getSigner: jest.fn().mockRejectedValue(new Error('denied')) } } as any);
  jest.mocked(fetchTiles).mockResolvedValue([{ id: 100, owner: 'owner', image: 'fff' }]);
  render(<Edit />);
  fireEvent.click(await screen.findByText('Save tile'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the tile');
});
