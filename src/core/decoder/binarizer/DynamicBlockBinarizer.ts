/**
 * This Binarization method is slower than the FastAdaptiveBinarizer,
 * but more concrete, it could be used with high-end devices.
 */
import { Bit32Matrix } from "../../Bit32Matrix";
import { BitMatrix } from "../../BitMatrix";
import { ByteMatrix } from "../../ByteMatrix";
import { Binarizer } from "./Binarizer";

/**
 * @export
 * @class DynamicBlockBinarizer
 * @description Binarizer class uses adaptive threshold with dynamic blocksize to binarize pixels.
 * @extends {Binarizer}
 */
export class DynamicBlockBinarizer extends Binarizer {

    /**
     * Constant substracted from the local mean value for each block.
     */
    public static MEAN_CONST = 11;
    /**
     * Minimum possible variance for a block in order to be considered mix of different colors.
     */
    public static MIN_VARIANCE = 20;
    /**
     * Block size for the local mean calculations required in the adaptive thresholding algorithm.
     */
    public static BLOCK_SIZE = 32;

    /**
     * @description Main class method, converts RGBA image to binary image
     * @param {Uint8ClampedArray} data - Array containing RGBA image pixels, each pixel consists
     * of four consecutive cells representing red, green, blue, alpha values for the pixel.
     * [r0, g0, b0, a0, r1, g1, b1, a1, ...]
     * @param {number} rows - Number of rows (Height) of the image.
     * @param {number} cols - Number of columns (Width) of the image.
     * @returns {BitMatrix} - Matrix contains the binarized image, each pixel has 0 or 1 value.
     * @memberof DynamicBlockBinarizer
     */
    public binarize(data: Uint8ClampedArray, width: number, height: number): BitMatrix {
        if (data.length !== width * height * 4) {
            throw new Error("incorrect data length!");
        }
        // Convert the photo to single channel.
        const grayscaleMatrix = Binarizer.toGrayscale(data, width, height);
        // Calculate the adaptive threshold for each block.
        const T = this.calculateSumTable(grayscaleMatrix);
        const minVariance = DynamicBlockBinarizer.MIN_VARIANCE;
        const constant = DynamicBlockBinarizer.MEAN_CONST;
        const binarized = new BitMatrix(width, height);
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const color = grayscaleMatrix.get(x, y);
                let threshold = 0;
                for (let log = 3; log < 8; ++log) {
                    const halfBlock = 1 << (log - 1);
                    const startX = Math.max(x - halfBlock, 0);
                    const startY = Math.max(y - halfBlock, 0);
                    const endX = Math.min(x + halfBlock, width - 1);
                    const endY = Math.min(y + halfBlock, height - 1);
                    threshold = (
                        T.get(endX, endY) +
                        T.get(startX, startY) -
                        T.get(startX, endY) -
                        T.get(endX, startY)
                    ) / ((endX - startX) * (endY - startY)) - constant;

                    if (Math.abs(threshold - color) < minVariance) {
                        // If the variance is small then consider the block pixels has the same
                        // color equal to the left & top pixel average color since they are
                        // contained in the same block.
                        if (x > 0 && y > 0) {
                            threshold = (
                                grayscaleMatrix.get(x - 1, y) +
                                grayscaleMatrix.get(x, y - 1) +
                                grayscaleMatrix.get(x - 1, y - 1)
                            ) / 3;
                        } else {
                            // if it's border then assume it's a white background, make
                            // average < min
                            threshold = color / 2 - constant;
                        }
                    }

                    if (Math.abs(threshold - color) > minVariance) {
                        break;
                    }
                }
                grayscaleMatrix.set(x, y, threshold);
                binarized.set(x, y, color < threshold ? 1 : 0);
            }
        }
        return binarized;
    }

    /**
     * @private
     * @description Calculates the threshold for each block, the mean of the block pixels.
     * @param {ByteMatrix} mat - greyscale matrix.
     * @returns {ByteMatrix} - The threshold matrix, each cell represents
     * threshold value for the corresponding block.
     * @memberof DynamicBlockBinarizer
     */
    private calculateSumTable(mat: ByteMatrix): Bit32Matrix {
        const T = new Bit32Matrix(mat.width, mat.height);
        for (let y = 0; y < T.height; ++y) {
            for (let x = 0; x < T.width; ++x) {
                let value = mat.get(x, y);
                if (x > 0) {
                    value += T.get(x - 1, y);
                }
                if (y > 0) {
                    value += T.get(x, y - 1);
                }
                if (x > 0 && y > 0) {
                    value -= T.get(x - 1, y - 1);
                }
                T.set(x, y, value);
            }
        }
        return T;
    }
}
