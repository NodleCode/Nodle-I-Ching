import { BinaryGF, ReedSolomonEncoder } from "../../util/reedsolomon";
import { EncodedIChing } from "../EncodedIChing";

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
     * Width, in symbols, of IChing code.
     */
    public static WIDTH: number = 8;
    /**
     * Height, in symbols, of IChing code.
     */
    public static HEIGHT: number = 8;
    /**
     * MAPPING_TABLE - Table used to convert alpha-numeric characters from Unicode (table index)
     * to internal codes (table value) used in IChing.
     */
    public static MAPPING_TABLE: Int16Array = new Int16Array([
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
            -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
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
        const width: number = this.WIDTH;
        const height: number = this.HEIGHT;

        if (content.length > width * height - 2) {
            throw new Error("Content is too long for IChing Version " + version + "!");
        }

        const data: Uint16Array = new Uint16Array(content.length + 2);
        data[0] = version;
        data[1] = content.length;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            const mappedChar = this.MAPPING_TABLE[char];
            if (mappedChar === -1) {
                throw new Error(
                    "Character '" + char + "' is not supported in IChing Version " + version + "!",
                );
            }
            data[i + 2] = mappedChar;
        }

        const ecSymbols = width * height - 2 - data.length;
        let encodedData: Uint16Array;
        if (ecSymbols > 0) {
            const rsEncoder = new ReedSolomonEncoder(BinaryGF.BINARY_GF_6);
            encodedData = rsEncoder.encode(data, ecSymbols);
        } else {
            encodedData = data;
        }

        return { version, width, height, data: encodedData };
    }
}
