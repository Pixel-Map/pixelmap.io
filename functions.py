import configparser
from web3 import Web3
import redis
import json
from PIL import Image

# Load INI Configuration
configParser = configparser.RawConfigParser()
configParser.read('config.ini')
geth_server = configParser.get('DEFAULT', 'geth')
contract_address = configParser.get('DEFAULT', 'contract')
abi_data = configParser.get('DEFAULT', 'abi')
default_tile = configParser.get('DEFAULT', 'defaultTile')
owned_tile = configParser.get('DEFAULT', 'ownedTile')
for_sale_tile = configParser.get('DEFAULT', 'forSaleTile')
default_url = configParser.get('DEFAULT', 'defaultURL')


def get_default_tile(owner):
    if (owner == '0x0000000000000000000000000000000000000000'):
        return default_tile
    else:
        return owned_tile


def get_for_sale_tile():
    return for_sale_tile


def get_default_url():
    return default_url


# Divide String into an array, every (chunk_size).
def chunk_str(str, chunk_size):
    return [str[i:i + chunk_size] for i in range(0, len(str), chunk_size)]


# Given X, Y, return the correct position.
def get_position(x, y):
    return y * 16 + x


# Double every character in a string, like 123 would become 112233.
def double_mult(s):
    return ''.join([x * 2 for x in s])


# Convert Hex Color value to RGB.
def hex_to_rgb(value):
    value = value.lstrip('#')
    lv = len(value)
    return tuple(int(value[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))


def get_contract():
    contract = ""
    try:
        web3 = Web3(Web3.HTTPProvider(geth_server))
        abi = json.loads(abi_data)
        contract = web3.eth.contract(address=contract_address, abi=abi)
    except Exception as e:
        print(e)
        print('Not connected!')

    return contract

def connect_redis():
    redis_server = configParser.get('DEFAULT', 'redis')
    return redis.StrictRedis(host=redis_server, port=6379, db=0)


# Renders a full image from all tiles.
def render_full_image():
    # create a new black image
    full_image = Image.new('RGB', (1296, 784), "black")
    full_image.load()  # create the pixel map
    for i in range(3969):
        image = Image.open('tiles/' + str(i) + ".png")
        y = i / 81
        x = i % 81
        full_image.paste(image, (int(x) * 16, int(y) * 16))
    full_image.save("images/background.png")


def check_hex(s):
    return not any(((ch < '0' or ch > '9') and
                (ch < 'A' or ch > 'F')) for ch in s)
