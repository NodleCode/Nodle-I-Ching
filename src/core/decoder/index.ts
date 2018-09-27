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
