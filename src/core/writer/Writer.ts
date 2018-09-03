import { BitMatrix } from "../BitMatrix";
import * as Constants from "../Constants";
import { EncodedIChing } from "../EncodedIChing";
import { ImageData } from "../ImageData";
import { Point } from "../Point";

/**
 * Writer class encapsulating IChing rendering methods.
 *
 * @export
 * @class Writer
 */
export class Writer {
    /**
     * Renders the provided encoded IChing.
     *
     * @static
     * @param {EncodedIChing} code - Object representing an encoded IChing.
     * @returns {ImageData} - Image data for the rendered IChing.
     */
    public static render(code: EncodedIChing): ImageData {
        const rows = code.rows;
        const cols = code.cols;
        const imgHeight = (rows + 4) * Constants.SYMBOL_DIM + (rows - 1) * Constants.GAP_DIM;
        const imgWidth = (cols + 4) * Constants.SYMBOL_DIM + (cols - 1) * Constants.GAP_DIM;

        // Creates a BitMatrix filled with 0s.
        const matrix = new BitMatrix(imgHeight, imgWidth);

        // Draw finder patterns.
        this.drawFinderPattern(
            { x: Constants.FINDER_OFFSET, y: Constants.FINDER_OFFSET }, matrix,
        );
        this.drawFinderPattern(
            { x: imgWidth - Constants.FINDER_OFFSET, y: Constants.FINDER_OFFSET }, matrix,
        );
        this.drawFinderPattern(
            { x: Constants.FINDER_OFFSET, y: imgHeight - Constants.FINDER_OFFSET }, matrix,
        );

        // Draw alignment pattern.
        this.drawAlignmentPattern(
            { x: imgWidth - Constants.FINDER_OFFSET, y: imgHeight - Constants.FINDER_OFFSET },
            matrix,
        );

        // Draw symbols.
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.drawSymbol(i, j, code.data[i * cols + j], matrix);
            }
        }

        return new ImageData(matrix);
    }

    private static drawFinderPattern(centre: Point, matrix: BitMatrix): void {
        const r1 = Constants.FINDER_RADIUS * 3 / 7;
        const r2 = Constants.FINDER_RADIUS * 5 / 7;
        const r3 = Constants.FINDER_RADIUS;

        // Inner black circle.
        for (let i = 0; i <= r1; i++) {
            this.drawCircle(centre, i, 1, matrix);
        }

        // Outer black ring.
        for (let i = r2 + 1; i <= r3; i++) {
            this.drawCircle(centre, i, 1, matrix);
        }
    }

    private static drawAlignmentPattern(centre: Point, matrix: BitMatrix): void {
        const r1 = Constants.FINDER_RADIUS * 3 / 7;
        const r2 = Constants.FINDER_RADIUS * 5 / 7;

        for (let i = r1 + 1; i <= r2; i++) {
            this.drawCircle(centre, i, 1, matrix);
        }
    }

    private static drawCircle(c: Point, r: number, color: number, matrix: BitMatrix): void {
        let x = 0;
        let y = r;
        let d = 3 - 2 * r;
        while (y >= x) {
            this.setPixelSymmetricOctant(c, x, y, color, matrix);
            x++;
            if (d > 0) {
                y--;
                d = d + 4 * (x - y) + 10;
            } else {
                d = d + 4 * x + 6;
            }
        }
    }

    private static setPixelSymmetricOctant(
        c: Point, x: number, y: number, color: number, matrix: BitMatrix,
    ): void {
        matrix.set(c.x + x, c.y + y, color);
        matrix.set(c.x + x, c.y - y, color);
        matrix.set(c.x - x, c.y + y, color);
        matrix.set(c.x - x, c.y - y, color);
        matrix.set(c.x + y, c.y + x, color);
        matrix.set(c.x + y, c.y - x, color);
        matrix.set(c.x - y, c.y + x, color);
        matrix.set(c.x - y, c.y - x, color);
    }

    private static drawSymbol(row: number, col: number, mask: number, matrix: BitMatrix): void {
        const startX = col * (Constants.SYMBOL_DIM + Constants.GAP_DIM) + Constants.GRID_OFFSET;
        const startY = row * (Constants.SYMBOL_DIM + Constants.GAP_DIM) + Constants.GRID_OFFSET;

        for (let b = 0; b < Constants.BITS_PER_SYMBOL; b++) {
            this.fillRect(
                startX, startY + Constants.UNIT_DIM * b * 2,
                Constants.SYMBOL_DIM, Constants.UNIT_DIM, 1, matrix,
            );

            if ((mask & (1 << b)) === 0) {
                this.fillRect(
                    startX + Constants.UNIT_DIM * 4.5, startY + Constants.UNIT_DIM * b * 2,
                    Constants.UNIT_DIM * 2, Constants.UNIT_DIM, 0, matrix,
                );
            }
        }
    }

    private static fillRect(
        x: number, y: number, width: number, height: number, color: number, matrix: BitMatrix,
    ): void {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                matrix.set(x + j, y + i, color);
            }
        }
    }
}
