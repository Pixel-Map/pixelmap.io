import getLibrary from '../utils/getLibrary';
import { Contract, Interface, parseEther } from 'ethers';
import pixelABI from '../abi/pixelabi.json';
import wrapperABI from '../abi/wrapperpixelabi.json';

it('uses the injected wallet with async signers and exact transaction values', async () => {
  const account = '0x0000000000000000000000000000000000000001';
  const request = jest.fn(async ({ method }) => {
    if (method === 'eth_chainId') return '0x1';
    if (method === 'eth_accounts') return [account];
    throw new Error(`Unexpected wallet request: ${method}`);
  });
  const library = getLibrary({ request }, undefined);
  try {
    const signer = await library.getSigner(account);
    const original = new Contract('0x015a06a433353f8db634df4eddf0c109882a15ab', pixelABI, signer);
    const edit = await original.setTile.populateTransaction(100, 'fff'.repeat(256), 'example.com', parseEther('0.1'));
    const decoded = new Interface(pixelABI).decodeFunctionData('setTile', edit.data!);
    expect(decoded[0]).toBe(BigInt(100));
    expect(decoded[3]).toBe(BigInt('100000000000000000'));
    const wrapped = new Contract('0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b', wrapperABI, signer);
    const wrap = await wrapped.wrap.populateTransaction(100, { value: parseEther('0.1') });
    expect(wrap.value).toBe(BigInt('100000000000000000'));
    expect(request.mock.calls.every(([arg]) => arg.method !== 'eth_sendTransaction')).toBe(true);
  } finally { library.destroy(); }
});
