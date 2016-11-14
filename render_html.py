import jinja2
from functions import connect_redis


def render_html():
    # Load Template
    templateLoader = jinja2.FileSystemLoader(searchpath=".")
    templateEnv = jinja2.Environment(loader=templateLoader)
    template = templateEnv.get_template("template.html")

    # Get Data from Redis
    keys = []
    for x in range(81):
        for y in range(49):
            keys.append(str(x) + "x" + str(y))
    print "Connecting to Redis"
    pipe = connect_redis().pipeline()
    for key in keys:
        pipe.hgetall(key)
    values = pipe.execute()
    print "Data copied from Redis"

    # Construct Array of Dicts
    tiles = []
    for x in range(81):
        for y in range(49):
            owner = values[x * 49 + y]['owner']
            url = values[x * 49 + y]['url']
            tiles.append({'x': x * 16,
                          'y': y * 16,
                          'owner': owner,
                          'url': url})

    templateVars = {"title": "Test Example",
                    "description": "A simple inquiry of function.",
                    "tiles": tiles
                    }
    outputText = template.render(templateVars)

    f = open("index.html", "w")  # opens file with name of "test.txt"
    f.write(outputText)
    f.close()
