import csv



html_header = """
<!DOCTYPE HTML>
<html>
    <head>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
    </head>
    <body>
        <header>
          <div id="logo">
            <a href="http://www.pixelmap.io">
              <img src="images/logo.png" alt="logo" height="50px" />
            </a>
          </div>
          <div id="whitepaper">
            <a href="whitepaper.html">
              <img src="images/whitepaper.png" alt="whitepaper" id="whitepaper" height="50px" />
            </a>
          </div>
          <div id="about">
            <a href="about.html">
              <img src="images/about.png" alt="about" id="about" height="50px" />
            </a>
          </div>
        </header>
        <div id="canvas" class="container-fluid">
            <img src="images/background.png" usemap="#imagemap" id="background" alt="Seven Wonders of the World"/>
        </div>
        <map name="imagemap">
"""

html_body = ""
with open('/var/www/html/urls.csv', 'rb') as csvfile:
    urls = csv.reader(csvfile, delimiter=',', quotechar='|')
    x = -1

    for line in urls:
        y = -1
        x = x + 1
        for url in line:
            y = y + 1
            html_body += "            <area href=\"http://" + url + "\" shape=\"rect\" coords=\"" + str(x * 16) + "," + str(y * 16) + "," + str(x * 16 + 16) + "," + str(y * 16 + 16) + "\" alt=\"" + url + "\"/>\n"

html_footer = """
        </map>
    </body>
</html>
"""
f = open("/var/www/html/index.html", "w")  # opens file with name of "test.txt"
f.write(html_header)
f.write(html_body)
f.write(html_footer)
f.close()
