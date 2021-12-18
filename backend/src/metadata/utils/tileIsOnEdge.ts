export function tileIsOnEdge(tileNumber) {
  // Top Row
  if (tileNumber >= 0 && tileNumber <= 80) {
    return true;
  }
  // Bottom Row
  if (tileNumber >= 3888 && tileNumber <= 3969) {
    return true;
  }

  // Left Side
  const leftSide = [
    81, 162, 243, 324, 405, 486, 567, 648, 729, 810, 891, 972, 1053, 1134, 1215, 1296, 1377, 1458, 1539, 1620, 1701,
    1782, 1863, 1944, 2025, 2106, 2187, 2268, 2349, 2430, 2511, 2592, 2673, 2754, 2835, 2916, 2997, 3078, 3159, 3240,
    3321, 3402, 3483, 3564, 3645, 3726, 3807, 3888, 3969,
  ];
  if (leftSide.includes(tileNumber)) {
    return true;
  }

  const rightSide = [
    80, 161, 242, 323, 404, 485, 566, 647, 728, 809, 890, 971, 1052, 1133, 1214, 1295, 1376, 1457, 1538, 1619, 1700,
    1781, 1862, 1943, 2024, 2105, 2186, 2267, 2348, 2429, 2510, 2591, 2672, 2753, 2834, 2915, 2996, 3077, 3158, 3239,
    3320, 3401, 3482, 3563, 3644, 3725, 3806, 3887, 3968,
  ];
  if (rightSide.includes(tileNumber)) {
    return true;
  }

  // Clearly not on the side
  return false;
}
