import fs from 'graceful-fs';
const cache_path = './cache/tiles.json';

//Cache preparation
export function loadCache() {
  let results = [];

  try {
    const data = fs.readFileSync(cache_path);
    
    if(!data || data.length == 0) {
      //reset cache on file read error, or malformed json
      results = resetCache();
    } else {
      results = JSON.parse(data);
    }

  } catch( error ) {
    //Something is wrong with the cache file, reset it.
    results = resetCache();
  }
  
  return results;
}

export function resetCache() {
  let data = [];

  for( let i = 0; i <= 3969; i++ ) {
    data[i] = {
      "id": i,
      "url": "",
      "image": "",
      "owner": "",
      "price": "0",
      "wrapped": "",
      "openseaPrice": "0",
      "lastUpdated": ""
    }
  }
  
  let parsed = JSON.stringify(data, null, 2);
  
  try {
    fs.writeFile(cache_path, parsed);
  } catch(err) {

  }
  
  return data;
}

export function updateCache(tiles) {
  let parsed = JSON.stringify(tiles, null, 2);

  try {
    fs.writeFile(cache_path, parsed);
  } catch(err) {

  }
}

export function cachePath() {
  return cache_path;
}
