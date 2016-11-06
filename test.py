import json
from web3 import Web3, KeepAliveRPCProvider, IPCProvider
from PIL import Image

web3 = Web3(KeepAliveRPCProvider(host='localhost', port='8545'))
print(web3.isConnected())
abi = json.loads('[{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"owners","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"getPos","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"urls","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"images","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"prices","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"},{"name":"y","type":"uint256"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"name":"setPixel","outputs":[],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"}]')

contract = web3.eth.contract(
    abi, address="0xfA43A0C1255572c1f38704b420b635baea92FA29")

print contract.call().getTile(1, 1)
