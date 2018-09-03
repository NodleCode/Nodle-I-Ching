import { BitMatrix } from "../../BitMatrix";
import { ByteMatrix } from "../../ByteMatrix";
import { toGrayscale } from "./grayscale";
import { localMean } from "./localmean";

export function binarize(data: Uint8ClampedArray, rows: number, cols: number): BitMatrix {
    if (data.length !== cols * rows * 4) {
        throw new Error("incorrect data length!");
    }
    // Convert the photo to single channel.
    const greyscaleMatrix: ByteMatrix = toGrayscale(data, rows, cols);
    // Calculate the local mean for each pixels from surrounding pixels.
    const mean: ByteMatrix = localMean(greyscaleMatrix);

    // Threshold each pixel using the localmean threshold value calculated from surrounding block.
    const binarized = new BitMatrix(rows, cols);
    for (let y = 0; y < rows; ++y) {
        for (let x = 0; x < cols; ++x) {
            const pixelVal = greyscaleMatrix.get(x, y);
            const threshold = mean.get(x, y);
            binarized.set(x, y, pixelVal < threshold ? 1 : 0);
        }
    }
    return binarized;
}
