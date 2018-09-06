import { ByteMatrix } from "../../ByteMatrix";

export abstract class Binarizer {
    /**
     * Grayscale conversion cofficients.
     * ITU-R recommendation (BT.709).  This formula, sometimes called Luma
     * Gray = (Red * 0.2126 + Green * 0.7152 + Blue * 0.0722)
     */
    public static TO_GRAY = {
        RED: 0.2126,
        GREEN: 0.7152,
        BLUE: 0.0722,
    };

    /**
     * block size for the local mean calculations required in the adaptive thresholding algorithm.
     * Have to be an odd Number
     */
    public static BLOCK_SIZE = 7;
    /**
     * Constant substracted from the local mean value for each block.
     */
    public static MEAN_CONST = 0;

    /**
     * Minimum possible variance for a block in order to be considered mix of different colors.
     */
    public static MIN_VARIANCE = 25;

    /**
     * @description Transforms image data to grayscale ByteMatrix
     * @param {Uint8ClampedArray} data - pixels data with 4 cells per pixel representing RGBA values
     * @param {number} cols - Number of columns of the original image
     * @param {number} rows - Number of rows of the original image
     * @returns {ByteMatrix} - ByteMatrix contains grayscale values converted using luma formula
     */
    protected toGrayscale(data: Uint8ClampedArray, width: number, height: number): ByteMatrix {
        const grayscaleMatrix = new ByteMatrix(width, height);
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                // 4 cells to hold RGBA values for each pixels
                const idx = (y * width + x) * 4;
                const red = data[idx + 0];
                const green = data[idx + 1];
                const blue = data[idx + 2];
                grayscaleMatrix.set(x, y,
                    red * Binarizer.TO_GRAY.RED +
                    green * Binarizer.TO_GRAY.GREEN +
                    blue * Binarizer.TO_GRAY.BLUE);
            }
        }

        return grayscaleMatrix;
    }
}
