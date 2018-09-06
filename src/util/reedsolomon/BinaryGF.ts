/**
 * This class implements mathematical operations over binary Galois Fields using the provided
 * primitive polynomial.
 *
 * @export
 * @class BinaryGF
 */
export class BinaryGF {
    /**
     * GF(2^6) using x^6 + x + 1 as primitive polynomial.
     */
    public static BINARY_GF_6: BinaryGF = new BinaryGF(0x43, 6); // x^6 + x + 1

    private static M_LIMIT: number = 16;

    private size: number;
    private primitive: number;
    private expTable: Uint16Array;
    private logTable: Uint16Array;

    /**
     * Creates a new GF(2^m).
     *
     * @param {number} primitive - Irreducible polynomial of degree m.
     * @param {number} m - Exponent determining the size of the GF(2^m).
     * @throws Will throw an Error if m is bigger than the internal limit of 16.
     */
    public constructor(primitive: number, m: number) {
        if (m > BinaryGF.M_LIMIT) {
            throw new Error("GF size is too big!");
        }

        this.size = 1 << m;
        this.primitive = primitive;
        this.expTable = new Uint16Array(this.size);
        this.logTable = new Uint16Array(this.size);

        let x = 1;
        for (let i = 0; i < this.size - 1; i++) {
            this.expTable[i] = x;
            this.logTable[x] = i;
            x <<= 1;
            if (x & this.size) {
                x ^= this.primitive;
            }
        }
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

    /**
     * Raises a number to the given exponent.
     *
     * @param {number} x - Base.
     * @param {number} p - Exponent.
     * @returns {number} x to the power of p in GF(2^m).
     */
    public power(x: number, p: number): number {
        if (x === 0) {
            return 0;
        }
        return this.expTable[(this.logTable[x] * p) % (this.size - 1)];
    }
}
