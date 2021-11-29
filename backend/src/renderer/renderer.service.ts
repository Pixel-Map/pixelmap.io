import { Injectable } from '@nestjs/common';
import Jimp from 'jimp';
import { decompressTileCode } from './utils/decompressTileCode';

@Injectable()
export class RendererService {
  // async updateTileMetaAndImage(tile, i) {
  // let imageData = tile[1];
  // imageData = decompressTileCode(imageData);
  // let tileMetaData = {
  //   description: "Official PixelMap (2016) Wrapped Tile",
  //   external_url: tile[2],
  //   name: "Tile #" + i,
  // };
  //
  // if (imageData.length >= 768) {
  //   // OWN IMAGE
  //
  //   let data = imageData;
  //   let imgdataarr = data.match(/.{1,3}/g);
  //
  //   let counter = 0;
  //
  //   let image = await new Jimp(16, 16);
  //
  //   for (let x = 0; x <= 15; x++) {
  //     for (let y = 0; y <= 15; y++) {
  //       let index = counter;
  //       let hexstr = imgdataarr[index];
  //       let newhex =
  //         hexstr.substr(0, 1) +
  //         hexstr.substr(0, 1) +
  //         hexstr.substr(1, 1) +
  //         hexstr.substr(1, 1) +
  //         hexstr.substr(2, 1) +
  //         hexstr.substr(2, 1);
  //       image.setPixelColor(parseInt("0x" + newhex + "FF", 16), y, x);
  //       counter++;
  //     }
  //   }
  //
  //   await image
  //     .resize(512, 512, "nearestNeighbor")
  //     .quality(100)
  //     .write("cache/" + i + ".png");
  //
  //   // upload to localstack - plugin does not support await need a bit time for IO
  //   const fileContent = fs.readFileSync("cache/" + i + ".png");
  //   const params = {
  //     Bucket: BUCKET_NAME,
  //     Key: "large_tiles/" + i + ".png", // File name you want to save as in S3
  //     Body: fileContent,
  //     ACL: "public-read",
  //     ContentType: "image/png",
  //   };
  //   await s3.upload(params, function () {
  //     console.log(
  //       `Tile image data uploaded successfully. ${data.Location} to ${BUCKET_NAME}`
  //     );
  //   });
  //
  //   tileMetaData.image =
  //     "https://s3.us-east-1.amazonaws.com/" +
  //     BUCKET_NAME +
  //     "/large_tiles/" +
  //     i +
  //     ".png";
  //   await fs.writeFileSync(
  //     "cache/" + i + ".json",
  //     JSON.stringify(tileMetaData)
  //   );
  // } else {
  //   // NO own image
  //   console.log("No image set, skipping!");
  //   tileMetaData.image =
  //     "https://s3.us-east-1.amazonaws.com/" +
  //     BUCKET_NAME +
  //     "/large_tiles/blank.png";
  //   await fs.writeFileSync(
  //     "cache/" + i + ".json",
  //     JSON.stringify(tileMetaData)
  //   );
  // }
}
