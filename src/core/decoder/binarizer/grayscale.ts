import { ByteMatrix } from "../../ByteMatrix";
import { TO_GRAY } from "../../constants";

/**
 * @export
 * @description Transforms image data to greyscale ByteMatrix
 * @param {Uint8ClampedArray} data - pixels data with 4 cells per pixel representing RGBA values
 * @param {number} cols - Number of columns of the original image
 * @param {number} rows - Number of rows of the original image
 * @returns {ByteMatrix} - ByteMatrix contains grayscale values converted using luma formula
 */
export function toGrayscale(data: Uint8ClampedArray, rows: number, cols: number): ByteMatrix {
    const greyscaleMatrix = new ByteMatrix(cols, rows);
    for (let y = 0; y < rows; ++y) {
        for (let x = 0; x < cols; ++x) {
            // 4 cells to hold RGBA values for each pixels
            const idx = (y * cols + x) * 4;
            const red = data[idx + 0];
            const green = data[idx + 1];
            const blue = data[idx + 2];
            greyscaleMatrix.set(x, y,
                red * TO_GRAY.RED +
                green * TO_GRAY.GREEN +
                blue * TO_GRAY.BLUE);
        }
    }

    return greyscaleMatrix;
}
