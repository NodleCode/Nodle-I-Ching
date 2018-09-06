import { BinaryGF } from "./BinaryGF";
import { BinaryGFPoly } from "./BinaryGFPoly";

/**
 * This class implements Reed-Solomon encoding.
 *
 * @export
 * @class ReedSolomonEncoder
 */
export class ReedSolomonEncoder {
    private field: BinaryGF;
    private generators: BinaryGFPoly[];

    /**
     * Creates a Reed-Solomon encoder for the given binary Galois Field.
     *
     * @param {BinaryGF} field - BinaryGF the encoder works in.
     */
    public constructor(field: BinaryGF) {
        this.field = field;
        this.generators = [new BinaryGFPoly(field, new Uint16Array([0x1]))];
    }

    /**
     * Encodes the given data with the given number of error correction symbols.
     *
     * @param {Uint16Array} data - Data to be encoded.
     * @param {number} ecSymbols - Number of error symbols.
     * @returns {Uint16Array} Encoded data.
     * @throws Will throw an error if number of error correction symbols is zero.
     * @throws Will throw an error if data is empty.
     */
    public encode(data: Uint16Array, ecSymbols: number): Uint16Array {
        if (ecSymbols === 0) {
            throw new Error("No error correction symbols!");
        }
        if (data.length === 0) {
            throw new Error("No data symbols!");
        }

        const generator = this.getGenerator(ecSymbols);
        const encodedData = new Uint16Array(data.length + ecSymbols);
        encodedData.set(data);
        const encodedDataPoly = new BinaryGFPoly(this.field, encodedData);
        const remainderCoefficients = encodedDataPoly.dividePoly(generator)[1].getCoefficients();
        encodedData.set(remainderCoefficients, encodedData.length - remainderCoefficients.length);
        return encodedData;
    }

    private getGenerator(degree: number): BinaryGFPoly {
        for (let d = this.generators.length; d <= degree; d++) {
            this.generators.push(this.generators[d - 1].multiplyPoly(
                new BinaryGFPoly(this.field, new Uint16Array([1, this.field.power(2, d - 1)])),
            ));
        }
        return this.generators[degree];
    }
}
