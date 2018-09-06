import { BitMatrix } from "./BitMatrix";

/**
 * Class representing image data for a rendered IChing.
 *
 * @export
 * @class ImageData
 */
export class ImageData {
    public height: number;
    public width: number;
    public data: Uint8ClampedArray;

    public constructor(matrix: BitMatrix) {
        this.width = matrix.width;
        this.height = matrix.height;
        this.data = new Uint8ClampedArray(4 * this.height * this.width);
        let idx: number = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let color: number = 255;
                if (matrix.get(x, y) === 1) {
                    color = 0;
                }
                this.data[idx] = color;
                this.data[idx + 1] = color;
                this.data[idx + 2] = color;
                this.data[idx + 3] = 255;
                idx += 4;
            }
        }
    }
}
