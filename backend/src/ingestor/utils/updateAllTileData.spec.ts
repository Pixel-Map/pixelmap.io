import { getCurrentTileData } from './updateAllTileData';
import { initializeEthersJS } from './initializeEthersJS';
jest.setTimeout(1000000);

it('returns the current right information for an unwrapped tile', async () => {
  const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
  const tileData = await getCurrentTileData(1984, pixelMap, pixelMapWrapper);
  expect(tileData.owner).toBe('0xc20dAA952d35677eb5DC40b8e0Be84920f40aD68');
  expect(tileData.url).toBe('www.ethereum.org');
  expect(tileData.wrapped).toBe(false);
  expect(tileData.image).toBe(
    // eslint-disable-next-line max-len
    '5974964964974964964964964964964974964974974964974964965975965964964964964964964964974965964974964964964974974964965964964964964964964974964964964965972433543645974964964964964974753533544864964965971211212334865964964964964863641221224864964974964974973861114974964964961112435974965974964965970211212111111111211211111111210211214754974864652432432331111111111111111112222433444553753650115974974751110111111221111112435964961322324965974a7243232497010354486111496364111496486496596497122364486496111254486111597486375132476497496597011365496597142365486232496496497211576496497597111364496497597497496597496496496010475496496597497597496496597496596496497496597586597497497597497496597597496497496496596497496496597497496496496496496496496496496496496496496496496496',
  );
});

it('returns the current right information for a wrapped tile', async () => {
  const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
  const tileData = await getCurrentTileData(3967, pixelMap, pixelMapWrapper);
  expect(tileData.owner).toBe('0xD317A3744F60c5cbcDe7c82DF90a6513409198A2');
  expect(tileData.url).toBe('');
  expect(tileData.wrapped).toBe(true);
  expect(tileData.image).toBe(
    // eslint-disable-next-line max-len
    `b#I@XPx5RR%FLHq%(+gER#:Wd}HIRxx6iE.H3ZcW[\`/t^w\"w)iY/ZDN{BD>s(dBza/h&=yLH3>.i)wN^=e@GQ!bc}03@p}Z[oVl>boJ(?nP\`?4X4M{1E(_hs*#@.dNt]F*,@~#9)\`{O|l~?.Z$QKi04VV>tm|;yd5^`,
  );
});
