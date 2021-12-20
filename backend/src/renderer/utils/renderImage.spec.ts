import { decompressTileCode } from './decompressTileCode';
import { renderImage } from './renderImage';

it('successfully renders a PNG image from a compressed image string', async () => {
  const compressedImage =
    // eslint-disable-next-line max-len
    'b#I@Y8KucA>C=C$amO}}.yB"wn7S4JMIgmxvTR#6?fMx89"gv=Ng~)}w.FaSy63j:PAgZ@8klfYnduUCA4jNfEe#:d~OC(~3NJ}r8.$_>rsm*vE}W0z7i~b~UV&6IsQ&@3r2.|8gWFd=vky~Y.|ookg=<hy4>*c?k[j.4{j)D|Txq?Hkb9?cYSf';
  await renderImage(decompressTileCode(compressedImage), 'cache/test.png');
  expect(decompressTileCode(compressedImage)).toBe(
    // eslint-disable-next-line max-len
    'd84000000d84940000000000355355355355355134134355d84d84d849400001741742b5000355355134134355355355d84d84d849400001741742b50003553551341343553553559400000000001741741740006300000003553553553551340001741742b51740000006306300000001341341341341342b52b52b52b5174000000000c730000001341341341341342b52b52b52b5174000000000c730000001341341341341342b5174174174174000000c73c73000000466466466466466db1000000db1db1174174000c73000000466134134134355db1db1db1174174000000000000134134466355355355134db1db1db1174174000000000000134134466355355355134174174174000000900900000355134134466355355355355000000000900d50000000000134134134466355355355134000000000000000000000355355134134466134134134355000000000000000000000355355134134466134134134355000000000000134134134134134134134134134134134134',
  );
});

it('successfully renders a PNG image from tile #793', async () => {
  const compressedImage =
    // eslint-disable-next-line max-len
    'b#I@O::YABaLvWDv5urAW,2Org@WKr7D^h,KI(QJ($W")*=P1Zq]10^qzVBjX0xVY:ER1:m2;XMAqiz_pC';
  await renderImage(decompressTileCode(compressedImage), 'cache/test-793.png');
  expect(decompressTileCode(compressedImage)).toBe(
    // eslint-disable-next-line max-len
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000fff000fff000fffffffff000fff000000000000ffffffffffff000fff000fffffffff000fff000ffffff000ffffffffffffffffff000fffffffff000fff000ffffff000ffffffffffffffffff000fffffffff000fff000ffffff000ffffffffffffffffff000fffffffff000fff000ffffff000ffffffffffff000fff000000fff000000fff000ffffff000fff000000fff000ffffff000fff000ffffff000000000000fff000000fff000ffffff000fff000ffffff000ffffff000ffffff000fff000ffffff000fff000ffffff000ffffff000ffffff000fff000ffffff000fff000ffffff000ffffff000ffffff000fff000ffffff000000000ffffff000ffffff000ffffff000fff000ffffff000000000ffffff000ffffff000000000000fff000fffffffff000fffffffff000000000ffffffffffffffffffffffffffffffffffffffffffffffff',
  );
});

it('successfully renders a PNG image from tile #293', async () => {
  const compressedImage =
    // eslint-disable-next-line max-len
    'b#I@w0MIaT0I#Ffal|vSMm,+VLr&z@im6FWEtyxKT]"UXPGVarK>2|G.?Yu{}SB=0viPcEwSj{l^T>MdQP!W!^5,)LG_tQ_LlIcZ_%3d,=6)wTY34Hgq/azKP?t3cPl~>_t;u2{@@_oKfCZVMuROHiQ#~j{d"`MFi|V}eG[n!@"5O;Qm4^vr7U@_s~ddU/JP%OX~lC`N{;h4gh@Z<)`8x?1hRaX4SdcJ|xEoXjO>_r[Lb$L}a]1I"E$tgD*ow#6@Tb7krHRhAEY>z(|(0DJM%z)e:VE_vHKp.}W_yIoelg>({zk5L7xu8c"d1tqmG^@jp;}SkgfOoC%LR&~r/POS!sR4{>Nol;U6TesNDPWPj$=S/rJ!kc)^q`y9hqdT.GXmkx;1xyj?b+PAIjnPGc^2>`.D;Xps?N}]"rjBC>F$*A';
  await renderImage(decompressTileCode(compressedImage), 'cache/test-293.png');
  expect(decompressTileCode(compressedImage)).toBe(
    // eslint-disable-next-line max-len
    '954b64c75d76d86f87f97e86e86fa8fa8d75c75c64b64b64743410310510732c65d75b54a54622511521621a54a53b53632954965954721b64c65a54843622621965b76a64a53a53632400400944a54b64c64d65c64b54944400510610731a54954843a54b65b64b64c64d65d64c64a53c76d87b75b64a53b54c54d64c64b53b53c64d64d64c64d75d75d75e75e75c64b54d64d65c64b53b64c64c53b53c54e97d75e85fa8f86c64b54c64c64a54a54a54a54a54c65943b65c65f87e86d74c64a53b64b55954511844844511400622a65a54b54c65b64b54732843743210211411522300522421532522743954a54953742843743211311300632310522411532421521843953954733844743622400644200200200200300311533410843954733843a65843622966200200200200200300200844954954311843942944b65b66d87c87d87c77c76833b76944954953311843953a54a54944d88c77c77b65a54b65b75953a54953322733a64954943944a54a54a65d77a54b65b65a54a54953',
  );
});

afterAll((done) => {
  setTimeout(done);
});
