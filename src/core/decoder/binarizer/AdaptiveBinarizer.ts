import { BitMatrix } from "../../BitMatrix";
import { ByteMatrix } from "../../ByteMatrix";
import { Binarizer } from "./Binarizer";

/**
 * @export
 * @class AdaptiveBinarizer
 * @description Binarizer class uses enhanced adaptive threshold method to binarize pixels
 * @extends {Binarizer}
 */
export class AdaptiveBinarizer extends Binarizer {

    /**
     * @description Main class method, converts RGBA image to binary image
     * @param {Uint8ClampedArray} data - Array containing RGBA image pixels, each pixel consists
     * of four consecutive cells representing red, green, blue, alpha values for the pixel.
     * [r0, g0, b0, a0, r1, g1, b1, a1, ...]
     * @param {number} rows - Number of rows (Height) of the image.
     * @param {number} cols - Number of columns (Width) of the image.
     * @returns {BitMatrix} - Matrix contains the binarized image, each pixel has 0 or 1 value.
     * @memberof AdaptiveBinarizer
     */
    public binarize(data: Uint8ClampedArray, rows: number, cols: number): BitMatrix {
        if (data.length !== cols * rows * 4) {
            throw new Error("incorrect data length!");
        }
        // Convert the photo to single channel.
        const grayscaleMatrix = this.toGrayscale(data, rows, cols);
        // Calculate the local mean for each pixels from surrounding pixels.
        const mean = this.localMean(grayscaleMatrix);

        // Threshold each pixel using the localmean value calculated from surrounding block.
        const binarized = new BitMatrix(rows, cols);
        for (let y = 0; y < rows; ++y) {
            for (let x = 0; x < cols; ++x) {
                const pixelVal = grayscaleMatrix.get(x, y);
                const threshold = mean.get(x, y);
                binarized.set(x, y, pixelVal < threshold ? 1 : 0);
            }
        }
        return binarized;
    }

    /**
     * @private
     * @description Calculates threshold for each pixel, the local mean of surronding block.
     * @param {ByteMatrix} mat - greyscale matrix.
     * @returns {ByteMatrix} - threshold matrix, each cell represents threshold value
     * for the corresponding pixel.
     * @memberof AdaptiveBinarizer
     */
    private localMean(mat: ByteMatrix): ByteMatrix {
        const mean = new ByteMatrix(mat.rows, mat.cols);
        for (let y = 0; y < mat.rows; ++y) {
            for (let x = 0; x < mat.cols; ++x) {
                // Boundaries for block y coordinates.
                const yStart = Math.max(0, y - Binarizer.BLOCK_SIZE / 2);
                const yEnd = Math.min(mat.rows, y + Binarizer.BLOCK_SIZE / 2);
                // Boundaries for block x coordinates.
                const xStart = Math.max(0, x - Binarizer.BLOCK_SIZE / 2);
                const xEnd = Math.min(mat.cols, x + Binarizer.BLOCK_SIZE / 2);

                let sum = 0;
                // Initialise min, max with the highest, lowest possible pixel values respectively.
                let min = 255;
                let max = 0;
                for (let yPix = yStart; yPix < yEnd; ++yPix) {
                    for (let xPix = xStart; xPix < xEnd; ++ xPix) {
                        const pixelValue = mat.get(xPix, yPix);
                        // Calculate the pixels sum in the block
                        sum += pixelValue;
                        // Determine the lowest and larget pixel in the block
                        if (pixelValue > max) {
                            max = pixelValue;
                        }
                        if (pixelValue < min) {
                            min = pixelValue;
                        }
                    }
                }

                const variance = max - min;
                let average;
                if (variance > Binarizer.MIN_VARIANCE) {
                    // If the variance between block pixels is larger than the maximum variance
                    // then consider them from different colors and use the average as
                    // the local threshold.
                    average = sum / (Binarizer.BLOCK_SIZE * Binarizer.BLOCK_SIZE)
                        - Binarizer.MEAN_CONST;
                } else {
                    // If the variance is small then consider the block pixels has the same
                    // color equal to the left & top pixel average color since they are contained
                    // in the same block.
                    if (x > 0 && y > 0) {
                        average = (mean.get(x - 1, y) + mean.get(x, y - 1)) / 2;
                    } else {
                        // if it's border then assume it's a white background, make average < min
                        average = min - Binarizer.MEAN_CONST;
                    }
                }
                mean.set(x, y, average);
            }
        }

        return mean;
    }
}
