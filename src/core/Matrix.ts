/**
 * @export
 * @abstract
 * @class Matrix
 * @description Base class to represent a simple matrix with Uint8Clamped data
 */
export abstract class Matrix {
    /**
     * Number of columns in the Matrix
     */
    public width: number;
    /**
     * Number of rows in the Matrix
     */
    public height: number;
    /**
     * Matrix Internal data array - values between (0 - 255)
     */
    public data: Uint8ClampedArray;

    constructor(width: number, height: number) {
        if (!Number.isInteger(width) || !Number.isInteger(height)) {
            throw new Error("Width and height should be integers!");
        }
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height);
    }

    public get(x: number, y: number) {
        return this.data[y * this.width + x];
    }
}
