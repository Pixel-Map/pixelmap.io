interface AssetStatusProps {
  loading?: boolean;
  error: string;
  retry: () => void;
}

export default function AssetStatus({ loading, error, retry }: AssetStatusProps) {
  if (error) return (
    <div role="alert" className="p-4 text-center bg-white text-gray-900 rounded">
      <p>{error}</p>
      <button type="button" onClick={retry} className="nes-btn mt-3">Try again</button>
    </div>
  );
  if (loading) return <p role="status" className="p-4 text-center">Loading tile data…</p>;
  return null;
}
