/*
 * This Binarizer is fast and produce good results, but the FastAdaptiveBinarizer proved to be
 * faster and more accurate in practice.
 */
import { BitMatrix } from "../../BitMatrix";
import { ByteMatrix } from "../../ByteMatrix";
import { sumArray } from "../../utils";
import { Binarizer } from "./Binarizer";

/**
 * @export
 * @class AdaptiveHysteresisBinarizer
 * @description Binarizer class uses a hybrid from local mean and hysteresis thresholding algorithm.
 * @extends {Binarizer}
 */
export class AdaptiveHysteresisBinarizer extends Binarizer {

    /**
     * block size for the local mean calculations required in the adaptive thresholding algorithm.
     */
    public static BLOCK_SIZE = 23;
    /**
     * Constant to widen the space between the lower and higher thresholds.
     */
    public static MEAN_CONST = 7;
    /**
     * Constant substracted from the local mean value for each block.
     */
    public static WHITE_CONST = 7;
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
     * @memberof AdaptiveHysteresisBinarizer
     */
    public binarize(data: Uint8ClampedArray, width: number, height: number): BitMatrix {
        if (data.length !== width * height * 4) {
            throw new Error("incorrect data length!");
        }
        // Convert the photo to single channel.
        const grayscaleMatrix = Binarizer.toGrayscale(data, width, height);
        // Calculate the adaptive threshold for each block.
        const T = this.adaptiveThreshold(grayscaleMatrix);
        const blockSize = AdaptiveHysteresisBinarizer.BLOCK_SIZE;
        const blocksCountX = Math.ceil(width / blockSize);
        const blocksCountY = Math.ceil(height / blockSize);
        const newBlackCells: number[] = [];
        for (let blockY = 0; blockY < blocksCountY; ++blockY) {
            for (let blockX = 0; blockX < blocksCountX; ++blockX) {

                const startY = blockY * blockSize;
                const startX = blockX * blockSize;
                const endY = Math.min(startY + blockSize, height);
                const endX = Math.min(startX + blockSize, width);
                for (let y = startY; y < endY; ++y) {
                    for (let x = startX; x < endX; ++x) {
                        const color = grayscaleMatrix.get(x, y);

                        if (color < T[0].get(blockX, blockY)) {
                            grayscaleMatrix.set(x, y, 0);
                            newBlackCells.push(x);
                            newBlackCells.push(y);
                        } else if (color > T[1].get(blockX, blockY)) {
                            grayscaleMatrix.set(x, y, 255);
                        } else {
                            grayscaleMatrix.set(x, y, 127);
                        }
                    }
                }
            }
        }
        const dx = [1, -1, 0, 0];
        const dy = [0, 0, 1, -1];
        while (newBlackCells.length > 0) {
            const y = newBlackCells.pop();
            const x = newBlackCells.pop();
            for (let i = 0; i < 4; ++i) {
                const newX = x + dx[i];
                const newY = y + dy[i];
                if (grayscaleMatrix.get(newX, newY) === 127) {
                    grayscaleMatrix.set(newX, newY, 0);
                    newBlackCells.push(newX);
                    newBlackCells.push(newY);
                }
            }
        }

        // convert to BitMatrix, and all none decided pixels (127 luminance) become white.
        const binarized = new BitMatrix(width, height);
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                binarized.set(x, y, grayscaleMatrix.get(x, y) === 0 ? 1 : 0);
            }
        }
        return binarized;
    }

    /**
     * @private
     * @description Calculates the lower and higher threshold for each block,
     * the mean of the smallest and largest halfs of block pixels.
     * @param {ByteMatrix} mat - greyscale matrix.
     * @returns {ByteMatrix[]} - The lower and higher threshold matrixes,
     * each cell represents threshold value for the corresponding block.
     * @memberof AdaptiveHysteresisBinarizer
     */
    private adaptiveThreshold(mat: ByteMatrix): ByteMatrix[] {
        const blockSize = AdaptiveHysteresisBinarizer.BLOCK_SIZE;
        const blocksCountX = Math.ceil(mat.width / blockSize);
        const blocksCountY = Math.ceil(mat.height / blockSize);
        // T[0] is the lower threshold, T[1] is the higher
        const T = [
            new ByteMatrix(blocksCountX, blocksCountY),
            new ByteMatrix(blocksCountX, blocksCountY),
        ];

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
                const portion = Math.ceil(pixels.length / AdaptiveHysteresisBinarizer.PORTION);
                const variance = pixels[pixels.length - portion] - pixels[portion];
                let average = [0, 0];
                if (variance > AdaptiveHysteresisBinarizer.MIN_VARIANCE) {
                    // If the variance between block pixels is larger than the minimum variance
                    // then consider them from different colors and use the average as
                    // the local threshold.
                    const constant = AdaptiveHysteresisBinarizer.MEAN_CONST;
                    const whiteConst = AdaptiveHysteresisBinarizer.WHITE_CONST;
                    average = [
                        // Low threshold value
                        sumArray(
                            pixels.slice(0, pixels.length >> 1),
                        ) / (pixels.length >> 1) + constant - whiteConst,
                        // High threshold value
                        sumArray(
                            pixels.slice(pixels.length >> 1, pixels.length),
                        ) / (pixels.length - (pixels.length >> 1)) - constant - whiteConst,
                    ];
                } else {
                    // If the variance is small then consider the block pixels has the same
                    // color equal to the left & top pixel average color since they are contained
                    // in the same block.
                    if (blockX > 0 && blockY > 0) {
                        average = [
                            (T[0].get(blockX - 1, blockY) + T[0].get(blockX, blockY - 1)) / 2,
                            (T[1].get(blockX - 1, blockY) + T[1].get(blockX, blockY - 1)) / 2,
                        ];
                    } else {
                        // if it's border then assume it's a white background, make average < min
                        average = [
                            pixels[0] / 2,
                            pixels[0] / 2,
                        ];
                    }
                }
                T[0].set(blockX, blockY, average[0]);
                T[1].set(blockX, blockY, average[1]);
            }
        }

        return T;
    }
}
