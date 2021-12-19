import { updateCurrentTileData } from './updateCurrentTileData';
import { Logger } from '@nestjs/common';
import { initializeEthersJS } from './initializeEthersJS';
jest.setTimeout(1000000);

it('returns current data from contract', async () => {
  const { provider, pixelMap, pixelMapWrapper } = await initializeEthersJS();
  // const tileData = await updateCurrentTileData(pixelMap, pixelMapWrapper, new Logger());
  // console.log(tileData);
});
