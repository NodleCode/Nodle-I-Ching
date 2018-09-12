import { BitMatrix } from "../BitMatrix";
import { EncodedIChing } from "../EncodedIChing";
import { Point } from "../geometry";
import { ImageData } from "../ImageData";

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
    public static UNIT_DIM: number = 2;
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

    private matrix: BitMatrix;
    private scale: number;
    private width: number;
    private height: number;
    private padX: number;
    private padY: number;

    /**
     * Creates an instance of Writer.
     *
     * @param {number} [resolution=2142] - desired height and width of the rendered image.
     */
    public constructor(resolution: number = 2142) {
        this.height = resolution;
        this.width = resolution;
    }

    /**
     * Renders the provided encoded IChing.
     *
     * @param {EncodedIChing} code - Object representing an encoded IChing.
     * @returns {ImageData} - Image data for the rendered IChing.
     */
    public render(code: EncodedIChing): ImageData {
        const codeRows = code.rows;
        const codeCols = code.cols;
        // Unscaled image height.
        const baseHeight = codeRows * Writer.SYMBOL_DIM + (codeRows - 1) * Writer.GAP_DIM
            + (Writer.FINDER_OUTER_RADIUS * 2 + Writer.QUIET_ZONE) * 2;
        // Unscaled image width.
        const baseWidth = codeCols * Writer.SYMBOL_DIM + (codeCols - 1) * Writer.GAP_DIM
            + (Writer.FINDER_OUTER_RADIUS * 2 + Writer.QUIET_ZONE) * 2;

        // Calculate scaling factor based on base dimensions and desired output image dimension.
        this.scale = Math.min(
            Math.floor(this.width / baseWidth), Math.floor(this.height / baseHeight),
        );
        if (this.scale < 1) {
            throw new Error("Resolution is too small!");
        }

        // Creates a BitMatrix filled with 0s.
        this.matrix = new BitMatrix(this.width, this.height);

        // Calculate padding.
        this.padX = Math.floor((this.width - baseWidth * this.scale) / 2);
        this.padY = Math.floor((this.height - baseHeight * this.scale) / 2);

        // Draw finder patterns.
        const finderOffsetX = (Writer.QUIET_ZONE + Writer.FINDER_OUTER_RADIUS) * this.scale
            + this.padX;
        const finderOffsetY = (Writer.QUIET_ZONE + Writer.FINDER_OUTER_RADIUS) * this.scale
            + this.padY;
        this.drawFinderPattern({ x: finderOffsetX, y: finderOffsetY });
        this.drawFinderPattern({ x: this.width - finderOffsetX, y: finderOffsetY });
        this.drawFinderPattern({ x: finderOffsetX, y: this.height - finderOffsetY });

        // Draw alignment pattern.
        this.drawAlignmentPattern(
            { x: this.width - finderOffsetX, y: this.height - finderOffsetY },
        );

        // Draw symbols.
        for (let i = 0; i < codeRows; i++) {
            for (let j = 0; j < codeCols; j++) {
                this.drawSymbol(i, j, code.data[i * codeCols + j]);
            }
        }

        return this.matrix.toImage();
    }

    // TODO: Change filling algorithm.
    private drawFinderPattern(centre: Point): void {
        const r1 = Writer.FINDER_INNER_RADIUS * this.scale;
        const r2 = Writer.FINDER_MIDDLE_RADIUS * this.scale;
        const r3 = Writer.FINDER_OUTER_RADIUS * this.scale;

        // Outer black ring.
        this.fillCircle(centre, r3, 1);

        // Middle white ring.
        this.fillCircle(centre, r2, 0);

        // Inner black circle.
        this.fillCircle(centre, r1, 1);
    }

    private drawAlignmentPattern(centre: Point): void {
        const r1 = Writer.FINDER_INNER_RADIUS * this.scale;
        const r2 = Writer.FINDER_MIDDLE_RADIUS * this.scale;

        // Outer black ring.
        this.fillCircle(centre, r2, 1);

        // Inner white circle.
        this.fillCircle(centre, r1, 0);
    }

    /**
     * Draws a circle with the given parameters, using the mid-point algorithm variant with
     * integer-based arithmetic.
     *
     * @see [Wikipedia's page]{@link https://en.wikipedia.org/wiki/Midpoint_circle_algorithm}
     * for more info.
     */
    private fillCircle(c: Point, r: number, color: number): void {
        r = Math.round(r);
        c = { x: Math.round(c.x), y: Math.round(c.y) };
        let x = r;
        let y = 0;
        let dx = 1;
        let dy = 1;
        let err = dx - r * 2;
        while (x >= y) {
            this.fillSymmetricOctant(c, x, y, color);
            if (err <= 0) {
                y++;
                err += dy;
                dy += 2;
            } else {
                x--;
                dx += 2;
                err += dx - r * 2;
            }
        }
    }

    /**
     * Takes pixel coordinates on a circle's circumference in one octant and fills symmetrically in
     * all 8 octants, relative to the given centre.
     */
    private fillSymmetricOctant(c: Point, x: number, y: number, color: number): void {
        this.fillHorizontalLine(c.x - x, c.x + x, c.y + y, color);
        this.fillHorizontalLine(c.x - x, c.x + x, c.y - y, color);
        this.fillHorizontalLine(c.x - y, c.x + y, c.y + x, color);
        this.fillHorizontalLine(c.x - y, c.x + y, c.y - x, color);
    }

    /**
     * Fills the horizontal line from (x1, y) to (x2, y) with the desired color.
     */
    private fillHorizontalLine(x1: number, x2: number, y: number, color: number) {
        for (let i = x1; i <= x2; i++) {
            this.matrix.set(i, y, color);
        }
    }

    private drawSymbol(row: number, col: number, mask: number): void {
        const gridOffset = Writer.QUIET_ZONE + Writer.FINDER_OUTER_RADIUS * 2;
        const startX = (col * (Writer.SYMBOL_DIM + Writer.GAP_DIM) + gridOffset) * this.scale
            + this.padX;
        const startY = (row * (Writer.SYMBOL_DIM + Writer.GAP_DIM) + gridOffset) * this.scale
            + this.padY;
        const bitWidth = Writer.SYMBOL_DIM * this.scale;
        const bitHeight = Writer.UNIT_DIM * this.scale;
        const zeroOffset = Writer.BIT_ZERO_OFFSET * this.scale;
        const zeroWidth = Writer.BIT_ZERO_WIDTH * this.scale;

        for (let bit = 0, x = startX, y = startY; bit < Writer.BITS_PER_SYMBOL;
                bit++, y += bitHeight * 2) {
            // Draw a filled rectangle representing the bit.
            this.fillRect(x, y, bitWidth, bitHeight, 1);

            // If bit is zero, clear middle area.
            if ((mask & (1 << bit)) === 0) {
                this.fillRect(x + zeroOffset, y, zeroWidth, bitHeight, 0);
            }
        }
    }

    // Draws a filled rectangle with given parameters.
    private fillRect(x: number, y: number, width: number, height: number, color: number): void {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                this.matrix.set(x + j, y + i, color);
            }
        }
    }
}
