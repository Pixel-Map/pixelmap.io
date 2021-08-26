from functions import connect_redis


def get_owned_tiles(owner):
    keys = []
    for i in range(3969):
        keys.append(str(i))
    print("Connecting to Redis")
    pipe = connect_redis().pipeline()
    for key in keys:
        pipe.hgetall(key)
    values = pipe.execute()
    owned_tiles = []
    i = 0
    for tile in values:
        if tile["owner"] == owner:
            owned_tiles.append(i)
        i = i + 1
    return owned_tiles
