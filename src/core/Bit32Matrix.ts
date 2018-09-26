/**
 * @export
 * @abstract
 * @class Bit32Matrix
 * @description Matrix with each cell is an integer of size 32 bit.
 */
export class Bit32Matrix {
    /**
     * Number of columns in the Matrix
     */
    public width: number;
    /**
     * Number of rows in the Matrix
     */
    public height: number;
    /**
     * Matrix Internal data array - values between (0 -> 2^32-1)
     */
    public data: Uint32Array;

    constructor(width: number, height: number) {
        if (!Number.isInteger(width) || !Number.isInteger(height)) {
            throw new Error("Width and height should be integers!");
        }
        this.width = width;
        this.height = height;
        this.data = new Uint32Array(width * height);
    }

    public get(x: number, y: number) {
        return this.data[y * this.width + x];
    }
    public set(x: number, y: number, value: number) {
        this.data[y * this.width + x] = value;
    }
}
