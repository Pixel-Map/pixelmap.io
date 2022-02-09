export async function getCurrentOwner(pixelMap, pixelMapWrapper, transaction, tileLocation): Promise<string> {
  // The first owner was myself.
  const previousData = await pixelMap.tiles(tileLocation, { blockTag: parseInt(transaction.blockNumber) - 1 });
  let owner = previousData.owner;
  if (owner == '0x0000000000000000000000000000000000000000') {
    owner = '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050';
  }

  // If owned by wrapper
  if (owner.toLowerCase() == pixelMapWrapper.address.toLowerCase()) {
    try {
      owner = await pixelMapWrapper.ownerOf(tileLocation, { blockTag: parseInt(transaction.blockNumber) - 1 });
    } catch {
      owner = pixelMapWrapper.address.toLowerCase();
    }
  }
  return owner;
}
