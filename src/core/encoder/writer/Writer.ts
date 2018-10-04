import { BitMatrix } from "../../BitMatrix";
import { Point } from "../../geometry";
import { EncodedIChing } from "../EncodedIChing";

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
    private resolution: number;
    private roundEdges: boolean;
    private pad: number;

    /**
     * Creates an instance of Writer.
     *
     * @param {number} - desired height and width of the rendered image.
     */
    public constructor(resolution: number, roundEdges: boolean) {
        this.resolution = resolution;
        this.roundEdges = roundEdges;
    }

    /**
     * Renders the provided encoded IChing.
     * It takes an EncodedIChing object with the version, size, and data fields set,
     * and sets the imageData field.
     *
     * @param {EncodedIChing} code - Object representing an encoded IChing.
     * @returns {void}
     */
    public render(code: EncodedIChing): void {
        const codeSize = code.size;
        // Minimum image dimension.
        const baseDimension = codeSize * Writer.SYMBOL_DIM + (codeSize - 1) * Writer.GAP_DIM
            + (Writer.FINDER_OUTER_RADIUS * 2 + Writer.QUIET_ZONE) * 2;

        // Calculate scaling factor based on base dimensions and desired output image dimension.
        this.scale = Math.floor(this.resolution / baseDimension);
        if (this.scale < 1) {
            throw new Error("Resolution is too small!");
        }

        // Creates a BitMatrix filled with 0s.
        this.matrix = new BitMatrix(this.resolution, this.resolution);

        // Calculate padding.
        this.pad = Math.floor((this.resolution - baseDimension * this.scale) / 2);

        // Draw finder patterns.
        const finderOffset = (Writer.QUIET_ZONE + Writer.FINDER_OUTER_RADIUS) * this.scale
            + this.pad;
        this.drawFinderPattern({ x: finderOffset, y: finderOffset });
        this.drawFinderPattern({ x: this.resolution - finderOffset, y: finderOffset });
        this.drawFinderPattern({ x: finderOffset, y: this.resolution - finderOffset });

        // Draw alignment pattern.
        this.drawAlignmentPattern(
            { x: this.resolution - finderOffset, y: this.resolution - finderOffset },
        );

        // Draw symbols.
        for (let i = 0; i < codeSize; i++) {
            for (let j = 0; j < codeSize; j++) {
                this.drawSymbol(i, j, code.data[i * codeSize + j]);
            }
        }

        code.imageData = this.matrix.toImage();
    }

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
     * Draws a filled circle with the given parameters, using Bresenham's circle drawing algorithm.
     *
     * @see [this page]{@link https://web.engr.oregonstate.edu/~sllu/bcircle.pdf}
     * for more info.
     */
    private fillCircle(c: Point, r: number, color: number): void {
        r = Math.round(r);
        c = { x: Math.round(c.x), y: Math.round(c.y) };

        let x = r;
        let y = 0;
        let dx = 1 - r * 2;
        let dy = 1;
        let err = 0;
        while (x >= y) {
            this.fillSymmetricOctant(c, x, y, color);
            y++;
            err += dy;
            dy += 2;
            if (2 * err + dx > 0) {
                x--;
                err += dx;
                dx += 2;
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
            + this.pad;
        const startY = (row * (Writer.SYMBOL_DIM + Writer.GAP_DIM) + gridOffset) * this.scale
            + this.pad;
        const bitWidth = Writer.SYMBOL_DIM * this.scale;
        const bitHeight = Writer.UNIT_DIM * this.scale;
        const zeroOffset = Writer.BIT_ZERO_OFFSET * this.scale;
        const zeroWidth = Writer.BIT_ZERO_WIDTH * this.scale;
        const edgeRadius = bitHeight / 2 - 1;

        for (let bit = 0, x = startX, y = startY; bit < Writer.BITS_PER_SYMBOL;
                bit++, y += bitHeight * 2) {
            // Draw a filled rectangle representing the bit.
            this.fillRect(x + edgeRadius, y, bitWidth - 2 * edgeRadius, bitHeight, 1);

            if (this.roundEdges) {
                // Rounded left edge.
                this.fillCircle({ x: x + edgeRadius, y: y + edgeRadius }, edgeRadius, 1);
                this.fillCircle({ x: x + edgeRadius, y: y + edgeRadius + 1 }, edgeRadius, 1);
                // Rounded right edge.
                this.fillCircle({ x: x + bitWidth - edgeRadius, y: y + edgeRadius }, edgeRadius, 1);
                this.fillCircle(
                    { x: x + bitWidth - edgeRadius, y: y + edgeRadius + 1 }, edgeRadius, 1,
                );
            } else {
                // Straight edges.
                this.fillRect(x, y, edgeRadius, bitHeight, 1);
                this.fillRect(x + bitWidth - edgeRadius, y, edgeRadius, bitHeight, 1);
            }

            // If bit is zero, clear middle area.
            if ((mask & (1 << bit)) === 0) {
                this.fillRect(x + zeroOffset - edgeRadius, y,
                    zeroWidth + 2 * edgeRadius, bitHeight, 0);

                if (this.roundEdges) {
                    // Rounded right edge of the left half.
                    this.fillCircle(
                        { x: x + zeroOffset - edgeRadius, y: y + edgeRadius },
                        edgeRadius, 1,
                    );
                    this.fillCircle(
                        { x: x + zeroOffset - edgeRadius, y: y + edgeRadius + 1 },
                        edgeRadius, 1,
                    );
                    // Rounded left egde of the right half.
                    this.fillCircle(
                        { x: x + zeroOffset + zeroWidth + edgeRadius, y: y + edgeRadius },
                        edgeRadius, 1,
                    );
                    this.fillCircle(
                        { x: x + zeroOffset + zeroWidth + edgeRadius, y: y + edgeRadius + 1 },
                        edgeRadius, 1,
                    );
                } else {
                    // Straight edges.
                    this.fillRect(x + zeroOffset - edgeRadius, y, edgeRadius, bitHeight, 1);
                    this.fillRect(x + zeroOffset + zeroWidth, y, edgeRadius, bitHeight, 1);
                }
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
