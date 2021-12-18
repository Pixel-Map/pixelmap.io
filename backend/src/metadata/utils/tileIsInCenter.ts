export function tileIsInCenter(tileNumber) {
  // Top Row
  if (tileNumber >= 1574 && tileNumber <= 1584) {
    return true;
  }
  // Second Row
  if (tileNumber >= 1655 && tileNumber <= 1665) {
    return true;
  }
  // Third Row
  if (tileNumber >= 1736 && tileNumber <= 1746) {
    return true;
  }
  // Fourth Row
  if (tileNumber >= 1817 && tileNumber <= 1827) {
    return true;
  }
  // Fifth Row
  if (tileNumber >= 1898 && tileNumber <= 1908) {
    return true;
  }
  // Sixth Row
  if (tileNumber >= 1979 && tileNumber <= 1989) {
    return true;
  }
  // Seventh Row
  if (tileNumber >= 2060 && tileNumber <= 2070) {
    return true;
  }
  // Eighth Row
  if (tileNumber >= 2141 && tileNumber <= 2151) {
    return true;
  }
  // Ninth Row
  if (tileNumber >= 2222 && tileNumber <= 2232) {
    return true;
  }
  // Tenth Row
  if (tileNumber >= 2303 && tileNumber <= 2313) {
    return true;
  }
  // Bottom Row
  if (tileNumber >= 2384 && tileNumber <= 2394) {
    return true;
  }

  // Clearly not in the center
  return false;
}
