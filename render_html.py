import jinja2

from functions import connect_redis


def render_html():
    # Load Template
    templateLoader = jinja2.FileSystemLoader(searchpath=".")
    templateEnv = jinja2.Environment(loader=templateLoader)
    template = templateEnv.get_template("template.html")

    # Get Data from Redis
    keys = []
    for i in range(3969):
        keys.append(str(i))
    print("Connecting to Redis")
    pipe = connect_redis().pipeline()
    for key in keys:
        pipe.hgetall(key)
    values = pipe.execute()
    print("Data copied from Redis")

    # Construct Array of Dicts
    tiles = []
    for i in range(3969):
        owner = values[i].get("owner")
        url = values[i].get("url")
        y = i / 81
        x = i % 81
        tiles.append({"x": x * 16, "y": y * 16, "owner": owner, "url": url})

    templateVars = {
        "title": "Test Example",
        "description": "A simple inquiry of function.",
        "tiles": tiles,
    }
    outputText = template.render(templateVars)

    f = open("index.html", "w")  # opens file with name of "test.txt"
    f.write(outputText)
    f.close()
