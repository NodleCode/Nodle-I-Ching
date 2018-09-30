import { BitMatrix } from "../../BitMatrix";
import { Point } from "../../geometry";
import { sumArray } from "../../utils";
import { LocationError } from "./LocationError";

/**
 * Represents pattern ratio error and size average for each probable pattern location.
 * @interface PatternMeasures
 */
interface PatternMeasures {
    /**
     * The corrected center of the pattern.
     */
    location: Point;
    /**
     * The pattern state array when intersected from certain angle.
     */
    state: Uint16Array;
}

/**
 * @export
 * @class PatternLocator
 * @description Locates all possible locations of patterns having a certain ratio
 * and calculates the error for each location.
 */
export class PatternLocator {
    /**
     * Main class method - locates possible locations of patterns with certain ratio.
     *
     * @param {BitMatrix} matrix - Matrix representing binarized image.
     * @returns {LocationError[]} - Array of all possible locations of the patterns.
     * @memberof PatternLocator
     */

    /**
     * Precalculated square root of 2
     */
    public static SQRT2 = 1.41421356237;

    private matrix: BitMatrix;
    private ratios: Uint8Array;
    private startX: number;
    private startY: number;
    private endX: number;
    private endY: number;

    public locate(
        matrix: BitMatrix,
        ratios: Uint8Array,
        startPoint: Point = { x: 0, y: 0 },
        endPoint: Point = { x: matrix.width, y: matrix.height },
    ): LocationError[] {
        this.matrix = matrix;
        this.ratios = ratios;
        this.startX = startPoint.x;
        this.startY = startPoint.y;
        this.endX = endPoint.x;
        this.endY = endPoint.y;

        const locations = [];
        // Initialize state array to keep track of number of pixels in
        // each state of the patterns
        const state = new Uint16Array(ratios.length);
        let stateIdx = 0;

        // Scan each other line. This is safe to do and will not skip patterns, while improving
        // performance significantly.
        for (let y = this.startY; y < this.endY; y += 2) {
            for (let x = this.startX; x < this.endX; ++x) {
                if ((stateIdx & 1) === matrix.get(x, y)) {
                    // if encountered white cell at even state, or black cell at odd state, then
                    // state has changed, and we advance to the next state.
                    ++stateIdx;
                    if (stateIdx === ratios.length) {
                        // If we reached the final state change, then check if it's a valid pattern
                        if (this.isValidPattern(state)) {
                            const initialCenter: Point = this.centerFromEnd({ x: x - 1, y }, state);
                            const maxCount = state[ratios.length >> 1] << 2;

                            // Check pattern in vertical direction.
                            const vertical = this.calculatePatternMeasures(
                                initialCenter, 0, 1, maxCount);
                            const validPattern = this.isValidPattern(vertical.state);

                            // If valid pattern, calculates its error and push it to results
                            if (validPattern === true) {
                                locations.push(this.calculateLocationError(
                                    initialCenter, maxCount,
                                ));
                            }
                        }
                        // we still can make use of the last states as new ones in another
                        // pattern except for the first two states.
                        for (let i = 2; i < state.length; ++i) {
                            state[i - 2] = state[i];
                        }
                        // make the two remaining states zeros
                        state[ratios.length - 1] = state[ratios.length - 2] = 0;
                        stateIdx = ratios.length - 2;
                    }
                }
                // In all cases increament number of pixels in the current state.
                ++state[stateIdx];
            }

            // Handle the case that the image right side cuts a pattern.
            // This case could happen if a user is trying to fit the code to the screen exactly.
            if (stateIdx === ratios.length - 1 && this.isValidPattern(state)) {
                const initialCenter: Point = this.centerFromEnd({ x: this.endX - 1, y }, state);
                locations.push(this.calculateLocationError(
                    initialCenter, state[ratios.length >> 1] * 2,
                ));
            } else {
                // empty all pattern states since no pattern should continue to the begining of
                // a new line.
                stateIdx = 0;
                for (let i = 0; i < ratios.length; ++i) {
                    state[i] = 0;
                }
            }
        }

        return locations;
    }

    /**
     * Calculate pattern center pixel gives it's end pixel and the pattern state array.
     *
     * @private
     * @param {Point} patternEnd - Pattern end pixel.
     * @param {Uint16Array} state - Pattern state array.
     * @returns {Point} - Pattern center pixel.
     * @memberof PatternLocator
     */
    private centerFromEnd(patternEnd: Point, state: Uint16Array): Point {
        let stateIdx = state.length >> 1;
        let displacement = state[stateIdx] >> 1;
        while (++stateIdx < state.length) {
            displacement += state[stateIdx];
        }
        return {
            x: patternEnd.x - displacement,
            y: patternEnd.y,
        };
    }

    /**
     * Checks if the ratios of calculated states indeed form a valid pattern.
     *
     * @private
     * @param {Uint16Array} state - Array represents calculated states for
     * the probable pattern.
     * @returns {boolean} - either it's a valid pattern or not.
     * @memberof PatternLocator
     */
    private isValidPattern(state: Uint16Array): boolean {
        let sum = 0;
        for (const count of state) {
            if (count === 0) {
                // if any of the states contains no pixel then it's not a valid state.
                return false;
            }
            sum += count;
        }
        const ratiosSum = sumArray(this.ratios);
        // If the pattern doesn't contain number of pixels at least equal to the
        // sum of the base ratios, then it's not a valid pattern for sure.
        if (sum < ratiosSum) {
            return false;
        }

        const unit = sum / ratiosSum;
        // the maximum error that we can tolerate for each unit.
        const maxVariance = unit / 2;
        // then we check that each state contains the needed pixels.
        let validPattern = true;
        for (let i = 0; i < this.ratios.length; ++i) {
            if (Math.abs(state[i] - unit * this.ratios[i]) > this.ratios[i] * maxVariance) {
                validPattern = false;
            }
        }
        return validPattern;
    }

    /**
     * Checks if the pattern will match the required ratios if intersected from multiple angles
     * and calculate the error according to that.
     * The ratio error is calculated using normalized RMS (root mean square) method to get
     * their standard error when measured from different prespective.
     * @see https://en.wikipedia.org/wiki/Root-mean-square_deviation
     * @private
     * @param {Point} patternCenter - The center of the pattern to calculate error for.
     * @param {number} maxCount - The maximum possible number of pixels a pattern state could have.
     * @returns {LocationError} - The corrected pattern center and the combined error of
     * that location.
     * @memberof PatternLocator
     */
    private calculateLocationError(patternCenter: Point, maxCount: number): LocationError {
        // Calculate pattern state array.
        const vertical = this.calculatePatternMeasures(patternCenter, 0, 1, maxCount);
        const horizontal = this.calculatePatternMeasures(patternCenter, 1, 0, maxCount);
        const mainDiagonal = this.calculatePatternMeasures(patternCenter, 1, 1, maxCount);
        const skewDiagonal = this.calculatePatternMeasures(patternCenter, -1, 1, maxCount);

        // Calculate pattern average size and average unit size in order to
        // be used as the mean in the RMS equation.
        const averageSize = (
            sumArray(vertical.state) +
            sumArray(horizontal.state) +
            sumArray(mainDiagonal.state) * PatternLocator.SQRT2 +
            sumArray(skewDiagonal.state) * PatternLocator.SQRT2
        ) / 4;
        const ratiosSum = sumArray(this.ratios);
        const averageUnit = averageSize / ratiosSum;

        // standard ratio error is equal to RMS of each cross ratioError, but we won't take the
        // root since we are going to need the squared value later.
        // Each cross ratioError is squared already so we won't square any of them again.
        const standardRatioError = (
            this.calculateStateError(vertical.state, averageUnit) +
            this.calculateStateError(horizontal.state, averageUnit) +
            this.calculateStateError(mainDiagonal.state, averageUnit / PatternLocator.SQRT2) +
            this.calculateStateError(skewDiagonal.state, averageUnit / PatternLocator.SQRT2)
        ) / (4 * this.ratios.length);

        // Also use the corrected center as the new pattern center.
        // No center corrections happens from the diagonals since the vertical and horizontal
        // correction is enough to adjust the center.
        const correctedCenter = {
            x: horizontal.location.x,
            y: vertical.location.y,
        };

        return {
            location: correctedCenter,
            error: standardRatioError,
            size: averageSize,
        };
    }

    /**
     * Calculates the sum of each state error in the state array to be used in error calculations
     * using the RMS equation (x - mean)^2 / N
     *
     * @private
     * @param {Uint16Array} state - State array representing how many pixels represent
     * each pattern state.
     * @param {number} averageUnit - Average pattern state unit size.
     * @returns {number} - Normalized sum(Xi - mean)^2.
     * @memberof PatternLocator
     */
    private calculateStateError(state: Uint16Array, averageUnit: number): number {
        // TODO: Test another normalization methods
        // @see https://en.wikipedia.org/wiki/Normalization_(statistics)
        let error = 0;
        for (let i = 0; i < this.ratios.length; ++i) {
            const unitError = (state[i] / averageUnit / this.ratios[i]  - 1);
            error += unitError * unitError;
        }
        return error;
    }

    /**
     * Calculates the pattern state array when intersected using a line with dx,dy direction
     * and correct the pattern center if needed.
     *
     * @private
     * @param {Point} patternCenter - Initial Pattern center coordinates.
     * @param {number} dx - X-axis displacement direction.
     * @param {number} dy - Y-axis displacement direction.
     * @param {number} maxCount - The maximum possible number of pixels a pattern state could have.
     * @returns {PatternMeasures} - Pattern state resutling from the line cross check and
     * corrected pattern center.
     * @memberof PatternLocator
     */
    private calculatePatternMeasures(
        patternCenter: Point,
        dx: number,
        dy: number,
        maxCount: number,
    ): PatternMeasures {
        if (dx === 0 && dy === 0) {
            throw new Error("x-axis and y-axis displacement should be either 1 or -1, \
            and they shouldn't be both zeros!");
        }

        const state = new Uint16Array(this.ratios.length);
        let x = patternCenter.x;
        let y = patternCenter.y;
        let xEnd = dx === -1 ? -1 : this.matrix.width;
        let yEnd = dy === -1 ? -1 : this.matrix.height;
        const midStateIdx = this.ratios.length >> 1;
        let stateIdx = midStateIdx;
        // Count pixels from the center and going forward.
        while (x !== xEnd && y !== yEnd) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                // if encountered white cell at even state, or black cell at odd state, then
                // state has changed, and we advance to the next state.
                ++stateIdx;
                if (stateIdx === this.ratios.length) {
                    // If we reached the final state then break.
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
            x += dx;
            y += dy;
        }
        const sumForward = state[midStateIdx];

        // exact same logic as above but counting backward to cover the full pattern.
        x = patternCenter.x - dx;
        y = patternCenter.y - dy;
        xEnd = dx === 1 ? -1 : this.matrix.width;
        yEnd = dy === 1 ? -1 : this.matrix.height;
        stateIdx = midStateIdx;
        while (x !== xEnd && y !== yEnd) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                --stateIdx;
                if (stateIdx === -1) {
                    break;
                }
            }
            if (++state[stateIdx] > maxCount) {
                break;
            }
            x -= dx;
            y -= dy;
        }
        const sumBackward = state[midStateIdx] - sumForward;

        // adjust the pattern center according to number of pixels on both sides of the old center.
        const correctedCenter = {
            x: patternCenter.x + Math.floor((sumForward - sumBackward) / 2) * dx,
            y: patternCenter.y + Math.floor((sumForward - sumBackward) / 2) * dy,
        };
        return { location: correctedCenter, state };
    }
}
