import { BinaryGF } from "./BinaryGF";
import { BinaryGFPoly } from "./BinaryGFPoly";

/**
 * This class implements Reed-Solomon decoding.
 *
 * @see [this guide]{@link https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders}
 * for more info.
 * @export
 * @class ReedSolomonDecoder
 */
export class ReedSolomonDecoder {
    private field: BinaryGF;

    /**
     * Creates a Reed-Solomon decoder for the given binary Galois Field.
     *
     * @param {BinaryGF} field - BinaryGF the encoder works in.
     */
    public constructor(field: BinaryGF) {
        this.field = field;
    }

    /**
     *
     *
     * @param {Uint8ClampedArray} received - Data to be decoded/corrected.
     * @param {number} ecSymbols - number of error correction symbols.
     * @returns {Uint8ClampedArray} corrected data.
     * @throws Will throw an error if the decoding process fails.
     */
    public decode(received: Uint8ClampedArray, ecSymbols: number): Uint8ClampedArray {
        // Convert received data into a polynomial.
        const receivedPoly = new BinaryGFPoly(this.field, received);

        // Compute syndromes polynomial and return in case of no errors.
        const syndromes = this.computeSyndromes(receivedPoly, ecSymbols);
        if (syndromes.isZero()) {
            return received;
        }

        // Compute error locator and error evaluator polynomials.
        const [errorLocator, errorEvaluator] = this.computeLocatorAndEvaluator(
            syndromes, ecSymbols,
        );

        // Compute error locator roots and error magnitudes.
        const errorLocations = this.computeErrorLocations(errorLocator);
        const errorMagnitudes = this.computeErrorMagnitudes(errorEvaluator, errorLocations);

        // Correct the errors.
        const corrected = new Uint8ClampedArray(received);
        for (let i = 0; i < errorLocations.length; i++) {
            const position = corrected.length - 1 - this.field.log(errorLocations[i]);
            // Sanity check.
            if (position < 0) {
                throw new Error("Invalid error location");
            }

            corrected[position] = this.field.add(corrected[position], errorMagnitudes[i]);
        }

        return corrected;
    }

    /**
     * Computes the syndromes polynomial from the given received data and the number of error
     * correction symbols.
     *
     * @param {BinaryGFPoly} poly - received data polynomial.
     * @param {number} ecSymbols - number of error correction symbols.
     * @returns {BinaryGFPoly} Syndromes polynomial.
     */
    private computeSyndromes(poly: BinaryGFPoly, ecSymbols: number): BinaryGFPoly {
        const coefficients = new Uint8ClampedArray(ecSymbols);
        for (let i = 0; i < ecSymbols; i++) {
            coefficients[ecSymbols - 1 - i] = poly.evaluateAt(this.field.exp(i));
        }
        return new BinaryGFPoly(this.field, coefficients);
    }

    /**
     * Computes the error locator and error evaluator polynomials, given the syndromes polynomials
     * and the number of error correction symbols. Uses an adaptation of the Extended Euclidean
     * Theorem.
     *
     * @see [this]{@link https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction} for
     * more info.
     * @param {BinaryGFPoly} syndromes
     * @param {number} ecSymbols
     * @returns {BinaryGFPoly[]} [errorLocator, errorEvaluator]
     */
    private computeLocatorAndEvaluator(syndromes: BinaryGFPoly, ecSymbols: number): BinaryGFPoly[] {
        let R2 = this.field.buildMonomial(ecSymbols, 1);
        let R1 = syndromes;
        let A2 = this.field.getZeroPoly();
        let A1 = this.field.getOnePoly();

        while (R1.getDegree() >= ecSymbols / 2) {
            const Q = R2.dividePoly(R1)[0];
            const R0 = R2.add(Q.multiplyPoly(R1));
            const A0 = A2.add(Q.multiplyPoly(A1));

            R2 = R1;
            R1 = R0;
            A2 = A1;
            A1 = A0;
        }

        const constant = A1.getCoefficient(0);
        const inverseConstant = this.field.mulInverse(constant);
        const errorLocator = A1.multiplyScalar(inverseConstant);
        const errorEvaluator = R1.multiplyScalar(inverseConstant);

        return [errorLocator, errorEvaluator];
    }

    /**
     * Computes the roots of the error locator polynomial using an exhaustive search. This is
     * possible because the number of elements of a binary Galois Field is limited. A possible
     * optimisation would be implementing Chien's search for a faster exhaustive search.
     *
     * @param {BinaryGFPoly} errorLocator
     * @returns {Uint8ClampedArray}
     * @throws Will throw an error if the error locator degree does not match the number of roots.
     */
    private computeErrorLocations(errorLocator: BinaryGFPoly): Uint8ClampedArray {
        const errorCount = errorLocator.getDegree();
        const locations = new Uint8ClampedArray(errorCount);

        // Exhaustive search for the roots.
        let e = 0;
        for (let i = 1; i < this.field.getSize() && e < errorCount; i++) {
            if (errorLocator.evaluateAt(i) === 0) {
                locations[e++] = this.field.mulInverse(i);
            }
        }

        // Sanity check.
        if (e !== errorCount) {
            throw new Error("Error locator degree does not match number of roots!");
        }

        return locations;
    }

    /**
     * Computes the error magnitudes from the error evaluator polynomial and the computed error
     * locations.
     *
     * @param {BinaryGFPoly} errorEvaluator
     * @param {Uint8ClampedArray} errorLocations
     * @returns {Uint8ClampedArray} error magnitudes.
     */
    private computeErrorMagnitudes(
        errorEvaluator: BinaryGFPoly, errorLocations: Uint8ClampedArray,
    ): Uint8ClampedArray {
        const errorCount = errorLocations.length;
        const magnitudes = new Uint8ClampedArray(errorCount);

        for (let i = 0; i < errorCount; i++) {
            const xiInverse = this.field.mulInverse(errorLocations[i]);
            let denominator = 1;

            for (let j = 0; j < errorCount; j++) {
                if (i === j) {
                    continue;
                }

                const term = this.field.add(1, this.field.multiply(xiInverse, errorLocations[j]));
                denominator = this.field.multiply(denominator, term);
            }

            magnitudes[i] = this.field.multiply(
                errorEvaluator.evaluateAt(xiInverse), this.field.mulInverse(denominator),
            );
        }

        return magnitudes;
    }
}
