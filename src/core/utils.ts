/**
 * Calculates array sum
 *
 * @export
 * @param {any} arr - Input array.
 * @returns - The sum of the array.
 */
export function sumArray(arr: any): number {
    return (arr as any).reduce((sum: number, x: number) => sum + x);
}
