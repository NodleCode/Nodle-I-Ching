import { Matrix } from "./Matrix";

/**
 * @export
 * @class BitMatrix
 * @extends {Matrix}
 * @description Matrix class to represent bit cells (0 or 1 values).
 */
export class BitMatrix extends Matrix {
    public set(x: number, y: number, value: number) {
        this.data[y * this.width + x] = value === 0 ? 0 : 1;
    }

    /**
     * Convert BitMatrix to image pixels stored as ImageData interface.
     *
     * @returns {ImageData}
     * @memberof BitMatrix
     */
    public toImage(): ImageData {
        const width = this.width;
        const height = this.height;
        const data = new Uint8ClampedArray(4 * height * width);
        let idx: number = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let color: number = 255;
                if (this.get(x, y) === 1) {
                    color = 0;
                }
                data[idx] = color;
                data[idx + 1] = color;
                data[idx + 2] = color;
                data[idx + 3] = 255;
                idx += 4;
            }
        }
        return { width, height, data };
    }
}
