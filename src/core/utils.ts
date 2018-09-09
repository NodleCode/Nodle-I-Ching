/**
 * Calculates array sum
 *
 * @export
 * @param {Uint8ClampedArray} arr - Input array.
 * @returns - The sum of the array.
 */
export function sumArray(arr: Uint8ClampedArray): number {
    return arr.reduce((sum, x) => sum + x);
}
