import { BinaryGF } from "./BinaryGF";
import { BinaryGFPoly } from "./BinaryGFPoly";

/**
 * This class implements Reed-Solomon encoding.
 *
 * @see [this guide]{@link https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders}
 * for more info.
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
        this.generators = [field.getOnePoly()];
    }

    /**
     * Encodes the given data with the given number of error correction symbols.
     *
     * @param {Uint8ClampedArray} data - Data to be encoded.
     * @param {number} ecSymbols - Number of error symbols.
     * @returns {Uint8ClampedArray} Encoded data.
     * @throws Will throw an error if data is empty.
     */
    public encode(data: Uint8ClampedArray, ecSymbols: number): Uint8ClampedArray {
        if (data.length === 0) {
            throw new Error("No data symbols!");
        }
        // No error correction symbols to be appended.
        if (ecSymbols === 0) {
            return data;
        }

        // Get generator polynomial of degree = ecSymbols.
        const generator = this.getGenerator(ecSymbols);

        // Pad the data with zeroes.
        const encodedData = new Uint8ClampedArray(data.length + ecSymbols);
        encodedData.set(data);
        const encodedDataPoly = new BinaryGFPoly(this.field, encodedData);

        // Remainder of encodedDataPoly / generator is the error correction symbols.
        const remainderPoly = encodedDataPoly.dividePoly(generator)[1];
        const remainderCoefficients = remainderPoly.getCoefficients();

        // Append error correction symbols and return.
        encodedData.set(remainderCoefficients, encodedData.length - remainderCoefficients.length);
        return encodedData;
    }

    /**
     * Returns an irreducible polynomial of the desired degree.
     * Polynomial is the product of factors (x - a^i) for i: 0 -> d - 1,
     * where d is the degree and a is the Galois Field generator number alpha.
     *
     * @param {number} degree - degree of polynomial.
     * @returns {BinaryGFPoly} generator polynomial of the desired degree.
     */
    private getGenerator(degree: number): BinaryGFPoly {
        for (let d = this.generators.length; d <= degree; d++) {
            this.generators.push(this.generators[d - 1].multiplyPoly(
                new BinaryGFPoly(
                    this.field, new Uint8ClampedArray([1, this.field.exp(d - 1)]),
                ),
            ));
        }
        return this.generators[degree];
    }
}
