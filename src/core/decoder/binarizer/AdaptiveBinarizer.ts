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
    public binarize(data: Uint8ClampedArray, width: number, height: number): BitMatrix {
        if (data.length !== width * height * 4) {
            throw new Error("incorrect data length!");
        }
        // Convert the photo to single channel.
        const grayscaleMatrix = this.toGrayscale(data, width, height);
        // Calculate the local mean for each pixels from surrounding pixels.
        const mean = this.localMean(grayscaleMatrix);

        // Threshold each pixel using the localmean value calculated from surrounding block.
        const binarized = new BitMatrix(width, height);
        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
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
        const mean = new ByteMatrix(mat.width, mat.height);
        const midBlockSize = Math.floor(Binarizer.BLOCK_SIZE / 2);
        for (let y = 0; y < mat.height; ++y) {
            for (let x = 0; x < mat.width; ++x) {
                // Boundaries for block y coordinates.
                const yStart = Math.max(0, y - midBlockSize);
                const yEnd = Math.min(mat.height, y + midBlockSize + 1);
                // Boundaries for block x coordinates.
                const xStart = Math.max(0, x - midBlockSize);
                const xEnd = Math.min(mat.width, x + midBlockSize + 1);

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
                        average = min / 2 - Binarizer.MEAN_CONST;
                    }
                }
                mean.set(x, y, average);
            }
        }

        return mean;
    }
}
