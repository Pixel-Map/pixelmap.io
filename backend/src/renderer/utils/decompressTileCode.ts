// eslint-disable-next-line @typescript-eslint/no-var-requires
const pako = require('pako');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base91 = require('node-base91');

const IMAGE_COMPRESSED = 'b#';
const IMAGE_COMPRESSED_V2 = 'c#';

//4bit color map
const colors_4bit = [
  [0, 0, 0], //#000000
  [29, 43, 83], //#1D2B53
  [126, 37, 83], //#7E2553
  [0, 135, 81], //#008751
  [171, 82, 54], //#AB5236
  [95, 87, 79], //#5F574F
  [194, 195, 195], //#C2C3C7
  [255, 241, 232], //#FFF1E8
  [255, 0, 77], //#FF004D
  [255, 163, 0], //#FFA300
  [255, 255, 39], //#FFFF27
  [0, 231, 86], //#00E756
  [41, 173, 255], //#29ADFF
  [131, 118, 156], //#83769C
  [255, 119, 168], //#FF77A8
  [255, 204, 170], //#FFCCAA
];

function get4bitColorIndex(r, g, b) {
  for (let i = 0; i < colors_4bit.length; i++) {
    const c = colors_4bit[i];
    if ((c[0] & 0xf0) == (r & 0xf0) && (c[1] & 0xf0) == (g & 0xf0) && (c[2] & 0xf0) == (b & 0xf0)) {
      return i;
    }
  }
  return -1;
}

function get4bitColor(index) {
  return colors_4bit[index];
}

function getClosest4bitColor(r, g, b) {
  let bestColor = colors_4bit[0];
  let bestDistance = getColorDistance(colors_4bit[0], [r, g, b]);
  for (let i = 1; i < colors_4bit.length; i++) {
    const dis = getColorDistance(colors_4bit[i], [r, g, b]);
    if (dis < bestDistance) {
      bestColor = colors_4bit[i];
      bestDistance = dis;
    }
  }
  return bestColor;
}

//8bit color map
const colors_8bit = [
  [0, 0, 0],
  [0, 0, 48],
  [0, 0, 96],
  [0, 0, 144],
  [0, 0, 192],
  [0, 0, 240],
  [0, 48, 0],
  [0, 48, 48], //#000000,#000030,#000060,#000090,#0000C0,#0000F0,#003000,#003030
  [0, 48, 96],
  [0, 48, 144],
  [0, 48, 192],
  [0, 48, 240],
  [0, 96, 0],
  [0, 96, 48],
  [0, 96, 96],
  [0, 96, 144], //#003060,#003090,#0030C0,#0030F0,#006000,#006030,#006060,#006090
  [0, 96, 192],
  [0, 96, 240],
  [0, 144, 0],
  [0, 144, 48],
  [0, 144, 96],
  [0, 144, 144],
  [0, 144, 192],
  [0, 144, 240], //#0060C0,#0060F0,#009000,#009030,#009060,#009090,#0090C0,#0090F0
  [0, 192, 0],
  [0, 192, 48],
  [0, 192, 96],
  [0, 192, 144],
  [0, 192, 192],
  [0, 192, 240],
  [0, 240, 0],
  [0, 240, 48], //#00C000,#00C030,#00C060,#00C090,#00C0C0,#00C0F0,#00F000,#00F030
  [0, 240, 96],
  [0, 240, 144],
  [0, 240, 192],
  [0, 240, 240],
  [48, 0, 0],
  [48, 0, 48],
  [48, 0, 96],
  [48, 0, 144], //#00F060,#00F090,#00F0C0,#00F0F0,#300000,#300030,#300060,#300090
  [48, 0, 192],
  [48, 0, 240],
  [48, 48, 0],
  [48, 48, 48],
  [48, 48, 96],
  [48, 48, 144],
  [48, 48, 192],
  [48, 48, 240], //#3000C0,#3000F0,#303000,#303030,#303060,#303090,#3030C0,#3030F0
  [48, 96, 0],
  [48, 96, 48],
  [48, 96, 96],
  [48, 96, 144],
  [48, 96, 192],
  [48, 96, 240],
  [48, 144, 0],
  [48, 144, 48], //#306000,#306030,#306060,#306090,#3060C0,#3060F0,#309000,#309030
  [48, 144, 96],
  [48, 144, 144],
  [48, 144, 192],
  [48, 144, 240],
  [48, 192, 0],
  [48, 192, 48],
  [48, 192, 96],
  [48, 192, 144], //#309060,#309090,#3090C0,#3090F0,#30C000,#30C030,#30C060,#30C090
  [48, 192, 192],
  [48, 192, 240],
  [48, 240, 0],
  [48, 240, 48],
  [48, 240, 96],
  [48, 240, 144],
  [48, 240, 192],
  [48, 240, 240], //#30C0C0,#30C0F0,#30F000,#30F030,#30F060,#30F090,#30F0C0,#30F0F0
  [96, 0, 0],
  [96, 0, 48],
  [96, 0, 96],
  [96, 0, 144],
  [96, 0, 192],
  [96, 0, 240],
  [96, 48, 0],
  [96, 48, 48], //#600000,#600030,#600060,#600090,#6000C0,#6000F0,#603000,#603030
  [96, 48, 96],
  [96, 48, 144],
  [96, 48, 192],
  [96, 48, 240],
  [96, 96, 0],
  [96, 96, 48],
  [96, 96, 96],
  [96, 96, 144], //#603060,#603090,#6030C0,#6030F0,#606000,#606030,#606060,#606090
  [96, 96, 192],
  [96, 96, 240],
  [96, 144, 0],
  [96, 144, 48],
  [96, 144, 96],
  [96, 144, 144],
  [96, 144, 192],
  [96, 144, 240], //#6060C0,#6060F0,#609000,#609030,#609060,#609090,#6090C0,#6090F0
  [96, 192, 0],
  [96, 192, 48],
  [96, 192, 96],
  [96, 192, 144],
  [96, 192, 192],
  [96, 192, 240],
  [96, 240, 0],
  [96, 240, 48], //#60C000,#60C030,#60C060,#60C090,#60C0C0,#60C0F0,#60F000,#60F030
  [96, 240, 96],
  [96, 240, 144],
  [96, 240, 192],
  [96, 240, 240],
  [144, 0, 0],
  [144, 0, 48],
  [144, 0, 96],
  [144, 0, 144], //#60F060,#60F090,#60F0C0,#60F0F0,#900000,#900030,#900060,#900090
  [144, 0, 192],
  [144, 0, 240],
  [144, 48, 0],
  [144, 48, 48],
  [144, 48, 96],
  [144, 48, 144],
  [144, 48, 192],
  [144, 48, 240], //#9000C0,#9000F0,#903000,#903030,#903060,#903090,#9030C0,#9030F0
  [144, 96, 0],
  [144, 96, 48],
  [144, 96, 96],
  [144, 96, 144],
  [144, 96, 192],
  [144, 96, 240],
  [144, 144, 0],
  [144, 144, 48], //#906000,#906030,#906060,#906090,#9060C0,#9060F0,#909000,#909030
  [144, 144, 96],
  [144, 144, 144],
  [144, 144, 192],
  [144, 144, 240],
  [144, 192, 0],
  [144, 192, 48],
  [144, 192, 96],
  [144, 192, 144], //#909060,#909090,#9090C0,#9090F0,#90C000,#90C030,#90C060,#90C090
  [144, 192, 192],
  [144, 192, 240],
  [144, 240, 0],
  [144, 240, 48],
  [144, 240, 96],
  [144, 240, 144],
  [144, 240, 192],
  [144, 240, 240], //#90C0C0,#90C0F0,#90F000,#90F030,#90F060,#90F090,#90F0C0,#90F0F0
  [192, 0, 0],
  [192, 0, 48],
  [192, 0, 96],
  [192, 0, 144],
  [192, 0, 192],
  [192, 0, 240],
  [192, 48, 0],
  [192, 48, 48], //#C00000,#C00030,#C00060,#C00090,#C000C0,#C000F0,#C03000,#C03030
  [192, 48, 96],
  [192, 48, 144],
  [192, 48, 192],
  [192, 48, 240],
  [192, 96, 0],
  [192, 96, 48],
  [192, 96, 96],
  [192, 96, 144], //#C03060,#C03090,#C030C0,#C030F0,#C06000,#C06030,#C06060,#C06090
  [192, 96, 192],
  [192, 96, 240],
  [192, 144, 0],
  [192, 144, 48],
  [192, 144, 96],
  [192, 144, 144],
  [192, 144, 192],
  [192, 144, 240], //#C060C0,#C060F0,#C09000,#C09030,#C09060,#C09090,#C090C0,#C090F0
  [192, 192, 0],
  [192, 192, 48],
  [192, 192, 96],
  [192, 192, 144],
  [192, 192, 192],
  [192, 192, 240],
  [192, 240, 0],
  [192, 240, 48], //#C0C000,#C0C030,#C0C060,#C0C090,#C0C0C0,#C0C0F0,#C0F000,#C0F030
  [192, 240, 96],
  [192, 240, 144],
  [192, 240, 192],
  [192, 240, 240],
  [240, 0, 0],
  [240, 0, 48],
  [240, 0, 96],
  [240, 0, 144], //#C0F060,#C0F090,#C0F0C0,#C0F0F0,#F00000,#F00030,#F00060,#F00090
  [240, 0, 192],
  [240, 0, 240],
  [240, 48, 0],
  [240, 48, 48],
  [240, 48, 96],
  [240, 48, 144],
  [240, 48, 192],
  [240, 48, 240], //#F000C0,#F000F0,#F03000,#F03030,#F03060,#F03090,#F030C0,#F030F0
  [240, 96, 0],
  [240, 96, 48],
  [240, 96, 96],
  [240, 96, 144],
  [240, 96, 192],
  [240, 96, 240],
  [240, 144, 0],
  [240, 144, 48], //#F06000,#F06030,#F06060,#F06090,#F060C0,#F060F0,#F09000,#F09030
  [240, 144, 96],
  [240, 144, 144],
  [240, 144, 192],
  [240, 144, 240],
  [240, 192, 0],
  [240, 192, 48],
  [240, 192, 96],
  [240, 192, 144], //#F09060,#F09090,#F090C0,#F090F0,#F0C000,#F0C030,#F0C060,#F0C090
  [240, 192, 192],
  [240, 192, 240],
  [240, 240, 0],
  [240, 240, 48],
  [240, 240, 96],
  [240, 240, 144],
  [240, 240, 192],
  [240, 240, 240], //#F0C0C0,#F0C0F0,#F0F000,#F0F030,#F0F060,#F0F090,#F0F0C0,#F0F0F0
  [16, 16, 16],
  [16, 16, 128],
  [16, 16, 224],
  [16, 128, 16],
  [16, 128, 128],
  [16, 128, 224],
  [16, 224, 16],
  [16, 224, 128], //#101010,#101080,#1010E0,#108010,#108080,#1080E0,#10E010,#10E080
  [16, 224, 224],
  [128, 16, 16],
  [128, 16, 128],
  [128, 16, 224],
  [128, 128, 16],
  [128, 128, 128],
  [128, 128, 224],
  [128, 224, 16], //#10E0E0,#801010,#801080,#8010E0,#808010,#808080,#8080E0,#80E010
  [128, 224, 128],
  [128, 224, 224],
  [224, 16, 16],
  [224, 16, 128],
  [224, 16, 224],
  [224, 128, 16],
  [224, 128, 128],
  [224, 128, 224], //#80E080,#80E0E0,#E01010,#E01080,#E010E0,#E08010,#E08080,#E080E0
  [224, 224, 16],
  [224, 224, 128],
  [224, 224, 224],
  [64, 64, 64],
  [64, 64, 176],
  [64, 176, 64],
  [64, 176, 176],
  [176, 64, 64], //#E0E010,#E0E080,#E0E0E0,#404040,#4040B0,#40B040,#40B0B0,#B04040
  [176, 64, 176],
  [176, 176, 64],
  [176, 176, 176],
];

function get8bitColorIndex(r, g, b) {
  for (let i = 0; i < colors_8bit.length; i++) {
    const c = colors_8bit[i];
    if ((c[0] & 0xf0) == (r & 0xf0) && (c[1] & 0xf0) == (g & 0xf0) && (c[2] & 0xf0) == (b & 0xf0)) {
      return i;
    }
  }
  return -1;
}

function get8bitColor(index) {
  return colors_8bit[index];
}

function getClosest8bitColor(r, g, b) {
  let bestColor = colors_8bit[0];
  let bestDistance = getColorDistance(colors_8bit[0], [r, g, b]);
  for (let i = 1; i < colors_8bit.length; i++) {
    const dis = getColorDistance(colors_8bit[i], [r, g, b]);
    if (dis < bestDistance) {
      bestColor = colors_8bit[i];
      bestDistance = dis;
    }
  }
  return bestColor;
}

//color utils
function getColorDistance(c1, c2) {
  const r = c1[0] - c2[0];
  const g = c1[1] - c2[1];
  const b = c1[2] - c2[2];
  return Math.sqrt(r * r + g * g + b * b);
}

function mixColors(c1, c2) {
  const r = Math.round((c1[0] + c2[0]) / 2);
  const g = Math.round((c1[1] + c2[1]) / 2);
  const b = Math.round((c1[2] + c2[2]) / 2);
  return [r, g, b];
}

function areColorsEqual(c1, c2) {
  return c1[0] == c2[0] && c1[1] == c2[1] && c1[2] == c2[2];
}

function getColorIndex(colors, c) {
  for (let i = 0; i < colors.length; i++) {
    if (areColorsEqual(colors[i], c)) return i;
  }
  return -1;
}

function countUniqueColors(colors) {
  const uniqueColors = [];
  for (let i = 0; i < colors.length; i++) {
    if (getColorIndex(uniqueColors, colors[i]) < 0) {
      uniqueColors.push(colors[i]);
    }
  }
  return uniqueColors.length;
}

function findTwoClosestColors(colors) {
  let c1 = null;
  let c2 = null;
  let distance = 255 * 255 * 255;
  for (let i = 0; i < colors.length - 1; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const d = getColorDistance(colors[i], colors[j]);
      if (d < distance && d > 0) {
        c1 = colors[i];
        c2 = colors[j];
        distance = d;
      }
    }
  }

  return [c1, c2];
}

function replaceAllColors(colors, oldColor, newColor) {
  for (let i = 0; i < colors.length; i++) {
    if (areColorsEqual(colors[i], oldColor)) {
      colors[i] = newColor;
    }
  }
  return colors;
}

function convertBytesToColors(a) {
  const colors = [];
  for (let i = 0; i < a.length; i += 3) {
    colors.push([a[i + 0], a[i + 1], a[i + 2]]);
  }
  return colors;
}

function convertColorsToBytes(colors, a) {
  for (let i = 0; i < colors.length; i++) {
    a[i * 3 + 0] = colors[i][0];
    a[i * 3 + 1] = colors[i][1];
    a[i * 3 + 2] = colors[i][2];
  }
  return a;
}

function getBytesSection(a, row, col, numRows, numCols) {
  const sectionSize = a.length / 3 / (numRows * numCols);
  const sectionWidth = Math.sqrt(sectionSize);
  const sectionHeight = Math.sqrt(sectionSize);
  const arrayWidth = sectionWidth * numCols;

  const section = new Uint8Array(sectionSize * 3);
  for (let x = 0; x < sectionWidth; x++) {
    for (let y = 0; y < sectionHeight; y++) {
      const sectionIndex = y * sectionWidth + x;
      const arrayIndex = (y + row * sectionHeight) * arrayWidth + (x + col * sectionWidth);
      section[sectionIndex * 3 + 0] = a[arrayIndex * 3 + 0];
      section[sectionIndex * 3 + 1] = a[arrayIndex * 3 + 1];
      section[sectionIndex * 3 + 2] = a[arrayIndex * 3 + 2];
    }
  }
  return section;
}

function setBytesSection(a, section, row, col, numRows, numCols) {
  const sectionSize = a.length / 3 / (numRows * numCols);
  const sectionWidth = Math.sqrt(sectionSize);
  const sectionHeight = Math.sqrt(sectionSize);
  const arrayWidth = sectionWidth * numCols;

  for (let x = 0; x < sectionWidth; x++) {
    for (let y = 0; y < sectionHeight; y++) {
      const sectionIndex = y * sectionWidth + x;
      const arrayIndex = (y + row * sectionHeight) * arrayWidth + (x + col * sectionWidth);
      a[arrayIndex * 3 + 0] = section[sectionIndex * 3 + 0];
      a[arrayIndex * 3 + 1] = section[sectionIndex * 3 + 1];
      a[arrayIndex * 3 + 2] = section[sectionIndex * 3 + 2];
    }
  }
}

function verifyPixelSize(imageString, pixelSize) {
  const maxSize = 16;
  const diffRatio = maxSize / pixelSize;

  for (let x = 0; x < pixelSize; x++) {
    for (let y = 0; y < pixelSize; y++) {
      const pixelColor = imageString.substr((x * diffRatio * maxSize + y * diffRatio) * 3, 3);

      for (let x2 = 0; x2 < diffRatio; x2++) {
        for (let y2 = 0; y2 < diffRatio; y2++) {
          const otherColor = imageString.substr(((x * diffRatio + x2) * maxSize + (y * diffRatio + y2)) * 3, 3);
          if (pixelColor != otherColor) return false;
        }
      }
    }
  }
  return true;
}

function detectPixelSize(imageString) {
  if (imageString.length == 16 * 16 * 3) {
    if (verifyPixelSize(imageString, 4)) return 4; //4x4
    if (verifyPixelSize(imageString, 8)) return 8; //8x8
  }

  //default is 16x16
  return 16;
}

function detectColorDepth(imageString) {
  //check for 4bit depth
  let is4bit = true;
  for (let i = 0; i < imageString.length; i += 3) {
    if (
      get4bitColorIndex(
        parseInt(imageString[i + 0] + '0', 16),
        parseInt(imageString[i + 1] + '0', 16),
        parseInt(imageString[i + 2] + '0', 16),
      ) < 0
    ) {
      is4bit = false;
      break;
    }
  }
  if (is4bit) return 4;

  //check for 8bit depth
  let is8bit = true;
  for (let i = 0; i < imageString.length; i += 3) {
    if (
      get8bitColorIndex(
        parseInt(imageString[i + 0] + '0', 16),
        parseInt(imageString[i + 1] + '0', 16),
        parseInt(imageString[i + 2] + '0', 16),
      ) < 0
    ) {
      is8bit = false;
      break;
    }
  }
  if (is8bit) return 8;

  //default is 12bit
  return 12;
}

//Exports
export function dimensionToPixels(dimension) {
  return dimension * 16;
}

export function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(r, g, b) {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function websafeColor(color) {
  const quantum = 255 / 5;
  return quantum * Math.floor((color + quantum / 2) / quantum);
}

export function rgbToHexTriplet(r, g, b) {
  let hex = rgbToHex(r, g, b);
  hex = hex.split('');

  const safe = [];

  for (let i = 0; i < hex.length; i++) {
    if (i % 2 !== 1) safe.push(hex[i]);
  }

  return safe.join('');
}

export function generateWebSafeImage(imageColors, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = 'rgba(255,255,255,255)';
  ctx.fillRect(0, 0, width, height);

  let colorIndex = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (colorIndex < imageColors.length) {
        ctx.fillStyle = `#${imageColors[colorIndex]}`;
        ctx.fillRect(x, y, 1, 1);
      }

      colorIndex++;
    }
  }

  return canvas.toDataURL(`image/PNG`, 1);
}

export function getBytesFromCanvas(canvas, width, height) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [''];

  const sizeRatioWidth = width / canvas.width;
  const sizeRatioHeight = height / canvas.height;

  const rgbBytes = new Uint8Array(width * height * 3);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const rgb = ctx.getImageData(x, y, 1, 1).data;

      //width and height might be larger than the actual canvas width and height
      for (let y2 = 0; y2 < sizeRatioHeight; y2++) {
        for (let x2 = 0; x2 < sizeRatioWidth; x2++) {
          const aX = x * sizeRatioWidth + x2;
          const aY = y * sizeRatioHeight + y2;
          const index = (aY * width + aX) * 3;
          rgbBytes[index + 0] = rgb[0];
          rgbBytes[index + 1] = rgb[1];
          rgbBytes[index + 2] = rgb[2];
        }
      }
    }
  }
  return rgbBytes;
}

export function lowerBytesColorCount(rgbBytes, cols, rows, maxColors) {
  //lower color counts on a per section basis
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      let sectionBytes = getBytesSection(rgbBytes, r, c, rows, cols);

      //convert to color array and reduce color count
      let colors = convertBytesToColors(sectionBytes);
      let uniqueColorsCount = countUniqueColors(colors);
      while (uniqueColorsCount > maxColors) {
        const closestColors = findTwoClosestColors(colors);
        const mixed = mixColors(closestColors[0], closestColors[1]);
        colors = replaceAllColors(colors, closestColors[0], mixed);
        colors = replaceAllColors(colors, closestColors[1], mixed);
        uniqueColorsCount = countUniqueColors(colors);
      }

      //convert back to bytes
      sectionBytes = convertColorsToBytes(colors, sectionBytes);
      setBytesSection(rgbBytes, sectionBytes, r, c, rows, cols);
    }
  }
  return rgbBytes;
}

export function lowerBytesColorDepth(rgbBytes, colorDepth) {
  if (colorDepth < 8) {
    //4bit colors
    for (let i = 0; i < rgbBytes.length; i += 3) {
      const closestColor = getClosest4bitColor(rgbBytes[i + 0], rgbBytes[i + 1], rgbBytes[i + 2]);
      rgbBytes[i + 0] = closestColor[0];
      rgbBytes[i + 1] = closestColor[1];
      rgbBytes[i + 2] = closestColor[2];
    }
  } else if (colorDepth < 12) {
    //8bit colors
    const rBits = 3;
    const gBits = 3;
    const bBits = 2;
    for (let i = 0; i < rgbBytes.length; i += 3) {
      const closestColor = getClosest8bitColor(rgbBytes[i + 0], rgbBytes[i + 1], rgbBytes[i + 2]);
      rgbBytes[i + 0] = closestColor[0];
      rgbBytes[i + 1] = closestColor[1];
      rgbBytes[i + 2] = closestColor[2];
    }
  } else if (colorDepth < 24) {
    //12bit colors
    const rBits = 4;
    const gBits = 4;
    const bBits = 4;
    for (let i = 0; i < rgbBytes.length; i += 3) {
      rgbBytes[i + 0] = Math.floor(rgbBytes[i + 0] / Math.pow(2, 8 - rBits)) << (8 - rBits);
      rgbBytes[i + 1] = Math.floor(rgbBytes[i + 1] / Math.pow(2, 8 - gBits)) << (8 - gBits);
      rgbBytes[i + 2] = Math.floor(rgbBytes[i + 2] / Math.pow(2, 8 - bBits)) << (8 - bBits);
    }
  }

  return rgbBytes;
}

export function compressTileCode(tileCodeString) {
  if (tileCodeString.startsWith(IMAGE_COMPRESSED) || tileCodeString.startsWith(IMAGE_COMPRESSED_V2)) {
    return tileCodeString;
  }
  const uncompressedTitleCodeString = (' ' + tileCodeString).slice(1);

  //determine pixelSize and colorDepth based on code string
  const pixelSize = detectPixelSize(tileCodeString);
  const colorDepth = detectColorDepth(tileCodeString);

  //reduce string length for lower pixel sizes (16x16, 8x8, 4x4)
  if (pixelSize == 8) {
    //8x8
    const maxSize = 16;
    const diffRatio = maxSize / 8;
    let imageString = '';
    for (let y = 0; y < maxSize / diffRatio; y++) {
      for (let x = 0; x < maxSize / diffRatio; x++) {
        const pixelColor = tileCodeString.substr((y * diffRatio * maxSize + x * diffRatio) * 3, 3);
        imageString += pixelColor;
      }
    }
    tileCodeString = imageString;
  } else if (pixelSize == 4) {
    //4x4
    const maxSize = 16;
    const diffRatio = maxSize / 4;
    let imageString = '';
    for (let y = 0; y < maxSize / diffRatio; y++) {
      for (let x = 0; x < maxSize / diffRatio; x++) {
        const pixelColor = tileCodeString.substr((y * diffRatio * maxSize + x * diffRatio) * 3, 3);
        imageString += pixelColor;
      }
    }
    tileCodeString = imageString;
  }

  //reduce from hex triplets to hex doubles or hex singles
  if (colorDepth == 8) {
    //hex doubles
    let imageString = '';
    for (let i = 0; i < tileCodeString.length; i += 3) {
      const color = get8bitColorIndex(
        parseInt(tileCodeString[i + 0] + '0', 16),
        parseInt(tileCodeString[i + 1] + '0', 16),
        parseInt(tileCodeString[i + 2] + '0', 16),
      );
      imageString += color.toString(16).padStart(2, '0');
    }
    tileCodeString = imageString;
  } else if (colorDepth == 4) {
    //hex singles
    let imageString = '';
    for (let i = 0; i < tileCodeString.length; i += 3) {
      const color = get4bitColorIndex(
        parseInt(tileCodeString[i + 0] + '0', 16),
        parseInt(tileCodeString[i + 1] + '0', 16),
        parseInt(tileCodeString[i + 2] + '0', 16),
      );
      imageString += color.toString(16);
    }
    tileCodeString = imageString;
  }

  //8bit and 4bit color depths benefit from encoding a byte array vs hex string
  let data = tileCodeString;
  if (colorDepth == 8 || colorDepth == 4) {
    data = new Uint8Array(tileCodeString.length / 2);
    for (let i = 0; i < data.length; i++) {
      data[i] = parseInt(tileCodeString[i * 2 + 0] + tileCodeString[i * 2 + 1], 16);
    }
  }

  //compress and encode
  const zip = pako.deflate(data);
  const based = base91.encode(zip);
  const compressed = IMAGE_COMPRESSED_V2 + based;

  //console.log('uncompressedTitleCodeString: ' + uncompressedTitleCodeString);
  //console.log('compressed: ' + compressed);
  //console.log('decompress: ' + decompressTileCode(compressed));

  if (compressed.length > uncompressedTitleCodeString.length) return uncompressedTitleCodeString;
  return compressed;
}

export function decompressTileCode(tileCodeString) {
  if (
    typeof tileCodeString !== 'string' ||
    !(tileCodeString.startsWith(IMAGE_COMPRESSED) || tileCodeString.startsWith(IMAGE_COMPRESSED_V2))
  ) {
    return tileCodeString.trim();
  }

  //deocde and inflate
  let data = null;
  try {
    const str = tileCodeString.substr(IMAGE_COMPRESSED.length);
    const based = base91.decode(str);
    data = pako.inflate(based);
  } catch (err) {
    return tileCodeString;
  }

  //determine pixelSize and colorDepth based on data size
  let pixelSize = 16;
  let colorDepth = 12;
  if (tileCodeString.startsWith(IMAGE_COMPRESSED_V2)) {
    if (data.length == 8) {
      //4x4, 4bit colors
      pixelSize = 4;
      colorDepth = 4;
    } else if (data.length == 16) {
      //4x4, 8bit colors
      pixelSize = 4;
      colorDepth = 8;
    } else if (data.length == 48) {
      //4x4, 12bit colors
      pixelSize = 4;
      colorDepth = 12;
    } else if (data.length == 32) {
      //8x8, 4bit colors
      pixelSize = 8;
      colorDepth = 4;
    } else if (data.length == 64) {
      //8x8, 8bit colors
      pixelSize = 8;
      colorDepth = 8;
    } else if (data.length == 192) {
      //8x8, 12bit colors
      pixelSize = 8;
      colorDepth = 12;
    } else if (data.length == 128) {
      //16x16, 4bit colors
      pixelSize = 16;
      colorDepth = 4;
    } else if (data.length == 256) {
      //16x16, 8bit colors
      pixelSize = 16;
      colorDepth = 8;
    } else if (data.length == 768) {
      //16x16, 12bit colors
      pixelSize = 16;
      colorDepth = 12;
    }
  }

  //convert array to string
  tileCodeString = '';
  if (colorDepth == 8 || colorDepth == 4) {
    //8bit and 4bit color depth are encoded as byte arrays (not string char values)
    for (let i = 0; i < data.length; i++) {
      tileCodeString += data[i].toString(16).padStart(2, '0');
    }
  } else {
    tileCodeString = String.fromCharCode(...data);
  }

  //expand hex doubles or hex singles to hex triplets
  if (colorDepth == 8) {
    //hex doubles
    let imageString = '';
    for (let i = 0; i < tileCodeString.length; i += 2) {
      const color = get8bitColor(parseInt(tileCodeString.substr(i, 2), 16));
      imageString += (color[0] >> 4).toString(16) + (color[1] >> 4).toString(16) + (color[2] >> 4).toString(16);
    }
    tileCodeString = imageString;
  } else if (colorDepth == 4) {
    //hex singles
    let imageString = '';
    for (let i = 0; i < tileCodeString.length; i++) {
      const color = get4bitColor(parseInt(tileCodeString[i], 16));
      imageString += (color[0] >> 4).toString(16) + (color[1] >> 4).toString(16) + (color[2] >> 4).toString(16);
    }
    tileCodeString = imageString;
  }

  //increase string length from lower pixel sizes (16x16, 8x8, 4x4)
  if (pixelSize == 8) {
    //8x8
    const maxSize = 16;
    const diffRatio = maxSize / 8;
    let imageString = '';
    for (let y = 0; y < maxSize; y++) {
      for (let x = 0; x < maxSize; x++) {
        const pixelColor = tileCodeString.substr(
          (Math.floor(y / diffRatio) * (maxSize / diffRatio) + Math.floor(x / diffRatio)) * 3,
          3,
        );
        imageString += pixelColor;
      }
    }
    tileCodeString = imageString;
  } else if (pixelSize == 4) {
    //4x4
    const maxSize = 16;
    const diffRatio = maxSize / 4;
    let imageString = '';
    for (let y = 0; y < maxSize; y++) {
      for (let x = 0; x < maxSize; x++) {
        const pixelColor = tileCodeString.substr(
          (Math.floor(y / diffRatio) * (maxSize / diffRatio) + Math.floor(x / diffRatio)) * 3,
          3,
        );
        imageString += pixelColor;
      }
    }
    tileCodeString = imageString;
  }

  return tileCodeString;
}
