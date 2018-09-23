import { BitMatrix } from "../core/BitMatrix";
import { Binarizer } from "../core/decoder/binarizer/Binarizer";
import { ImageData } from "../core/ImageData";

/**
 * Converts single channel image directly into bitmatrix.
 * This method is for testing purposes only and won't work will with realworld single
 * channel images.
 * @export
 * @param {ImageData} imgData
 * @returns {BitMatrix}
 */
export function singleChannelToBitMatrix(imgData: ImageData): BitMatrix {
    const img = Binarizer.toGrayscale(imgData.data, imgData.width, imgData.height);
    const mat = new BitMatrix(imgData.width, imgData.height);
    for (let y = 0; y < img.height; ++y) {
        for (let x = 0; x < img.width; ++x) {
            mat.set(x, y, img.get(x, y) < 100 ? 1 : 0);
        }
    }
    return mat;
}

/**
 * Returns a random integer in range [min, max].
 *
 * @export
 * @param {number} min - range start, inclusive.
 * @param {number} max - range end, inclusive.
 * @returns {number} random number in range.
 */
export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
