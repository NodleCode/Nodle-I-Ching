import { BinaryGF, ReedSolomonDecoder } from "../common/reedsolomon";
import { Encoder } from "../encoder";

/**
 * Decoder class encapsulating IChing content decoding methods.
 *
 * @export
 * @class Decoder
 */
export class Decoder {
    /**
     * Creates a payload string from received IChing raw data. Assumes metadata symbols are always
     * correct.
     *
     * @static
     * @param {Uint8ClampedArray} received - raw data.
     * @returns {string} decoded payload.
     */
    public static decode(received: Uint8ClampedArray): string {
        if (received[0] !== Encoder.VERSION) {
            throw new Error("Invalid IChing version!");
        }

        // Payload length.
        const dataLength = received[1];
        // Metadata length.
        const offset: number = Encoder.OFFSET;

        // Calculate the number of error correction symbols. Must be even.
        let ecSymbols = Encoder.ROWS * Encoder.COLS - offset - dataLength;
        if (ecSymbols & 1) {
            ecSymbols ^= 1;
        }
        // Correct potential errors.
        const rsDecoder = new ReedSolomonDecoder(BinaryGF.BINARY_GF_6);
        let corrected: Uint8ClampedArray;
        try {
            corrected = rsDecoder.decode(received, ecSymbols);
        } catch (e) {
            throw new Error("Invalid IChing Code!");
        }

        // Check that error correction was valid and did not alter metadata symbols.
        for (let i = 0; i < offset; i++) {
            if (corrected[i] !== received[i]) {
                throw new Error("Invalid IChing Code!");
            }
        }

        // Convert corrected data to string.
        const table = Encoder.MAPPING_TABLE;
        let payload: string = "";
        for (let i = 0; i < dataLength; i++) {
            const charCode = table.indexOf(corrected[offset + i]);
            if (charCode === -1) {
                throw new Error("Invalid IChing Code!");
            }

            payload += String.fromCharCode(charCode);
        }

        return payload;
    }
}
