import { BitMatrix } from "./core/BitMatrix";
import { ByteMatrix } from "./core/ByteMatrix";
import { Binarizer } from "./core/decoder/binarizer/Binarizer";

/**
 * Converts single channel image directly into bitmatrix.
 * This method is for testing purposes only and won't work will with realworld single
 * channel images.
 * @export
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @returns {BitMatrix}
 */
export function singleChannelToBitMatrix(
    data: Uint8ClampedArray,
    width: number,
    height: number,
): BitMatrix {
    const img = Binarizer.toGrayscale(data, width, height);
    const mat = new BitMatrix(width, height);
    for (let y = 0; y < img.height; ++y) {
        for (let x = 0; x < img.width; ++x) {
            mat.set(x, y, img.get(x, y) < 100 ? 1 : 0);
        }
    }
    return mat;
}
