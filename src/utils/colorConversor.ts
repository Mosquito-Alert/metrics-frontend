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

export const rgbStringToHex = (rgbString: string) => {
  const rgbMatch = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) {
    throw new Error('Invalid RGB string format');
  }
  const r = parseInt(rgbMatch[1] as string, 10);
  const g = parseInt(rgbMatch[2] as string, 10);
  const b = parseInt(rgbMatch[3] as string, 10);
  return rgbToHex({ r, g, b });
};

export const adjustSaturation = (hex: any, saturationPercent: any) => {
  const { h, s, l } = hexToHsl(hex);

  const newSaturation = Math.max(0, Math.min(saturationPercent, 100));

  const newHex = hslToHex(h, newSaturation, l);
  return newHex;
};

function hexToHsl(hex: any) {
  let { r, g, b } = hexToRgb(hex);

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // Achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = h as number;
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: any, s: any, l: any) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return rgbToHex({ r, g, b });
}
