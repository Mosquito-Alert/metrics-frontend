/**
 * @param hex - Hexadecimal color string (e.g., "#ff0000" or "ff0000")
 * @description Converts a hexadecimal color string to an RGB object.
 * @returns
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || [null, '0', '0', '0'];
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

/**
 *
 * @param - RGB object with properties r, g, b
 * @description Converts an RGB object to a hexadecimal color string.
 * @example rgbToHex({ r: 255, g: 0, b: 0 }) // returns "#ff0000"
 * @returns
 */
export const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const componentToHex = (c: number) => {
    var hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  };
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
};
