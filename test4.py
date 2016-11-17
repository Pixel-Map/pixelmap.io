
import ConfigParser
from web3 import Web3, KeepAliveRPCProvider
import redis
import json
from PIL import Image
web3 = Web3(KeepAliveRPCProvider(host='localhost', port='8545'))

abi = json.loads('[{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"tiles","outputs":[{"name":"owner","type":"address"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"buyTile","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"},{"name":"image","type":"string"},{"name":"url","type":"string"},{"name":"price","type":"uint256"}],"name":"setTile","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"location","type":"uint256"}],"name":"getTile","outputs":[{"name":"","type":"address"},{"name":"","type":"string"},{"name":"","type":"string"},{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"location","type":"uint256"}],"name":"TileUpdated","type":"event"}]')
contract = web3.eth.contract(abi, address='0x406D4d30dE0C7c11499aDA85a3DC50c735B6dd60')


# Get Tile Data
print contract.call().getTile(0)
