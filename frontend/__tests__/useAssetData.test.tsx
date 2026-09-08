import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import useAssetData from '../hooks/useAssetData';
import AssetStatus from '../components/AssetStatus';

function Example({ id, load }: { id: string; load: (key: string) => Promise<string> }) {
  const { data, loading, error, retry } = useAssetData(id, load, '');
  return <><AssetStatus loading={loading} error={error} retry={retry} /><span>{data}</span></>;
}

test('shows a failed request and retries successfully', async () => {
  const load = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('Artwork loaded');
  render(<Example id="100" load={load} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Artwork loaded')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(load).toHaveBeenCalledTimes(2);
});

test('ignores an old route response arriving after the current tile', async () => {
  let oldResolve: (value: string) => void;
  const load = jest.fn().mockImplementationOnce(() => new Promise<string>(resolve => { oldResolve = resolve; })).mockResolvedValueOnce('New tile');
  const { rerender } = render(<Example id="100" load={load} />);
  rerender(<Example id="101" load={load} />);
  expect(await screen.findByText('New tile')).toBeInTheDocument();
  await act(async () => { oldResolve!('Old tile'); });
  expect(screen.queryByText('Old tile')).not.toBeInTheDocument();
  expect(screen.getByText('New tile')).toBeInTheDocument();
});

test('closing or unmounting a view ignores an in-flight failure', async () => {
  let reject: (reason: Error) => void;
  const load = jest.fn(() => new Promise<string>((_, fail) => { reject = fail; }));
  const { unmount } = render(<Example id="100" load={load} />);
  unmount();
  await act(async () => { reject!(new Error('late failure')); });
});
