import { BitMatrix } from "../../BitMatrix";
import { ByteMatrix } from "../../ByteMatrix";
import { sumArray } from "../../utils";
import { Binarizer } from "./Binarizer";

/**
 * @export
 * @class AdaptiveStaticBinarizer
 * @description Binarizer class uses enhanced adaptive threshold method to binarize pixels
 * @extends {Binarizer}
 */
export class AdaptiveStaticBinarizer extends Binarizer {

    /**
     * Block size for the local mean calculations required in the adaptive thresholding algorithm.
     */
    public static BLOCK_SIZE = 41;
    /**
     * Constant substracted from the local mean value for each block.
     */
    public static MEAN_CONST = 7;
    /**
     * Array portion to check the variance with.
     */
    public static PORTION = 5;
    /**
     * Minimum possible variance for a block in order to be considered mix of different colors.
     */
    public static MIN_VARIANCE = 20;

    /**
     * @description Main class method, converts RGBA image to binary image
     * @param {Uint8ClampedArray} data - Array containing RGBA image pixels, each pixel consists
     * of four consecutive cells representing red, green, blue, alpha values for the pixel.
     * [r0, g0, b0, a0, r1, g1, b1, a1, ...]
     * @param {number} rows - Number of rows (Height) of the image.
     * @param {number} cols - Number of columns (Width) of the image.
     * @returns {BitMatrix} - Matrix contains the binarized image, each pixel has 0 or 1 value.
     * @memberof AdaptiveStaticBinarizer
     */
    public binarize(data: Uint8ClampedArray, width: number, height: number): BitMatrix {
        if (data.length !== width * height * 4) {
            throw new Error("incorrect data length!");
        }
        // Convert the photo to single channel.
        const grayscaleMatrix = Binarizer.toGrayscale(data, width, height);
        // Calculate the adaptive threshold for each block.
        const T = this.adaptiveThreshold(grayscaleMatrix);

        const binarized = new BitMatrix(width, height);
        const blockSize = AdaptiveStaticBinarizer.BLOCK_SIZE;
        const blocksCountX = Math.ceil(width / blockSize);
        const blocksCountY = Math.ceil(height / blockSize);

        for (let blockY = 0; blockY < blocksCountY; ++blockY) {
            for (let blockX = 0; blockX < blocksCountX; ++blockX) {

                const startY = blockY * blockSize;
                const startX = blockX * blockSize;
                const endY = Math.min(startY + blockSize, height);
                const endX = Math.min(startX + blockSize, width);
                for (let y = startY; y < endY; ++y) {
                    for (let x = startX; x < endX; ++x) {
                        const color = grayscaleMatrix.get(x, y);
                        binarized.set(x, y, color < T.get(blockX, blockY) ? 1 : 0);
                    }
                }
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
     * @memberof AdaptiveStaticBinarizer
     */
    private adaptiveThreshold(mat: ByteMatrix): ByteMatrix {
        const blockSize = AdaptiveStaticBinarizer.BLOCK_SIZE;
        const blocksCountX = Math.ceil(mat.width / blockSize);
        const blocksCountY = Math.ceil(mat.height / blockSize);
        const T = new ByteMatrix(blocksCountX, blocksCountY);

        for (let blockY = 0; blockY < blocksCountY; ++blockY) {
            for (let blockX = 0; blockX < blocksCountX; ++blockX) {
                const startY = blockY * blockSize;
                const startX = blockX * blockSize;
                const endY = Math.min(startY + blockSize, mat.height);
                const endX = Math.min(startX + blockSize, mat.width);

                const pixels: Uint8Array = new Uint8Array((endY - startY) * (endX - startX));
                for (let y = startY, idx = 0; y < endY; ++y) {
                    for (let x = startX; x < endX; ++x, ++idx) {
                        pixels[idx] = mat.get(x, y);
                    }
                }

                pixels.sort();
                const portion = Math.ceil(pixels.length / AdaptiveStaticBinarizer.PORTION);
                const variance = pixels[pixels.length - portion] - pixels[portion];
                let average = 0;
                if (variance > AdaptiveStaticBinarizer.MIN_VARIANCE) {
                    // If the variance between block pixels is larger than the minimum variance
                    // then consider them from different colors and use the average as
                    // the local threshold.
                    average = sumArray(pixels) / pixels.length - AdaptiveStaticBinarizer.MEAN_CONST;
                } else {
                    // If the variance is small then consider the block pixels has the same
                    // color equal to the left & top pixel average color since they are contained
                    // in the same block.
                    if (blockX > 0 && blockY > 0) {
                        average = (
                            T.get(blockX - 1, blockY) +
                            T.get(blockX, blockY - 1) +
                            T.get(blockX - 1, blockY - 1)
                        ) / 3;
                    } else {
                        // if it's border then assume it's a white background, make average < min
                        average = pixels[0] / 2;
                    }
                }
                T.set(blockX, blockY, average);
            }
        }

        return T;
    }
}
