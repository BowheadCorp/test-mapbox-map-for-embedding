import { CURRENT_YEAR, SALE_START_YEAR } from './config';

/**
 * Linearly scales ("interpolates") a number from one range, [x1_min, x1_max],
 * into another, [x2_min, x2_max].
 */
export const lerp = (
  x: number,
  [x1_min, x1_max]: [number, number],
  [x2_min, x2_max]: [number, number],
): number =>
  x2_min + (
    (x - x1_min)
    * (x2_max - x2_min)
    / (x1_max - x1_min)
  );

/**
 * Converts units of `rem` to `px`.
 */
export const rem2px = (rem: number): number =>
  parseInt(getComputedStyle(document.documentElement).fontSize) * rem;

/**
 * Converts a year to a nice CSS hsl colour, as a string.
 */
export const year2color = (year: number): string => {
  const hue = lerp(
    year,
    // Add one to CURRENT_YEAR so that CURRENT_YEAR and SALE_START_YEAR have
    // different colours.
    [SALE_START_YEAR, CURRENT_YEAR + 1],
    [0, 360]
  );

  return `hsl(${hue}, 74%, 69%)`;
};
