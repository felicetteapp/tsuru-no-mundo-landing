// Easing functons from easing.net

/**
 * Easing function for easeInOutExpo.
 * @param {number} x - The input value.
 * @returns {number} - The eased value.
 */
export function easeInOutExpo(x) {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? Math.pow(2, 20 * x - 10) / 2
    : (2 - Math.pow(2, -20 * x + 10)) / 2;
}


export function linear(x) {

  return x;
}


/**
 * Calculates the eased value between two numbers.
 * @param {number} from - The starting value.
 * @param {number} to - The ending value.
 * @param {number} progress - The progress between 0 and 1.
 * @param {function} easeFn - The easing function to use.
 * @returns {number} - The eased value.
 */
export const calculateEaseBetween = (from, to, progress, easeFn) => {
  const ease = easeFn(Math.min(1, Math.max(0, progress)));
  return from + (to - from) * ease;
};