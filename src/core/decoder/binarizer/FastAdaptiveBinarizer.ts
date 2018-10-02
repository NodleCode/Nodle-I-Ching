/**
 * This is the main Binarization method at the library, it's both fast and accurate and suitable to
 * wide ranges of end devices.
 */
import { BitMatrix } from "../../BitMatrix";
import { ByteMatrix } from "../../ByteMatrix";
import { Binarizer } from "./Binarizer";

/**
 * @export
 * @class FastAdaptiveBinarizer
 * @description Binarizer class uses fast enhanced adaptive threshold method to binarize pixels.
 * @extends {Binarizer}
 */
export class FastAdaptiveBinarizer extends Binarizer {

    /**
     * Constant substracted from the local mean value for each block.
     */

    public static MEAN_CONST = 2;
    /**
     * Minimum possible variance for a block in order to be considered mix of different colors.
     */
    public static MIN_VARIANCE = 20;
    /**
     * Block size for the local mean calculations required in the adaptive thresholding algorithm.
     */
    public static BLOCK_SIZE = 80;

    /**
     * @description Main class method, converts RGBA image to binary image
     * @param {Uint8ClampedArray} data - Array containing RGBA image pixels, each pixel consists
     * of four consecutive cells representing red, green, blue, alpha values for the pixel.
     * [r0, g0, b0, a0, r1, g1, b1, a1, ...]
     * @param {number} width - Image width.
     * @param {number} height - Image height.
     * @returns {BitMatrix} - Matrix contains the binarized image, each pixel has 0 or 1 value.
     * @memberof FastAdaptiveBinarizer
     */
    public binarize(data: Uint8ClampedArray, width: number, height: number): BitMatrix {
        if (data.length !== width * height * 4) {
            throw new Error("incorrect data length!");
        }
        if (width < FastAdaptiveBinarizer.BLOCK_SIZE || height < FastAdaptiveBinarizer.BLOCK_SIZE) {
            throw new Error("Image is too small!");
        }
        // Convert the photo to single channel.
        const grayscaleMatrix = Binarizer.toGrayscale(data, width, height);
        // Calculate the adaptive threshold for each block.
        const T = this.calculateLocalMeanTable(grayscaleMatrix);
        const minVariance = FastAdaptiveBinarizer.MIN_VARIANCE;
        const constant = FastAdaptiveBinarizer.MEAN_CONST;
        const binarized = new BitMatrix(width, height);
        const blockSize = FastAdaptiveBinarizer.BLOCK_SIZE;
        const halfBlock = blockSize >> 1;
        for (let y = 0, blockY; y < height; ++y) {
            blockY = Math.max(Math.min(y + halfBlock, height - 1) - blockSize + 1, 0);

            for (let x = 0, blockX; x < width; ++x) {
                blockX = Math.max(Math.min(x + halfBlock, width - 1) - blockSize + 1, 0);

                const color = grayscaleMatrix.get(x, y);
                let threshold = T.get(blockX, blockY);

                if (Math.abs(threshold - color) < minVariance) {
                    // If the variance is small then consider the block pixels has the same
                    // color equal to the left & top pixel average color since they are contained
                    // in the same block.
                    if (x > 0 && y > 0) {
                        const neighboursAvg = (
                            grayscaleMatrix.get(x - 1, y) +
                            grayscaleMatrix.get(x, y - 1) +
                            grayscaleMatrix.get(x - 1, y - 1)
                        ) / 3;
                        if (Math.abs(threshold - color) < Math.abs(neighboursAvg - color)) {
                            threshold = neighboursAvg;
                        }
                    } else {
                        // if it's border then assume it's a white background, make average < min
                        threshold = color / 2 - constant;
                    }
                }
                binarized.set(x, y, color < threshold ? 1 : 0);
                grayscaleMatrix.set(x, y, threshold);
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
     * @memberof FastAdaptiveBinarizer
     */
    private calculateLocalMeanTable(mat: ByteMatrix): ByteMatrix {
        const T = new ByteMatrix(mat.width, mat.height);
        const rowSum = new Uint16Array(mat.height);
        const blockSize = FastAdaptiveBinarizer.BLOCK_SIZE;
        const constant = FastAdaptiveBinarizer.MEAN_CONST;
        const endX = T.width - blockSize + 1;
        const endY = T.height - blockSize + 1;

        // Handle the first row and column as a special case to avoid
        // unnecessary conditions in the loop.
        for (let y = 0; y < T.height; ++y) {
            for (let x = 0; x < blockSize; ++x) {
                rowSum[y] += mat.get(x, y);
            }
        }

        let colSum = 0;
        for (let y = 0; y < blockSize; ++y) {
            colSum += rowSum[y];
        }
        T.set(0, 0, colSum / (blockSize * blockSize) - constant);

        let prev = colSum;
        for (let y = 1; y < endY; ++y) {
            colSum = prev - rowSum[y - 1] + rowSum[y + blockSize - 1];
            T.set(0, y, colSum / (blockSize * blockSize) - constant);
            prev = colSum;
        }

        // resolve the remaining matrix
        for (let x = 1; x < endX; ++x) {
            for (let y = 0; y < T.height; ++y) {
                rowSum[y] += mat.get(x + blockSize - 1, y) - mat.get(x - 1, y);
            }

            // handle the first row in that column
            colSum = 0;
            for (let y = 0; y < blockSize; ++y) {
                colSum += rowSum[y];
            }
            T.set(x, 0, colSum / (blockSize * blockSize) - constant);

            prev = colSum;
            for (let y = 1; y < endY; ++y) {
                colSum = prev - rowSum[y - 1] + rowSum[y + blockSize - 1];
                T.set(x, y, colSum / (blockSize * blockSize) - constant);
                prev = colSum;
            }
        }
        return T;
    }
}
