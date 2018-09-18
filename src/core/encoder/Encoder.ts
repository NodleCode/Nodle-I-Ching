import { BinaryGF, ReedSolomonEncoder } from "../common/reedsolomon";
import { EncodedIChing } from "../EncodedIChing";

// TODO: constant error correction levels.

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
    public static VERSION: number = 0;
    /**
     * Number of rows of IChing code.
     */
    public static ROWS: number = 8;
    /**
     * Number of columns of IChing code.
     */
    public static COLS: number = 8;
    /**
     * Offset of the start of the payload (Number of metadata symbols).
     */
    public static OFFSET: number = 2;
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
     * @static
     * @param {string} content
     * @returns {@link EncodedIChing}
     */
    public static encode(content: string): EncodedIChing {
        const version: number = this.VERSION;
        const rows: number = this.ROWS;
        const cols: number = this.COLS;
        const offset: number = this.OFFSET;

        if (content.length > rows * cols - offset) {
            throw new Error("Content is too long for IChing Version " + version + "!");
        }

        const data: Uint8ClampedArray = new Uint8ClampedArray(content.length + offset);
        data[0] = version;
        data[1] = content.length;
        for (let i = 0; i < content.length; i++) {
            const char = content.charAt(i);
            const charCode = content.charCodeAt(i);
            const mappedChar = this.MAPPING_TABLE[charCode];
            if (mappedChar === -1) {
                throw new Error(
                    "Character '" + char + "' is not supported in IChing Version " + version + "!",
                );
            }
            data[i + offset] = mappedChar;
        }

        // Calculate the number of error correction symbols. Must be even.
        let ecSymbols = (rows * cols - offset - content.length);
        if (ecSymbols & 1) {
            ecSymbols ^= 1;
        }
        // Compute and append error correction symbols.
        const rsEncoder = new ReedSolomonEncoder(BinaryGF.BINARY_GF_6);
        const encodedData = rsEncoder.encode(data, ecSymbols);

        return { version, rows, cols, data: encodedData };
    }
}
