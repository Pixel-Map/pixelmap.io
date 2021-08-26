var selectedImage = ''
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToShortHex(rgb) {
    var hexR = Math.round(rgb.r / 17).toString(16);
    var hexG = Math.round(rgb.g / 17).toString(16);
    var hexB = Math.round(rgb.b / 17).toString(16);
    return "" + hexR + "" + hexG + "" + hexB;
}

function getShortHexColorCode(code) {
    var rgb = hexToRgb(code);
    return rgbToShortHex(rgb);
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

function readImage() {
    if (this.files && this.files[0]) {
        var FR = new FileReader();
        FR.onload = function(e) {
            var img = new Image();
            var str = ''
            img.onload = function() {
                context.drawImage(img, 0, 0, img.width, img.height, 0, 0, 16, 16);
                var str = ''
                for (var x = 0; x <= 15; x++) {

                  for (var y = 0; y <= 15; y++) {
                    var data = context.getImageData(y, x, 1, 1).data;
                    //console.log(getShortHexColorCode(rgbToHex(data[0],data[1],data[2])));
                    str = str + getShortHexColorCode(rgbToHex(data[0],data[1],data[2]));
                  }

                }
                selectedImage = str;
            };
            img.src = e.target.result;

        };
        FR.readAsDataURL(this.files[0]);
    }
}
document.getElementById("fileUpload").addEventListener("change", readImage, false);
