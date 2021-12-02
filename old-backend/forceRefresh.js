import fetch from "node-fetch";
globalThis.fetch = fetch;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (let tokenId = 0; tokenId <= 3970; tokenId++) {
  const url =
    "https://api.opensea.io/api/v1/asset/0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b/" +
    tokenId +
    "/?force_update=true";
  const x = await fetch(url, { headers: { "x-api-key": "" } }, {});
  console.log(x.statusText);
  await sleep(5000);
  console.log("Done with " + tokenId);
}
