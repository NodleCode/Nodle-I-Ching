import { BitMatrix } from "../BitMatrix";
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
     * UNIT_DIM - Basic "unit" dimension in pixels. All other dimensions are based on this.
     */
    public static UNIT_DIM: number = 14;
    /**
     * BITS_PER_SYMBOL - Number of bits represented in a single symbol.
     */
    public static BITS_PER_SYMBOL: number = 6;
    /**
     * SYMBOL_DIM - Height/width of a single symbol.
     */
    public static SYMBOL_DIM: number = (Writer.BITS_PER_SYMBOL * 2 - 1) * Writer.UNIT_DIM;
    /**
     * BIT_ZERO_OFFSET - Offset, from the left edge of the symbol,
     * of the middle bit area to be cleared if bit is zero.
     */
    public static BIT_ZERO_OFFSET: number = Writer.UNIT_DIM * 4.5;
    /**
     * BIT_ZERO_WIDTH - Width of the middle bit area to be cleared if bit is zero.
     */
    public static BIT_ZERO_WIDTH: number = Writer.UNIT_DIM * 2;
    /**
     * GAP_DIM - Size of the gap between any two adjacent symbols.
     */
    public static GAP_DIM: number = Writer.UNIT_DIM * 3;
    /**
     * FINDER_OUTER_RADIUS - Radius of the finder pattern's outer ring.
     */
    public static FINDER_OUTER_RADIUS: number = Writer.SYMBOL_DIM * 0.5;
    /**
     * FINDER_MIDDLE_RADIUS - Radius of the finder pattern's middle ring.
     */
    public static FINDER_MIDDLE_RADIUS: number = Writer.FINDER_OUTER_RADIUS * 5 / 7;
    /**
     * FINDER_INNER_RADIUS - Radius of the finder pattern's inner ring.
     */
    public static FINDER_INNER_RADIUS: number = Writer.FINDER_OUTER_RADIUS * 3 / 7;
    /**
     * QUIET_ZONE - Size of the quiet zone around the rendered symbol.
     */
    public static QUIET_ZONE: number = Writer.SYMBOL_DIM;

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
        const imgHeight = rows * this.SYMBOL_DIM + (rows - 1) * this.GAP_DIM
            + (this.FINDER_OUTER_RADIUS * 2 + this.QUIET_ZONE) * 2;
        const imgWidth = cols * this.SYMBOL_DIM + (cols - 1) * this.GAP_DIM
            + (this.FINDER_OUTER_RADIUS * 2 + this.QUIET_ZONE) * 2;

        // Creates a BitMatrix filled with 0s.
        const matrix = new BitMatrix(imgHeight, imgWidth);

        // Draw finder patterns.
        const finderOffset = this.QUIET_ZONE + this.FINDER_OUTER_RADIUS;
        this.drawFinderPattern({ x: finderOffset, y: finderOffset }, matrix);
        this.drawFinderPattern({ x: imgWidth - finderOffset, y: finderOffset }, matrix);
        this.drawFinderPattern({ x: finderOffset, y: imgHeight - finderOffset }, matrix);

        // Draw alignment pattern.
        this.drawAlignmentPattern(
            { x: imgWidth - finderOffset, y: imgHeight - finderOffset }, matrix,
        );

        // Draw symbols.
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.drawSymbol(i, j, code.data[i * cols + j], matrix);
            }
        }

        return new ImageData(matrix);
    }

    // TODO: Change filling algorithm.
    private static drawFinderPattern(centre: Point, matrix: BitMatrix): void {
        const r1 = this.FINDER_INNER_RADIUS;
        const r2 = this.FINDER_MIDDLE_RADIUS;
        const r3 = this.FINDER_OUTER_RADIUS;

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
        const r1 = this.FINDER_INNER_RADIUS;
        const r2 = this.FINDER_MIDDLE_RADIUS;

        for (let i = r1 + 1; i <= r2; i++) {
            this.drawCircle(centre, i, 1, matrix);
        }
    }

    /**
     * Draws a circle with the given parameters, using the mid-point algorithm variant with
     * integer-based arithmetic.
     *
     * @see [Wikipedia's page]{@link https://en.wikipedia.org/wiki/Midpoint_circle_algorithm}
     * for more info.
     */
    private static drawCircle(c: Point, r: number, color: number, matrix: BitMatrix): void {
        let x = r;
        let y = 0;
        let dx = 1;
        let dy = 1;
        let err = dx - 2 * r;
        while (x >= y) {
            this.setPixelSymmetricOctant(c, x, y, color, matrix);
            if (err <= 0) {
                y++;
                err += dy;
                dy += 2;
            } else {
                x--;
                dx += 2;
                err += dx - 2 * r;
            }
        }
    }

    /**
     * Takes pixel coordinates in one octant and sets it symmetrically in all 8 octants,
     * relative to the given centre.
     */
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
        const gridOffset = this.QUIET_ZONE + this.FINDER_OUTER_RADIUS * 2;
        const startX = col * (this.SYMBOL_DIM + this.GAP_DIM) + gridOffset;
        const startY = row * (this.SYMBOL_DIM + this.GAP_DIM) + gridOffset;
        const bitWidth = this.SYMBOL_DIM;
        const bitHeight = this.UNIT_DIM;

        for (let bit = 0, x = startX, y = startY; bit < this.BITS_PER_SYMBOL;
                bit++, y += bitHeight * 2) {
            // Draw a filled rectangle representing the bit.
            this.fillRect(x, y, bitWidth, bitHeight, 1, matrix);

            // If bit is zero, clear middle area.
            if ((mask & (1 << bit)) === 0) {
                this.fillRect(
                    x + this.BIT_ZERO_OFFSET, y, this.BIT_ZERO_WIDTH, bitHeight, 0, matrix,
                );
            }
        }
    }

    // Draws a filled rectangle with given parameters.
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
