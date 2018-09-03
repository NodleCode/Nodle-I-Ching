import { ByteMatrix } from "../../ByteMatrix";
import { BLOCK_SIZE, MAX_VARIANCE } from "../../constants";

export function localMean(mat: ByteMatrix): ByteMatrix {
    const mean = new ByteMatrix(mat.rows, mat.cols);
    for (let y = 0; y < mat.rows; ++y) {
        for (let x = 0; x < mat.cols; ++x) {
            // Boundaries for block y coordinates.
            const yStart = Math.max(0, y - BLOCK_SIZE / 2);
            const yEnd = Math.min(mat.rows, y + BLOCK_SIZE / 2);
            // Boundaries for block x coordinates.
            const xStart = Math.max(0, x - BLOCK_SIZE / 2);
            const xEnd = Math.min(mat.cols, x + BLOCK_SIZE / 2);

            let sum = 0;
            // initialize min, max with the lowest, larget possible pixel values respectivily.
            let min = 255;
            let max = 0;
            for (let yPix = yStart; yPix < yEnd; ++yPix) {
                for (let xPix = xStart; xPix < xEnd; ++ xPix) {
                    const pixelValue = mat.get(x * BLOCK_SIZE + xPix, y * BLOCK_SIZE + yPix);
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
            if (variance > MAX_VARIANCE) {
                // If the variance between block pixels is larger than the maximum variance
                // then consider them from different colors and use the average as
                // the local threshold.
                mean.set(x, y, sum / (BLOCK_SIZE * BLOCK_SIZE));
            } else {
                // If the variance is small then consider the block pixels has the same color
                // equal to the left/top pixel color since they are contained in the same block.
                if (x > 0) {
                    mean.set(x, y, mean.get(x - 1, y));
                } else if (y > 0) {
                    mean.set(x, y, mean.get(x, y - 1));
                } else {
                    mean.set(x, y, 0);
                }
            }
        }
    }

    return mean;
}
