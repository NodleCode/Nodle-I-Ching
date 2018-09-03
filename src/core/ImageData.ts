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
        this.height = matrix.height;
        this.width = matrix.width;
        this.data = new Uint8ClampedArray(4 * this.height * this.width);
        let idx: number = 0;
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                let color: number = 255;
                if (matrix.get(j, i) === 1) {
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
