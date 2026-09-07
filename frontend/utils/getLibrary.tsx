import { BrowserProvider } from 'ethers';

export default function getLibrary(provider: any, connector: any) {
  const library = new BrowserProvider(provider);
  library.pollingInterval = 12000;
  return library;
}
