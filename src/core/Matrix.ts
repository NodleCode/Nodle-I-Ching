/**
 * @export
 * @abstract
 * @class Matrix
 * @description Base class to represent a simple matrix with Uint8Clamped data
 */
export abstract class Matrix {
    /**
     * Number of rows in the Matrix
     */
    public rows: number;
    /**
     * Number of columns in the Matrix
     */
    public cols: number;
    /**
     * Matrix Internal data array - values between (0 - 255)
     */
    protected data: Uint8ClampedArray;

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.data = new Uint8ClampedArray(rows * cols);
    }

    public get(x: number, y: number) {
        return this.data[y * this.cols + x];
    }
}
