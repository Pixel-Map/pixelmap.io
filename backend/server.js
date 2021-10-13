const express = require('express');
const Web3 = require('web3');
const cors = require('cors');
const compression = require('compression');
const fetch = require('node-fetch');
const fs = require('graceful-fs');
const path = require('path');
const cache = require("./utils/cache");
const Jimp = require('jimp');
const BigNumber = require('bignumber.js');
const AWS = require('aws-sdk');
const { createCanvas } = require('canvas')
const base91 = require('node-base91');
const pako = require('pako');

const app = express()
const port = 3001

// Environment Variable validation
require('dotenv').config();
const joi = require("joi");
const envVarsSchema = joi
    .object()
    .keys({
      AWS_BUCKET_NAME: joi.string().required().description("AWS Bucket to render tiles and metadata"),
      AWS_ID: joi.string().required().description("AWS API ID for authenticating to S3"),
      AWS_SECRET: joi.string().required().description("AWS API Secret Key for authenticating to S3"),
      WEB3_URL: joi.string().required().description("URL to Web3 provider (WSS)"),
      CONTRACT_ADDRESS: joi.string().required().description("Original Contract Address"),
      CONTRACT_WRAPPER_ADDRESS: joi.string().required().description("Wrapper Contract Address"),
      USE_LOCAL: joi.bool().default(false)
    })
    .unknown().allow(false);

const { value: envVars, error } = envVarsSchema
    .prefs({ errors: { label: "key" } })
    .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

app.use(cors());
app.use(compression());

let abi = require("./abi/pixelabi.json");
let abi_wrapper = require("./abi/wrapperpixelabi.json");
const WEB3_URL = process.env.WEB3_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_WRAPPER_ADDRESS = process.env.CONTRACT_WRAPPER_ADDRESS;

let web3 = new Web3(WEB3_URL);
let contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
let contract_wrapper = new web3.eth.Contract(abi_wrapper, CONTRACT_WRAPPER_ADDRESS);

// AWS
const BUCKET_NAME = process.env.AWS_BUCKET_NAME

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
  endpoint: new AWS.Endpoint(process.env.USE_LOCAL ? 'http://localstack:4566' : undefined),
  s3ForcePathStyle: true
});

let tiles = cache.loadCache();
let forSale = {};
let sorted_forsale = [];
let runningContractUpdate = false;

let tileImageInterval;
let contractInterval;
let openseaPriceInterval;

//Endpoints



app.get("/openseafloor", async(req, res) => {
  fetch(`https://api.opensea.io/api/v1/events?asset_contract_address=${CONTRACT_WRAPPER_ADDRESS}&event_type=successful&only_opensea=false&offset=0&limit=20`).then(res => res.json())
    .then((json) => {
      // do something with JSON

      let data = "";
      for(dat of json.asset_events){
        data += dat.created_date+" =>"+(dat.total_price/1000000000000000000)+"<br><br>";
      }

      res.setHeader('Content-Type', 'application/json');
      res.end(json.asset_events[0].total_price, 'binary')

    });
})


app.get('/tiledata', (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const options = {
    root: path.join(__dirname)
  };

  try {
    if (fs.existsSync(cache.cachePath())) {
      //file exists
      res.sendFile(cache.cachePath(), options);
    }
  } catch(err) {

  }

  //res.end(JSON.stringify(tiles), 'binary')
})

app.get('/tile/:id', (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const tileIndex = parseInt(req.params.id);
  let tile = '';

  if( tileIndex >= 0 && tileIndex <= 3969 ) {
    try {
      tile = tiles[tileIndex];
    } catch(err) {
      
    }
  }

  res.send(JSON.stringify(tile));
})



app.get('/floorold', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(sorted_forsale), 'binary')
})

app.get('/tilemap', (req, res) => {
  const options = {
    root: path.join(__dirname)
  };

  const tileImagePath = "./cache/tiles.png";

  try {
    if (fs.existsSync(tileImagePath)) {
      //file exists
      res.sendFile(tileImagePath, options);
    }
  } catch(err) {

  }
});

async function tileProcessor( tile, index ) {
  let owner = tile[0].toLowerCase();
  let image = tile[1];
  let url = tile[2];
  let price = tile[3];
  let wrapped = false;


  await updateTileMetaAndImage(tile,index)

  if(owner == CONTRACT_WRAPPER_ADDRESS) {
    wrapped = true;
    wrapper_tile = await contract_wrapper.methods.ownerOf(index).call();
    owner = wrapper_tile
  }

  price = new BigNumber(price);
  price = price.toFixed(0); //remove decimals and exp notation

  tiles[index].id = index;
  tiles[index].url = url;
  tiles[index].image = image;
  tiles[index].owner = owner;
  tiles[index].price = price;
  tiles[index].wrapped = wrapped;
  tiles[index].lastUpdated = Date.now();

  if (parseInt( price ) > 0) {
    forSale[index] = parseInt(price);
    sortData();
  } else {
    delete forSale[index];
    sortData();
  }
}

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

async function getOpenseaPrices() {
  let limit = 30; //max 30 items for token_ids

  try {
    for( let id = 0; id <= 3969; id += limit ) {
      console.log(`Opensea update offset: ${id}`);

      let params = {
        "asset_contract_address": CONTRACT_WRAPPER_ADDRESS,
        "side": 1, //sell side
        "include_bundled": false,
        "include_invalid": false,
        "order_by": "created_date",
        "order_direction": "asc"
      }

      params = new URLSearchParams(params);

      for( let i = id; i < (id + limit); i++ ) {
        params += `&token_ids=${i}`;
        if(i < 3970) {
          tiles[i].openseaPrice = "0";
        }
      }

      const response = await fetch(`https://api.opensea.io/wyvern/v1/orders?${params}`, { method: 'GET'});
      let results = await response.json();

      if( results && results.orders && results.orders.length > 0 ) {

        results.orders.forEach( order => {
          let location = parseInt(order.asset.token_id);
          let price = new BigNumber(order.current_price);
          price = price.toFixed(0); //remove decimals and exp notation

          tiles[location].openseaPrice = price;
        })

      }

      cache.updateCache(tiles); //leave caching to updateData() only.

      await sleep(500); //throttle requests to prevent rate limiting with OS
    }
  } catch(err) {
    console.log(err);
  }
}

contract.events.TileUpdated(async (x,y) => {
  console.log("Received Updated Tile!")
  if(y.returnValues && y.returnValues[0]) {
    let tileId = parseInt(y.returnValues["location"]);

    await contract.methods.getTile(tileId).call().then(async (tile) => {
      await tileProcessor(tile, tileId);
      cache.updateCache(tiles);
    })
  }
});

contract_wrapper.events.Transfer(async (x,y) => {
  console.log("Tile Transferred!")
  if(y.returnValues && y.returnValues[0]) {

    let tileId = parseInt(y.returnValues["tokenId"]);

    await contract.methods.getTile(tileId).call().then(async (tile) => {

      // Change owner because of wrapper
      tile[0] = y.returnValues["to"];

      await tileProcessor(tile, tileId);
      cache.updateCache(tiles);
    })
  }
});

async function updateData(){
  if( runningContractUpdate === true ) return;
  let tenMinutesAgo = Date.now() - (10 * 60000)
  runningContractUpdate = true;

  for(let i = 0; i <= 3969; i++){
    if (tiles[i].lastUpdated !== "" && tiles[i].lastUpdated >= tenMinutesAgo) {
      let tile = tiles[i];
      console.log("Tile: " + i + " was updated in the last 10 minutes, skipping!")
    }
    else {
      try {
        let tile = await contract.methods.getTile(i).call();
        console.log('Progress: .' + i + '.\r');

        await tileProcessor(tile, i);
        cache.updateCache(tiles);

      } catch (e) {
        console.log(e);
        //console.log("ERR")

        web3 = new Web3(WEB3_URL);
        contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
        contract_wrapper = new web3.eth.Contract(abi_wrapper, CONTRACT_WRAPPER_ADDRESS);
        i--;
      }
    }
  }

  runningContractUpdate = false;

  console.log("Start sorting..")
}

// Sort Data for Lowest Price API
function sortData(){
  let entries = Object.entries(forSale);
  let sorted = entries.sort((a, b) => a[1] - b[1]);
  sorted_forsale = sorted;
  //console.log(sorted);
  //console.log("Done");
}

// Decompress the Tile if it's compressed
function decompressTileCode(tileCodeString) {
  if( typeof tileCodeString === 'string' ) {
    if( tileCodeString.startsWith("b#") ) {
      const unzip = pako.inflate( base91.decode(tileCodeString.substr(2)), { to: 'string'} ); // Using substring to remove the b#
      return unzip;
    } else {
      return tileCodeString;
    }
  }

  return tileCodeString;

}

// Create full tile canvas for front end performance. Keep the empty tiles transparent for
// background control on frontend.

function createMapImage() {
  if( !tiles || tiles.length != 3970 ) return; //only create map if tiles array is complete

  const width = 81 * 16; //81 tiles across
  const height = 49 * 16; //49 tiles down

  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');

  context.clearRect(0,0, width, height);

  let row = 0;
  let col = 0;

  for( let i = 0; i < tiles.length; i++ ) {
    let tile = tiles[i];
    let hex = decompressTileCode(tile.image);

    if( i > 0 && i % 81 === 0 ) {
      row++;
      col = 0;
    }

    if( hex.length == 768 ) {

      hex = hex.match(/.{1,3}/g);

      let index = 0;

      for( let y = 0; y < 16; y++ ) {
        for( let x = 0; x < 16; x++ ) {
          context.fillStyle = `#${hex[index]}`;
          context.fillRect(x + 16 * col, y + 16 * row, 1, 1);
          index++;
        }
      }
    }

    col++;

  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFile('./cache/tiles.png', buffer);
}

async function initData() {

  tileImageInterval = setInterval(() => {
    createMapImage();
  }, 60 * 1000); //set to an acceptable length (every minute?)



  await updateData();
  await getOpenseaPrices();

  openseaPriceInterval = setInterval(() => {
    getOpenseaPrices();
  }, 10 * 60 * 1000); //every 10 minutes

}

async function updateTileMetaAndImage(tile,i){

  let imageData = tile[1];
  imageData = decompressTileCode(imageData)
  let tileMetaData = {
    "description": "Official PixelMap (2016) Wrapped Tile",
    "external_url": tile[2],
    "name": "Tile #"+i
  }

  if(imageData.length >= 768){

    // OWN IMAGE

    let data = imageData
    let imgdataarr = data.match(/.{1,3}/g)

    let counter = 0;

    let image =  await new Jimp(16, 16)

    for (var x = 0; x <= 15; x++) {
      for (var y = 0; y <= 15; y++) {

        let index = counter;
        let hexstr = imgdataarr[index];
        let newhex = hexstr.substr(0,1)+hexstr.substr(0,1)+hexstr.substr(1,1)+hexstr.substr(1,1)+hexstr.substr(2,1)+hexstr.substr(2,1)
        image.setPixelColor(parseInt("0x"+newhex+"FF",16),y,x);
        counter++;

      }
    }

    await image.resize(512,512,'nearestNeighbor').quality(100).write("cache/"+i+".png")

    // upload to localstack - plugin does not support await need a bit time for IO
    const fileContent = fs.readFileSync("cache/"+i+".png");
    const params = {
      Bucket: BUCKET_NAME,
      Key: "large_tiles/" + i +".png", // File name you want to save as in S3
      Body: fileContent,
      ACL:'public-read',

    };
    await s3.upload(params,function () {
      console.log(`Tile image data uploaded successfully. ${data.Location} to ${BUCKET_NAME}`);
    })

    tileMetaData.image = "https://s3.us-east-1.amazonaws.com/" + BUCKET_NAME + "/large_tiles/"+i+".png"
    await fs.writeFileSync("cache/"+i+".json",JSON.stringify(tileMetaData));
  }
  else{
    // NO own image
    console.log("No image set, skipping!")
    // tileMetaData.image = "https://s3.us-east-1.amazonaws.com/" + BUCKET_NAME + "/large_tiles/"+i+".png"
    // await fs.writeFileSync("cache/"+i+".json",JSON.stringify(tileMetaData));
  }

  // upload to localstack
  let fileContent = '';
  if (fs.existsSync("cache/"+i+".json")) {
    //file exists
    fileContent = fs.readFileSync("cache/"+i+".json");
  }

  
  const params = {
    Bucket: BUCKET_NAME,
    Key: "metadata/" + i + ".json", // File name you want to save as in S3
    Body: fileContent,
    ACL:'public-read'
  };
  await s3.upload(params, function(err, data) {
    if (err) {
      console.log(err)
    }
    else {
      console.log(`Metadata uploaded successfully. ${data.Location} to ${BUCKET_NAME}`);
    }
  });

}

//Start Express
app.listen(port, async () => {
  initData();
})
