import { BinaryGF, ReedSolomonEncoder } from "../common/reedsolomon";
import { EncodedIChing } from "./EncodedIChing";

/**
 * Encoder class encapsulating IChing content encoding methods.
 *
 * @export
 * @class Encoder
 */
export class Encoder {
    /**
     * VERSION - IChing code version.
     */
    public static VERSION: number = 1;
    /**
     * Maximum size of IChing code.
     */
    public static MAX_SIZE: number = 64;
    /**
     * Offset of the start of the payload (Number of metadata symbols).
     */
    public static OFFSET: number = 2;
    /**
     * Error correction level none: no error correction capabilities will be added.
     */
    public static EC_NONE: number = 0;
    /**
     * Error correction level low: up to 5% of symbols can be corrected.
     */
    public static EC_LOW: number = 0.05;
    /**
     * Error correction level medium: up to 15% of symbols can be corrected.
     */
    public static EC_MEDIUM: number = 0.15;
    /**
     * Error correction level high: up to 25% of symbols can be corrected.
     */
    public static EC_HIGH: number = 0.25;
    /**
     * Number of error correction symbols needed to correct a single error.
     */
    public static SYMBOLS_PER_ERROR: number = 2;
    /**
     * MAPPING_TABLE - Table used to convert alpha-numeric characters from Unicode (table index)
     * to internal codes (table value) used in IChing.
     */
    public static MAPPING_TABLE: Int8Array = new Int8Array([
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            26, 27, 28, 29, 30, 31, 32, 33, 34, 35, -1, -1, -1, -1, -1, -1,
            -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
            15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
            -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
            15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    ]);

    /**
     * Creates an IChing code from provided content.
     *
     * @param {string} content
     * @param {number} ecLevel - percentage of symbols that can be corrected after encoding, must
     * be between 0 - 1.
     * @returns {@link EncodedIChing} An EncodedIChing object with the version, size,
     * and data fields set.
     * @throws Will throw an error if the payload to be encoded is empty.
     * @throws Will throw an error if payload and error correction level combination is bigger than
     * the maximum IChing size.
     * @throws Will throw an error if the payload contains an invalid character.
     * @throws Will throw an error if ecLevel out of 0 - 1 boundary.
     * @throws Will throw an error if Reed-Solomon encoding fails.
     */
    public encode(payload: string, ecLevel: number): EncodedIChing {
        if (payload.length === 0) {
            throw new Error("Empty payload!");
        }
        if (ecLevel < 0 || ecLevel > 1) {
            throw new Error("Error correction percentage must be a value between 0 - 1!");
        }

        // Error correction symbols required to match error correction level.
        let ecSymbols = Math.ceil(payload.length * ecLevel) * Encoder.SYMBOLS_PER_ERROR;

        // Minimum number of symbols required to encode content at error correction level.
        const minimumSize = Encoder.OFFSET + payload.length + ecSymbols;

        if (minimumSize > Encoder.MAX_SIZE) {
            throw new Error("Payload and error correction level combination is too big!");
        }

        // Calculate square size that fits content at error correction level.
        let sideLength = 1;
        while (sideLength * sideLength < minimumSize) {
            sideLength++;
        }
        const trueSize = sideLength * sideLength;

        // Re-evaluate error correction symbols to fit square. Must be even.
        ecSymbols += (trueSize - minimumSize) & (~1);

        // Initialise data array.
        const data: Uint8ClampedArray = new Uint8ClampedArray(trueSize - ecSymbols);
        // If size is odd, fill extra symbol.
        if ((trueSize - minimumSize) & 1) {
            data[trueSize - 1 - ecSymbols] = 0;
        }
        data[0] = Encoder.VERSION;
        data[1] = payload.length;
        for (let i = 0; i < payload.length; i++) {
            const charCode = payload.charCodeAt(i);
            const mappedChar = charCode < Encoder.MAPPING_TABLE.length ?
            Encoder.MAPPING_TABLE[charCode] : -1;
            if (mappedChar === -1) {
                throw new Error("Invalid character in payload!");
            }
            data[i + Encoder.OFFSET] = mappedChar;
        }

        // Compute and append error correction symbols.
        const rsEncoder = new ReedSolomonEncoder(BinaryGF.BINARY_GF_6);
        let encodedData: Uint8ClampedArray;
        try {
            encodedData = rsEncoder.encode(data, ecSymbols);
        } catch (e) {
            throw new Error("Reed-Solomon encoding failed: '" + e.message + "'!");
        }

        return { version: data[0], size: sideLength, data: encodedData, imageData: null };
    }
}
