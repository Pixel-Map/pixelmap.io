#!/usr/bin/env python

import redis
import ConfigParser
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

# Render HTML

html_header = """
<!DOCTYPE HTML>
<html>
    <head>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
    <script type="text/javascript" src="scripts/jquery.min.js"></script>
    <script type="text/javascript" src="scripts/jquery.maphilight.min.js"></script>
    <script type="text/javascript">
    $(function() {
        $('.map').maphilight();
    });</script>
    </head>
    <body>
        <header>
          <div id="logo">
            <a href="http://www.pixelmap.io">
              <img src="images/logo.png" alt="logo" height="50px" />
            </a>
          </div>
          <div id="whitepaper">
            <a href="https://github.com/Pixel-Map/pixelmap.io/blob/master/README.md">
              <img src="images/whitepaper.png" alt="whitepaper" id="whitepaper" height="50px" />
            </a>
          </div>
          <div id="about">
            <a href="https://github.com/Pixel-Map/pixelmap.io/blob/master/README.md">
              <img src="images/about.png" alt="about" id="about" height="50px" />
            </a>
          </div>
        </header>
        <div id="canvas" class="container-fluid">
            <img src="images/background.png" class="map" usemap="#imagemap" id="background" alt="PixelMap.io" />
        </div>
        <map name="imagemap">
"""

# For every tile at X, Y
html_body = ""
keys = []
for x in range(81):
    for y in range(49):
        keys.append(str(x) + "x" + str(y))
pipe = redis_server.pipeline()
for key in keys:
    pipe.hgetall(key)
values = pipe.execute()

for x in range(81):
    for y in range(49):
        owner = values[x * 49 + y]['owner']
        url = values[x * 49 + y]['url']
        html_body += "            <area href=\"http://" + url + "\" shape=\"rect\" coords=\"" + str(x * 16) + "," + str(y * 16) + "," + str(x * 16 + 16) + "," + str(y * 16 + 16) + "\" alt=\"" + url + "\"/>\n"

html_footer = """
        </map>
    </body>
</html>
"""
f = open("index.html", "w")  # opens file with name of "test.txt"
f.write(html_header)
f.write(html_body)
f.write(html_footer)
f.close()
