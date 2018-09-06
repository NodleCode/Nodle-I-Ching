import { Matrix } from "./Matrix";

/**
 * @export
 * @class ByteMatrix
 * @extends {Matrix}
 * @description Matrix class to represent byte cells.
 */
export class ByteMatrix extends Matrix {
    public set(x: number, y: number, value: number) {
        this.data[y * this.width + x] = value;
    }
}
