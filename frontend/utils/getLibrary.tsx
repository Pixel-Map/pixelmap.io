import { Web3Provider } from '@ethersproject/providers';

export default function getLibrary(provider: any, connector: any) {
  return new Web3Provider(provider);
}