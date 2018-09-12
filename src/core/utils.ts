/**
 * Calculates array sum
 *
 * @export
 * @param {UInt16Array} arr - Input array.
 * @returns - The sum of the array.
 */
export function sumArray(arr: Uint16Array): number {
    return arr.reduce((sum, x) => sum + x);
}
