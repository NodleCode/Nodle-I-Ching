import { BinaryGFPoly } from "./BinaryGFPoly";

/**
 * This class implements mathematical operations over binary Galois Fields using the provided
 * primitive polynomial.
 *
 * @see [Wikipedia's page]{@link https://en.wikipedia.org/wiki/Finite_field} for more info.
 * @export
 * @class BinaryGF
 */
export class BinaryGF {
    /**
     * 6th degree polynomial x^6 + x + 1.
     */
    public static PRIMITIVE_DEGREE_6: number = 0x43;
    /**
     * GF(2^6).
     */
    public static BINARY_GF_6: BinaryGF = new BinaryGF(BinaryGF.PRIMITIVE_DEGREE_6, 6);
    /**
     * Upper limit on the size of the Galois Field GF(2^m).
     */
    public static M_LIMIT: number = 8;

    private size: number;
    private primitive: number;
    private expTable: Uint8ClampedArray;
    private logTable: Uint8ClampedArray;
    private zeroPoly: BinaryGFPoly;
    private onePoly: BinaryGFPoly;

    /**
     * Creates a new GF(2^m).
     *
     * @param {number} primitive - Irreducible polynomial of degree m.
     * @param {number} m - Exponent determining the size of the GF(2^m).
     * @throws Will throw an Error if m is bigger than the internal limit of 16.
     */
    public constructor(primitive: number, m: number) {
        if (m < 1 || m > BinaryGF.M_LIMIT) {
            throw new Error("Illegal value of Galois Field size!");
        }

        this.size = 1 << m;
        this.primitive = primitive;
        this.expTable = new Uint8ClampedArray(this.size);
        this.logTable = new Uint8ClampedArray(this.size);

        // Build exponent and log tables.
        let x = 1;
        for (let i = 0; i < this.size; i++) {
            this.expTable[i] = x;
            this.logTable[x] = i;
            // By convention, generator number alpha is equal to 2.
            x <<= 1;
            // if x >= 2^m: x %= primitive.
            if (x & this.size) {
                x ^= this.primitive;
            }
        }

        this.zeroPoly = new BinaryGFPoly(this, new Uint8ClampedArray([0]));
        this.onePoly = new BinaryGFPoly(this, new Uint8ClampedArray([1]));
    }

    /**
     * Returns the size of the instance's Galois Field.
     *
     * @returns {number}
     */
    public getSize(): number {
        return this.size;
    }

    /**
     * Raises 2 to the power of x in GF(2^m).
     *
     * @param {number} x - Exponent.
     * @returns {number} 2 to the power of x in GF(2^m).
     */
    public exp(x: number): number {
        return this.expTable[x];
    }

    /**
     * Returns the base 2 log of x in GF(2^m).
     *
     * @param {number} x - integer.
     * @returns {number} base 2 log of x in GF(2^m).
     */
    public log(x: number): number {
        if (x === 0) {
            throw new Error("Log(0) is not defined in Galois Fields!");
        }
        return this.logTable[x];
    }

    /**
     * Returns the polynomial 0.
     *
     * @returns {BinaryGFPoly}
     */
    public getZeroPoly(): BinaryGFPoly {
        return this.zeroPoly;
    }

    /**
     * Returns the polynomial 1.
     *
     * @returns {BinaryGFPoly}
     */
    public getOnePoly(): BinaryGFPoly {
        return this.onePoly;
    }

    /**
     * Creates the monomial coefficient * x^degree.
     *
     * @param {number} degree
     * @param {number} coefficient
     * @returns {BinaryGFPoly} coefficient * x^degree.
     * @throws Will throw an error if degree is negative.
     */
    public buildMonomial(degree: number, coefficient: number): BinaryGFPoly {
        if (degree < 0) {
            throw new Error("Monomial degree must be non-negative!");
        }

        const coefficients = new Uint8ClampedArray(degree + 1);
        coefficients[0] = coefficient;
        return new BinaryGFPoly(this, coefficients);
    }

    /**
     * Adds two numbers in GF(2^m).
     *
     * @param {number} x
     * @param {number} y
     * @returns {number} x + y in GF(2^m).
     */
    public add(x: number, y: number): number {
        return x ^ y;
    }

    /**
     * Multiplies two numbers in GF(2^m).
     *
     * @param {number} x
     * @param {number} y
     * @returns {number} x * y in GF(2^m).
     */
    public multiply(x: number, y: number): number {
        if (x === 0 || y === 0) {
            return 0;
        }
        return this.expTable[(this.logTable[x] + this.logTable[y]) % (this.size - 1)];
    }

    /**
     * Calculates the multiplicative inverse of a number in GF(2^m).
     *
     * @param {number} x
     * @returns {number} 1 / x in GF(2^m).
     * @throws Will throw an error if argument is zero.
     */
    public mulInverse(x: number): number {
        if (x === 0) {
            throw new Error("0 has no multiplicative inverse!");
        }
        return this.expTable[this.size - 1 - this.logTable[x]];
    }

    /**
     * Divides two numbers in GF(2^m).
     *
     * @param {number} x
     * @param {number} y
     * @returns {number} x / y in GF(2^m).
     * @throws Will throw an error in case of division by zero.
     */
    public divide(x: number, y: number): number {
        if (y === 0) {
            throw new Error("Division by zero!");
        }
        return this.multiply(x, this.mulInverse(y));
    }
}
