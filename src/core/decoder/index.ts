import { FastAdaptiveBinarizer } from "./binarizer";
import { DecodedIChing } from "./DecodedIChing";
import { Decoder } from "./Decoder";
import { Extractor } from "./extractor";
import { Locator } from "./locator";
import { CodeTransform } from "./transform";

/**
 * Decoder entry point - Decodes RGBA image containing IChing code to plain text.
 *
 * @export
 * @param {Uint8ClampedArray} data - Array containing RGBA image pixels, each pixel consists
 * of four consecutive cells representing red, green, blue, alpha values for the pixel.
 * [r0, g0, b0, a0, r1, g1, b1, a1, ...]
 * @param {number} width - Image width.
 * @param {number} height - Image Height.
 * @returns {DecodedIChing} - Decoded IChing contains plain data, and info about the original code.
 */
export function decode(data: Uint8ClampedArray, width: number, height: number): DecodedIChing {
    try {
        return decodeInternal(data, width, height);
    } catch (e) {
        for (let row = 0, idx = 0; row < height; row++) {
            for (let col = 0; col < width; col++, idx += 4) {
                data[idx] = 255 - data[idx];
                data[idx + 1] = 255 - data[idx + 1];
                data[idx + 2] = 255 - data[idx + 2];
            }
        }
        return decodeInternal(data, width, height);
    }
}

function decodeInternal(data: Uint8ClampedArray, width: number, height: number): DecodedIChing {
    const binarizer = new FastAdaptiveBinarizer();
    const binarizedMatrix = binarizer.binarize(data, width, height);

    const locator = new Locator();
    const patterns = locator.locate(binarizedMatrix);

    const transformer = new CodeTransform();
    const transformedMatrix = transformer.transform(binarizedMatrix, patterns);

    const extractor = new Extractor();
    const extractedData = extractor.extract(transformedMatrix);

    const decoder = new Decoder();
    const decodedData = decoder.decode(extractedData);
    decodedData.patterns = patterns;

    return decodedData;
}
