// eslint-disable-next-line @typescript-eslint/no-var-requires
const Jimp = require('jimp');

export async function renderImage(tileImageData: string, outputPath: string) {
  if (tileImageData.length >= 768) {
    // OWN IMAGE

    const imageDataArray = tileImageData.match(/.{1,3}/g);

    let counter = 0;

    const image = await new Jimp(16, 16);

    for (let x = 0; x <= 15; x++) {
      for (let y = 0; y <= 15; y++) {
        const index = counter;
        const hexstr = imageDataArray[index];
        const newhex =
          hexstr.substr(0, 1) +
          hexstr.substr(0, 1) +
          hexstr.substr(1, 1) +
          hexstr.substr(1, 1) +
          hexstr.substr(2, 1) +
          hexstr.substr(2, 1);
        image.setPixelColor(parseInt('0x' + newhex + 'FF', 16), y, x);
        counter++;
      }
    }
    await image.resize(512, 512, 'nearestNeighbor').quality(100).write(outputPath);
  } else {
    console.log('Not saving image, invalid image data found!');
  }
}
