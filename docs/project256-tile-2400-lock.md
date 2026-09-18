# Tile #2400 and the Project256 time lock

PixelMap tile **#2400** is held by the verified **Project256** smart contract and cannot leave it
before Ethereum block **51,200,000** (estimated 17 April 2036, 21:50:23 UTC). This document is the
on-chain paper trail, gathered on 18 September 2026, plus the commands to re-verify it yourself.

## The short version

| Fact | Value |
| --- | --- |
| Tile | 2400 (2016 PixelMap contract `0x015A06a433353f8db634dF4eDdF0C109882A15AB`) |
| Current on-chain owner of the tile | Project256 `0x67C9E1163EB2ea91CBE2C4907aCEf635Af9F0C5b` |
| Project256 owner / deployer | `zacks.eth` (`0x1B086Af7E34b3Fd9E989e732A171adcD0Fc32694`) |
| `unlockBlock` (live) | 51,200,000 |
| Lock transaction | [`0x850b99d7…`](https://etherscan.io/tx/0x850b99d73b9cf854d8685373fa80c1b3a0169c46bdcb1252389d6440b6b49ed6) at block 26,003,066, 2026-09-18 08:03:35 UTC |
| Tile price in the 2016 contract | 0 ETH (not purchasable) |
| Frames minted onto the tile so far | 34 (as of block 26,006,478) |

## Why the tile really is locked

The 2016 PixelMap contract has no transfer function. The only way `tiles[2400].owner` ever changes
is `buyTile(2400)`, which throws unless the tile has a non-zero `price` (see `contracts/PixelMap.sol`).
Project256 owns the tile and controls that price:

- Every frame update (`setImage`, `genImage`, `acceptProposal`) goes through `_updatePixelMapTile`,
  which calls `setTile(2400, image, url, 0)`. Price stays 0.
- The only function that can set a non-zero price is `unwrap`, and it is gated:

```solidity
function unwrap(string calldata _returnUrl, uint256 _price) external onlyOwner {
    require(block.number >= unlockBlock, "Operations are currently timelocked");
    _pixelmap.setTile(targetTile, "", _returnUrl, _price);
    emit Unwrapped(msg.sender, targetTile);
}
```

- `lockPeriod` and `lockUntilBlock` both `require(block.number >= unlockBlock)`, so the owner cannot
  shorten an active lock, only extend it once it has expired.
- `renounceOwnership` is overridden to revert. There is no proxy, no `selfdestruct`, no `delegatecall`.
- `targetTile` is a `constant` equal to 2400.

So until block 51,200,000 nobody, including `zacks.eth`, can move tile 2400. After that block only the
contract owner can release it by calling `unwrap`.

The verified source is on [Etherscan](https://etherscan.io/address/0x67C9E1163EB2ea91CBE2C4907aCEf635Af9F0C5b#code)
and [Blockscout](https://eth.blockscout.com/address/0x67C9E1163EB2ea91CBE2C4907aCEf635Af9F0C5b?tab=contract)
(compiler v0.8.34, verified 2026-07-22 20:56:25 UTC).

## Timeline (all times UTC)

| When | Block | What | Tx |
| --- | --- | --- | --- |
| 2026-06-22 19:06:47 | 25,375,128 | Wrapped tile 2400 transferred to `zacks.eth` | [`0x34fb70c8…`](https://etherscan.io/tx/0x34fb70c8e7920d3a53f69ca8bbf595b34bc16055cf79e29408a81287567fb3e4) |
| 2026-07-22 09:13:23 | 25,587,303 | Tile unwrapped from the official PixelMap wrapper | [`0xc3fd0982…`](https://etherscan.io/tx/0xc3fd098279eb9ef9cdf478ad2fc539dc3ca8ed02b5fdf017d25f7d6e20dddcbd) |
| 2026-07-22 09:52 | | First Project256 prototype deployed at `0x2bA6FC09…` (abandoned) | [`0xf77163b3…`](https://etherscan.io/tx/0xf77163b3f60b04f4743bec9e04e2a8ecb459dfba25832e22575aa4afc88340ea) |
| 2026-07-22 09:55:23 | 25,587,513 | `setTile(2400, " ", "Project256", 0.1 ETH)` | [`0x0365f9c1…`](https://etherscan.io/tx/0x0365f9c11b71ec01b6c6ab19c33cd20d3c9c43664a68dc705ad0d17a6022a49c) |
| 2026-07-22 20:55:59 | 25,590,792 | Final Project256 contract deployed at `0x67C9E116…` | [`0xd7b562ed…`](https://etherscan.io/tx/0xd7b562ed37575a6488a6326aa7cb2105d09f3208d0d7ad04079a3f01e5e76a8f) |
| 2026-07-22 21:04:23 | 25,590,833 | `zacks.eth` buys the tile back from the prototype for 0.1 ETH | [`0xae49c2af…`](https://etherscan.io/tx/0xae49c2af23e355a02ad6e14deda6c5e282a5db8c52eab3117abaa53b46f25507) |
| 2026-07-22 21:05:59 | 25,590,841 | `setTile(2400, " ", "Project256", 0.1 ETH)` so the contract can buy it | [`0x779978f5…`](https://etherscan.io/tx/0x779978f573fced9732243859471aae8778975b2342d7d81ee422280f71b8bbac) |
| 2026-07-22 21:08:47 | 25,590,855 | `Project256.wrap()` sends 0.1 ETH to `buyTile(2400)`; emits `Wrapped(zacks.eth, 2400)` | [`0x7c9adafd…`](https://etherscan.io/tx/0x7c9adafd8e00604cc0d877071fe5d9b3f0d3eca10654d669220239eff8deab18) |
| 2026-07-22 21:11:47 | 25,590,870 | `setMintLockUntilBlock(25600000)` opens minting | [`0x95617f14…`](https://etherscan.io/tx/0x95617f14287e0def3dc50da9bdec17c918977c084b7f6fe1b821f7dd843ebc38) |
| 2026-07-22 21:44:23 | 25,591,031 | `lockPeriod(256256)` → `unlockBlock` = 25,847,287 | [`0x0f3f49d3…`](https://etherscan.io/tx/0x0f3f49d325098eb835dd8c4f814e21f3a13017b5b8ba8d39930d724cbabd4cc6) |
| 2026-09-18 08:03:35 | 26,003,066 | `lockUntilBlock(51200000)` → `TimeLockStarted(51200000)` | [`0x850b99d7…`](https://etherscan.io/tx/0x850b99d73b9cf854d8685373fa80c1b3a0169c46bdcb1252389d6440b6b49ed6) |

Note: `zacks.eth` is an EIP-7702 delegated account (MetaMask `EIP7702StatelessDeleGator`), which is
why explorers show it as a contract. That delegation is unrelated to the lock.

## The 2036 estimate

`51,200,000 − 26,003,066 = 25,196,934` blocks remained at the moment of the lock. At 12 seconds per
block that is 302,363,208 seconds, which lands on **2036-04-17 21:50:23 UTC** when added to the lock
transaction's timestamp. The website recomputes the estimate from the live block number.

## Verify it yourself

```bash
RPC=https://ethereum-rpc.publicnode.com
P256=0x67C9E1163EB2ea91CBE2C4907aCEf635Af9F0C5b
OG=0x015a06a433353f8db634df4eddf0c109882a15ab

# tiles(2400) on the 2016 contract: owner, image, url, price
curl -s -X POST $RPC -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"'$OG'","data":"0x2fd2e7420000000000000000000000000000000000000000000000000000000000000960"},"latest"]}'

# unlockBlock() on Project256 -> 0x30d4000 = 51,200,000
curl -s -X POST $RPC -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"'$P256'","data":"0xea35df16"},"latest"]}'

# targetTile() -> 0x960 = 2400, isTileWrapped() -> 1
curl -s -X POST $RPC -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"'$P256'","data":"0xc4376cfb"},"latest"]}'
curl -s -X POST $RPC -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"'$P256'","data":"0xbb441623"},"latest"]}'

# The lock transaction, decoded
curl -s https://eth.blockscout.com/api/v2/transactions/0x850b99d73b9cf854d8685373fa80c1b3a0169c46bdcb1252389d6440b6b49ed6 | jq .decoded_input
```

## Where this shows up on the site

Clicking tile 2400 on the main map opens the Project256 vault (`frontend/components/Project256Vault.tsx`):
a chained, padlocked tile, a live countdown to block 51,200,000, and this proof with Etherscan links.
Constants live in `frontend/constants/project256.ts`.
