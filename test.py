#!/usr/bin/env python
import json
import redis
import ConfigParser
import gevent
import random
from web3 import Web3, KeepAliveRPCProvider

# Load INI Configuration
configParser = ConfigParser.RawConfigParser()
configParser.read('config.ini')
redis_server = configParser.get('DEFAULT', 'redis')
geth_server = configParser.get('DEFAULT', 'geth')
contract_address = configParser.get('DEFAULT', 'contract')
abi_data = configParser.get('DEFAULT', 'abi')
default_tile = configParser.get('DEFAULT', 'defaultTile')
default_url = configParser.get('DEFAULT', 'defaultURL')

# Connect to Servers
redis_server = redis.StrictRedis(host=redis_server, port=6379, db=0)
web3 = Web3(KeepAliveRPCProvider(host=geth_server, port='8545'))

# Load Contract
abi = json.loads(abi_data)
contract = web3.eth.contract(abi, address=contract_address)

print "Connected to Web3: ", web3.isConnected()


def new_transaction_callback(transaction_hash):
    print "Transaction Spotted! Updating!"
    print transaction_hash['args']['x']
    print transaction_hash['args']['y']

filter = contract.on('TileUpdated', {}, new_transaction_callback)
print("Watching patiently for transactions...")

while True:
    gevent.sleep(random.random())


filter.stop_watching(130)
