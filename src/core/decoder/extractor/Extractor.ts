import { BitMatrix } from "../../BitMatrix";
import { EncodedIChing } from "../../EncodedIChing";
import { Point } from "../../geometry";
import { Writer } from "../../writer";
import { PatternLocator } from "../locator/PatternLocator";

/**
 * This class extracts raw data from a perspective corrected binary image,
 * represented as a BitMatrix.
 *
 * @export
 * @class Extractor
 */
export class Extractor {
    /**
     * Maximum relative error tolerated in the ratios of the finder patterns.
     */
    public static FINDER_ERROR_THRESHOLD = 0.1;
    /**
     * Percentage of black pixels that should be present in the left or right border of the box
     * around the symbol area for it to be considered inside the symbol.
     */
    public static VERTICAL_BORDER_BLACK_THRESHOLD = 0.25;
    /**
     * Percentage of black pixels that should be present in a horizontal line for it to be
     * considered part of a valid bit in a symbol.
     */
    public static LINE_VALID_BLACK_THRESHOLD = 0.5;
    /**
     * Percentage of black pixels that should be present in a horizontal line for it to be
     * considered part of a one-bit.
     */
    public static LINE_ONE_BLACK_THRESHOLD = 0.9;
    /**
     * Percentage of the size of the gap between symbols that should be exceeded for a gap
     * to be considered valid.
     */
    public static GAP_DIM_THRESHOLD = 0.67;
    /**
     * Percentage the size of a unit that should be exceeded for a unit to be considered valid.
     * A unit is equivalent to the height of a single bit in a symbol.
     */
    public static UNIT_DIM_THRESHOLD = 0.7;

    /**
     * Hotrizontal line that is not part of any bits.
     */
    public static LINE_STATE_INVALID = -1;
    /**
     * Horizontal line that is part of a zero-bit.
     */
    public static LINE_STATE_ZERO = 0;
    /**
     * Horizontal line that is part of a one-bit.
     */
    public static LINE_STATE_ONE = 1;

    /**
     * Main class method. Extracts encoded data from the given perspective corrected binary image.
     *
     * @param {BitMatrix} matrix - binary image represented as bits.
     * @returns {EncodedIChing}
     */
    public extract(matrix: BitMatrix): EncodedIChing {
        const imgWidth = matrix.width;
        const imgHeight = matrix.height;

        // TODO: implement a better estimation method, as the current one fails if the centre
        // of the finder patterns is not perfectly aligned with the corners of the image.
        const scale = this.estimateScale(matrix);
        const scaledUnitDim = Writer.UNIT_DIM * scale;
        const scaledSymbolDim = Writer.SYMBOL_DIM * scale;
        const scaledGapDim = Writer.GAP_DIM * scale;
        const scaledFinderRadius = Writer.FINDER_OUTER_RADIUS * scale;

        // Calculate width and height of code, in symbols. Should match specs.
        const cols = Math.round((imgWidth + scaledGapDim - scaledSymbolDim) /
            (scaledGapDim + scaledSymbolDim));
        const rows = Math.round((imgHeight + scaledGapDim - scaledSymbolDim) /
            (scaledGapDim + scaledSymbolDim));

        if (cols !== rows) {
            throw new Error("IChing code must be a square!");
        }

        const data = new Uint8ClampedArray(rows * cols);

        // Column-by-column vertical scan.
        for (let col = 0; col < cols; col++) {
            // Estimated coordinates for the first symbol in the column.
            let estimateX1 = Math.round(scaledFinderRadius +
                col * (scaledSymbolDim + scaledGapDim));
            let estimateX2 = Math.round(estimateX1 + scaledSymbolDim);
            let estimateY1 = Math.round(scaledFinderRadius);
            let estimateY2 = Math.round(estimateY1 + scaledSymbolDim);

            // Y-coordinate of scanned line. Starts before estimate, for safety.
            let scanY = Math.max(0, Math.round(estimateY1 - scaledUnitDim));

            for (let row = 0; row < rows; row++) {
                // Fix potential horizontal shift resulting from distortion.
                const horizontalShift = this.fixHorizontalShift(matrix,
                    estimateX1, estimateY1, estimateX2, estimateY2);
                const x1 = horizontalShift[0];
                const x2 = horizontalShift[1];

                // Scanned line states bookkeeping.
                let endOfSymbol: boolean = false;
                let oldState = Extractor.LINE_STATE_INVALID;
                let oldStateCount = 1;
                let oldStateStartY = scanY;

                // Symbol data bookkeeping.
                let bitsFound = 0;
                let mask = (1 << Writer.BITS_PER_SYMBOL) - 1;

                // Symbol coordinates bookkeeping.
                const symbolX1 = x1;
                const symbolX2 = x2;
                let symbolY1 = estimateY1;
                let symbolY2 = estimateY2;

                while (scanY < matrix.height && !endOfSymbol) {
                    const newState = this.getHorizontalState(matrix, x1, x2, scanY);
                    if (newState === oldState) { // Same state.
                        oldStateCount++;
                    } else { // Different state.
                        // Check if old state is a valid bit.
                        if (oldState !== Extractor.LINE_STATE_INVALID &&
                        oldStateCount / scaledUnitDim > Extractor.UNIT_DIM_THRESHOLD) {
                            mask &= ~((1 - oldState) << bitsFound);
                            bitsFound++;

                            // If first bit of the symbol, store the y-coordinate
                            // of the top of the symbol.
                            if (bitsFound === 1) {
                                symbolY1 = oldStateStartY;
                            }
                        }

                        oldState = newState;
                        oldStateCount = 1;
                        oldStateStartY = scanY;
                    }

                    // Check if a gap is detected
                    if (oldState === Extractor.LINE_STATE_INVALID &&
                    oldStateCount / scaledGapDim > Extractor.GAP_DIM_THRESHOLD) {
                        // If inside symbol, assume missing bit.
                        if (oldStateStartY <= Math.round(estimateY2 - scaledUnitDim)) {
                            bitsFound++;
                            // If first bit of the symbol, store the y-coordinate
                            // of the top of the symbol.
                            if (bitsFound === 1) {
                                symbolY1 = Math.round(oldStateStartY + scaledUnitDim);
                            }

                            oldStateStartY = scanY + 1;
                            oldStateCount = 1;
                        // Else, symbol ended.
                        } else {
                            endOfSymbol = true;
                        }
                    }

                    scanY++;
                }

                data[row * cols + col] = mask;

                // Y-coordinate of the bottom of the symbol.
                symbolY2 = oldStateStartY;

                console.log(row, col, symbolX1, symbolY1, symbolX2, symbolY2);

                // Calculate estimated coordinates for the next symbol based on the current one.
                estimateX1 = symbolX1;
                estimateX2 = symbolX2;
                estimateY1 = Math.round(symbolY2 + scaledGapDim);
                estimateY2 = Math.round(estimateY1 + symbolY2 - symbolY1);
            }
        }

        return { version: data[0], rows, cols, data };
    }

    /**
     * Estimates a scale of the input image relative to the default IChing image resolution, based
     * on the average radius of the finder patterns.
     *
     * @param {BitMatrix} matrix - binary image represented as bits.
     * @returns {number} estimated scale.
     */
    private estimateScale(matrix: BitMatrix): number {
        let sum = 0;
        let count = 0;
        let state;

        // Top-left finder, horizontal.
        state = this.scanFinderRadius(matrix, { x: 0, y: 0 }, 1, 0);
        if (this.isValidFinderRadius(state)) {
            sum += state[0] + state[1] + state[2];
            count++;
        }

        // Top-left finder, vertical.
        state = this.scanFinderRadius(matrix, { x: 0, y: 0 }, 0, 1);
        if (this.isValidFinderRadius(state)) {
            sum += state[0] + state[1] + state[2];
            count++;
        }

        // Top-left finder, diagonal.
        state = this.scanFinderRadius(matrix, { x: 0, y: 0 }, 1, 1);
        if (this.isValidFinderRadius(state)) {
            sum += (state[0] + state[1] + state[2]) * PatternLocator.SQRT2;
            count++;
        }

        // Bottom-left finder, horizontal.
        state = this.scanFinderRadius(matrix, { x: 0, y: matrix.height - 1 }, 1, 0);
        if (this.isValidFinderRadius(state)) {
            sum += state[0] + state[1] + state[2];
            count++;
        }

        // Bottom-left finder, vertical.
        state = this.scanFinderRadius(matrix, { x: 0, y: matrix.height - 1 }, 0, -1);
        if (this.isValidFinderRadius(state)) {
            sum += state[0] + state[1] + state[2];
            count++;
        }

        // Bottom-left finder, diagonal.
        state = this.scanFinderRadius(matrix, { x: 0, y: matrix.height - 1 }, 1, -1);
        if (this.isValidFinderRadius(state)) {
            sum += (state[0] + state[1] + state[2]) * PatternLocator.SQRT2;
            count++;
        }

        // Top-right finder, horizontal.
        state = this.scanFinderRadius(matrix, { x: matrix.width - 1, y: 0 }, -1, 0);
        if (this.isValidFinderRadius(state)) {
            sum += state[0] + state[1] + state[2];
            count++;
        }

        // Top-right finder, vertical.
        state = this.scanFinderRadius(matrix, { x: matrix.width - 1, y: 0 }, 0, 1);
        if (this.isValidFinderRadius(state)) {
            sum += state[0] + state[1] + state[2];
            count++;
        }

        // Top-right finder, diagonal.
        state = this.scanFinderRadius(matrix, { x: matrix.width - 1, y: 0 }, -1, 1);
        if (this.isValidFinderRadius(state)) {
            sum += (state[0] + state[1] + state[2]) * PatternLocator.SQRT2;
            count++;
        }

        if (count === 0) {
            throw new Error("No valid finder patterns found!");
        }

        const averageRadius = sum / count;
        const estimatedScale = averageRadius / Writer.FINDER_OUTER_RADIUS;

        return estimatedScale;
    }

    /**
     * Returns the radius of the finder pattern, given its centre and a scanning direction,
     * horizontal or vertical.
     *
     * @param {BitMatrix} matrix - binary image represented as bits.
     * @param {Point} centre
     * @param {number} dx
     * @param {number} dy
     * @returns {number[]} [black, white, black] count of pixels.
     */
    private scanFinderRadius(matrix: BitMatrix, centre: Point, dx: number, dy: number): number[] {
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) {
            throw new Error("Invalid scanning direction");
        }

        let state = 0;
        const count = [0, 0, 0];
        let x = centre.x;
        let y = centre.y;

        // From the centre of the pattern, we should pass by 3 states:
        // { 0: black, 1: white, 2: black }.
        while (
            x >= 0 && x < matrix.width &&
            y >= 0 && y < matrix.height
        ) {
            // If white in even state, or black in odd state, increment state.
            if ((state & 1) === matrix.get(x, y)) {
                state++;
            }
            if (state === 3) {
                break;
            }

            count[state]++;
            x += dx;
            y += dy;
        }

        return count;
    }

    /**
     * Checks if the provided pixel count represent the proper ratios expected in a finder pattern.
     * Finder patterns have a black:white:black:white:black ratio of 1:1:3:1:1, so the radius should
     * have a black:white:black ratio of 1.5:1:1.
     *
     * @private
     * @param {number[]} count
     * @returns {boolean}
     */
    private isValidFinderRadius(count: number[]): boolean {
        if (count.length !== 3 || count[0] === 0 || count[1] === 0 || count[2] === 0) {
            return false;
        }

        const baseDimensions = [
            Writer.FINDER_INNER_RADIUS,
            Writer.FINDER_MIDDLE_RADIUS - Writer.FINDER_INNER_RADIUS,
            Writer.FINDER_OUTER_RADIUS - Writer.FINDER_MIDDLE_RADIUS,
        ];

        const scales = [0, 0, 0];
        for (let i = 0; i < count.length; i++) {
            scales[i] = count[i] / baseDimensions[i];
        }
        scales.sort((a: number, b: number) => a - b);

        return ((scales[2] - scales[0]) / scales[0] < Extractor.FINDER_ERROR_THRESHOLD);
    }

    /**
     * Takes coordinates representing a sub-rectangle of the image containing an IChing symbol,
     * and fixes the horizontal shift, if any, in the left and right borders of the sub-rectangle.
     *
     * @param {BitMatrix} matrix - binary image represented as bits.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number[]} [fixed x1, fixed x2]
     */
    private fixHorizontalShift(
        matrix: BitMatrix, x1: number, y1: number, x2: number, y2: number,
    ): number[] {
        const threshold = Extractor.VERTICAL_BORDER_BLACK_THRESHOLD;
        const boxHeight = y2 - y1 + 1;
        const width = matrix.width;
        const originalX1 = x1;
        const originalX2 = x2;

        // Fix left border.
        while (
            x1 > 0 &&
            this.countBlackInLine(matrix, x1, y1, x1, y2) / boxHeight > threshold
        ) {
            x1--;
        }
        while (
            x1 + 1 < width &&
            this.countBlackInLine(matrix, x1, y1, x1, y2) / boxHeight < threshold
        ) {
            x1++;
        }

        // Fix right border.
        while (
            x2 + 1 < width &&
            this.countBlackInLine(matrix, x2, y1, x2, y2) / boxHeight > threshold
        ) {
            x2++;
        }
        while (
            x2 > 0 &&
            this.countBlackInLine(matrix, x2, y1, x2, y2) / boxHeight < threshold
        ) {
            x2--;
        }

        // If symbol is missing too many bits or is empty, return the original estimate becuase
        // the fix is not valid.
        if (x2 <= x1) {
            return [originalX1, originalX2];
        }

        return [x1, x2];
    }

    /**
     * Counts the number of black and white pixels in a vertical or horizontal line.
     *
     * @param {BitMatrix} matrix - binary image represented as bits.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number} count of black pixels in given line.
     */
    private countBlackInLine(
        matrix: BitMatrix, x1: number, y1: number, x2: number, y2: number,
    ): number {
        if (x1 !== x2 && y1 !== y2) {
            throw new Error("Line must be horizontal or vertical!");
        }

        let count: number = 0;
        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                count += matrix.get(x, y);
            }
        }

        return count;
    }

    /**
     * Checks if the given horizontal line belongs to one of the bits of an IChing symbol,
     * and if so, whether it is a zero or a one.
     *
     * @param {BitMatrix} matrix - binary image represented as bits.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number} one of the three LINE_STATE constants.
     */
    private getHorizontalState(matrix: BitMatrix, x1: number, x2: number, y: number): number {
        const lineWidth = x2 - x1 + 1;
        const black = this.countBlackInLine(matrix, x1, y, x2, y);

        // Check if the line belongs to one of the black lines of an IChing symbol.
        if (black / lineWidth < Extractor.LINE_VALID_BLACK_THRESHOLD) {
            return Extractor.LINE_STATE_INVALID;
        }

        // Check if line represents a zero-bit.
        if (black / lineWidth < Extractor.LINE_ONE_BLACK_THRESHOLD) {
            return Extractor.LINE_STATE_ZERO;
        }

        // Line represents a one-bit.
        return Extractor.LINE_STATE_ONE;
    }
}
