import { EncodedIChing } from "./EncodedIChing";
import { Encoder } from "./Encoder";
import { Writer } from "./writer";

/**
 * Encoder optional parameters.
 *
 * @interface EncoderOptions
 */
export interface EncoderOptions {
    /**
     * Percentage of symbols that can be corrected after encoding, must be between 0 - 1.
     * Default value is 0.15.
     */
    ecLevel?: number;
    /**
     * desired height and width of the rendered image.
     * Default value is 1250.
     */
    resolution?: number;
}

/**
 * Encoder entry point - Encodes plain text in IChing RGBA image.
 *
 * @export
 * @param {string} payload
 * @param {EncoderOptions} [options]
 * @returns {EncodedIChing} - Encoded image data alongside code metadata.
 */
export function encode(payload: string, options?: EncoderOptions): EncodedIChing {
    options = options || {};
    if (options.ecLevel === undefined || options.ecLevel === null) {
        options.ecLevel = Encoder.EC_MEDIUM;
    }

    if (options.resolution === undefined || options.resolution === null) {
        options.resolution = 1250;
    }

    const encoder = new Encoder();
    const encodedData = encoder.encode(payload, options.ecLevel);

    const writer = new Writer(options.resolution);
    writer.render(encodedData);

    return encodedData;
}
