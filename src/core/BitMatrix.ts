import { Matrix } from "./Matrix";

/**
 * @export
 * @class BitMatrix
 * @extends {Matrix}
 * @description Matrix class to represent bit cells (0 or 1 values).
 */
export class BitMatrix extends Matrix {
    public set(x: number, y: number, value: number) {
        this.data[y * this.cols + x] = value === 0 ? 0 : 1;
    }
}
