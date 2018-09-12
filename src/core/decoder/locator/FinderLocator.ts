import { BitMatrix } from "../../BitMatrix";
import { nearlySame, Point } from "../../geometry";
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
    state: Int32Array;
}

/**
 * @export
 * @class FinderLocator
 * @description Locates all possible locations of Finder patterns and calculates the error
 * for each location.
 */
export class FinderLocator {
    /**
     * Main class method - locates possible locations of finder patterns
     *
     * @param {BitMatrix} matrix - Matrix representing binarized image.
     * @returns {LocationError[]} - Array of all possible locations of the patterns.
     * @memberof FinderLocator
     */

    /**
     * Precalculated square root of 2
     */
    public static SQRT2 = 1.41421356237;

    private matrix: BitMatrix;

    public locate(matrix: BitMatrix): LocationError[] {
        this.matrix = matrix;
        const locations = [];
        // Initialize state array with 5 positions to keep track of number of pixels in
        // each state of the patterns
        const state = new Int32Array(5);
        let stateIdx = 0;

        for (let y = 0; y < matrix.height; ++y) {
            for (let x = 0; x < matrix.width; ++x) {
                if ((stateIdx & 1) === matrix.get(x, y)) {
                    // if encountered white cell at even state, or black cell at odd state, then
                    // state has changed, and we advance to the next state.
                    ++stateIdx;
                    if (stateIdx === 5) {
                        // If we reached the final state change, then check if it's a valid pattern
                        if (this.isValidPattern(state)) {
                            // If valid pattern, calculates its error and push it to results
                            const initialCenter: Point = {
                                x: x - Math.floor(state[stateIdx - 3] / 2) -
                                    state[stateIdx - 2] - state[stateIdx - 1],
                                y,
                            };
                            // while we are running tests on the pattern to calculate its error, we
                            // will be also correcting the center.
                            locations.push(
                                this.calculateLocationError(initialCenter, state[2] * 2),
                            );
                        }
                        // we still can make use of the last three states as
                        // the first three in another pattern.
                        state[0] = state[2];
                        state[1] = state[3];
                        state[2] = state[4];
                        state[3] = state[4] = 0;
                        stateIdx = 3;
                    }
                }
                // In all cases increament number of pixels in the current state.
                ++state[stateIdx];
            }
        }

        // Handle the case that the image right side cuts a finder pattern.
        // This case could happen if a user is trying to fit the code to the screen exactly.
        if (stateIdx === 4 && this.isValidPattern(state)) {
            // If valid pattern, calculates its error and push it to results
            const initialCenter: Point = {
                x: matrix.width - Math.floor(state[stateIdx - 2] / 2) -
                    state[stateIdx - 1] - state[stateIdx],
                y: matrix.height - 1,
            };
            locations.push(this.calculateLocationError(initialCenter, state[2] * 2));
        }

        return locations;
    }

    /**
     * Checks if the ratios of calculated states indeed form a valid pattern.
     *
     * @private
     * @param {Int32Array} state - Array represents calculated states for
     * the probable pattern.
     * @returns {boolean} - either it's a valid pattern or not.
     * @memberof FinderLocator
     */
    private isValidPattern(state: Int32Array): boolean {
        // Since the finder pattern ratios is 1:1:3:1:1, it consist of 7 units,
        // a unit for each state except for the middle state consists of 3 units,
        // so we first calculates how much pixels each unit consists of.
        let sum = 0;
        for (const count of state) {
            if (count === 0) {
                // if any of the states contains no pixel then it's not a valid state.
                return false;
            }
            sum += count;
        }

        // valid state should consist from 7 pixels at least to fullfill 1:1:3:1:1 ratio.
        if (sum < 7) {
            return false;
        }
        const unit = sum / 7;
        // the maximum error that we can tolerate for each unit.
        const maxVariance = unit / 2;
        // then we check that each state contains the needed pixels.
        return (
            Math.abs(state[0] - unit) < maxVariance &&
            Math.abs(state[1] - unit) < maxVariance &&
            Math.abs(state[2] - 3 * unit) < 3 * maxVariance &&
            Math.abs(state[3] - unit) < maxVariance &&
            Math.abs(state[4] - unit) < maxVariance
        );
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
     * @memberof FinderLocator
     */
    private calculateLocationError(patternCenter: Point, maxCount: number): LocationError {
        // Calculate pattern state array.
        const vertical = this.verticalPatternMeasures(patternCenter, maxCount);
        const horizontal = this.horizontalPatternMeasures(patternCenter, maxCount);
        const mainDiagonal = this.mainDiagonalPatternMeasures(patternCenter, maxCount);
        const skewDiagonal = this.skewDiagonalPatternMeasures(patternCenter, maxCount);

        // Calculate pattern average size and average unit size in order to
        // be used as the mean in the RMS equation.
        const averageSize = (
            sumArray(vertical.state) +
            sumArray(horizontal.state) +
            sumArray(mainDiagonal.state) * FinderLocator.SQRT2 +
            sumArray(skewDiagonal.state) * FinderLocator.SQRT2
        ) / 4;
        const averageUnit = averageSize / 7;

        // standard ratio error is equal to RMS of each cross ratioError, but we won't take the
        // root since we are going to need the squared value later.
        // Each cross ratioError is squared already so we won't square any of them again.
        const standardRatioError = (
            this.calculateStateError(vertical.state, averageUnit) +
            this.calculateStateError(horizontal.state, averageUnit) +
            this.calculateStateError(mainDiagonal.state, averageUnit) +
            this.calculateStateError(skewDiagonal.state, averageUnit)
        ) / 20;

        // Also use the corrected center as the new pattern center.
        // No center corrections happens from the diagonals since the vertical and horizontal
        // correction is enough to adjust the center.
        // TODO: try to add a diagonal correction then take the average of corrections
        // the logic behind this is that diagonal correctional will account for both x & y together
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
     * @param {Int32Array} state - State array representing how many pixels represent
     * each pattern state.
     * @param {number} averageUnit - Average pattern state unit size.
     * @returns {number} - Normalized sum(Xi - mean)^2.
     * @memberof FinderLocator
     */
    private calculateStateError(state: Int32Array, averageUnit: number): number {
        // TODO: Test another normalization methods
        // @see https://en.wikipedia.org/wiki/Normalization_(statistics)
        return (
            (state[0] / averageUnit - 1) * (state[0] / averageUnit - 1) +
            (state[1] / averageUnit - 1) * (state[1] / averageUnit - 1) +
            (state[2] / averageUnit / 3 - 1) * (state[2] / averageUnit / 3 - 1) +
            (state[3] / averageUnit - 1) * (state[3] / averageUnit - 1) +
            (state[4] / averageUnit - 1) * (state[4] / averageUnit - 1)
        );
    }

    /**
     * Calculates the pattern state array when intersected using a vertical line
     * and correct the pattern center if needed.
     *
     * @private
     * @param {Point} patternCenter - Initial Pattern center coordinates.
     * @param {number} maxCount - The maximum possible number of pixels a pattern state could have.
     * @returns {PatternMeasures}
     * @memberof FinderLocator
     */
    private verticalPatternMeasures(patternCenter: Point, maxCount: number): PatternMeasures {
        const state = new Int32Array(5);
        const x = patternCenter.x;
        // Count pixels from the center and going down.
        for (let y = patternCenter.y, stateIdx = 2; y < this.matrix.height; ++y) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                // if encountered white cell at even state, or black cell at odd state, then
                // state has changed, and we advance to the next state.
                ++stateIdx;
                if (stateIdx === 5) {
                    // If we reached the final state then break.
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
        }
        const sumDown = state[2];

        // exact same logic as above but counting up to cover the full pattern.
        for (let y = patternCenter.y - 1, stateIdx = 2; y >= 0; --y) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                --stateIdx;
                if (stateIdx === -1) {
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
        }
        const sumUp = state[2] - sumDown;

        // if the sum down pixels are more than the sum up then increament the y to be in
        // the middle and vice versa.
        const correctedCenter = {
            x: patternCenter.x,
            y: patternCenter.y + Math.floor((sumDown - sumUp) / 2),
        };
        return { location: correctedCenter, state };
    }

    /**
     * Calculates the pattern state array when intersected using a horizontal line
     * and correct the pattern center if needed.
     *
     * @private
     * @param {Point} patternCenter - Initial Pattern center coordinates.
     * @param {number} maxCount - The maximum possible number of pixels a pattern state could have.
     * @returns {PatternMeasures}
     * @memberof FinderLocator
     */
    private horizontalPatternMeasures(patternCenter: Point, maxCount: number): PatternMeasures {
        const state = new Int32Array(5);
        const y = patternCenter.y;
        // Count pixels from the center and going right.
        for (let x = patternCenter.x, stateIdx = 2; x < this.matrix.width; ++x) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                // if encountered white cell at even state, or black cell at odd state, then
                // state has changed, and we advance to the next state.
                ++stateIdx;
                if (stateIdx === 5) {
                    // If we reached the final state then break.
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
        }
        const sumRight = state[2];

        // exact same logic as above but counting left to cover the full pattern.
        for (let x = patternCenter.x - 1, stateIdx = 2; x >= 0; --x) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                --stateIdx;
                if (stateIdx === -1) {
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
        }
        const sumLeft = state[2] - sumRight;

        // if the sum right pixels are more than the sum left then increament the x to be in
        // the middle and vice versa.
        const correctedCenter = {
            x: patternCenter.x + Math.floor((sumRight - sumLeft) / 2),
            y: patternCenter.y,
        };
        return { location: correctedCenter, state };
    }

    /**
     * Calculates the pattern state array when intersected using a main diagonal line.
     *
     * @private
     * @param {Point} patternCenter - Pattern center coordinates.
     * @param {number} maxCount - The maximum possible number of pixels a pattern state could have.
     * @returns {PatternMeasures}
     * @memberof FinderLocator
     */
    private mainDiagonalPatternMeasures(patternCenter: Point, maxCount: number): PatternMeasures {
        const state = new Int32Array(5);
        // Count pixels from the center and going down.
        let x = patternCenter.x;
        let y = patternCenter.y;
        let stateIdx = 2;
        while (x < this.matrix.width && y < this.matrix.height) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                // if encountered white cell at even state, or black cell at odd state, then
                // state has changed, and we advance to the next state.
                ++stateIdx;
                if (stateIdx === 5) {
                    // If we reached the final state then break.
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
            ++x, ++y;
        }

        // exact same logic as above but counting up to cover the full pattern.
        x = patternCenter.x - 1;
        y = patternCenter.y - 1;
        stateIdx = 2;
        while (x >= 0 && y >= 0) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                --stateIdx;
                if (stateIdx === -1) {
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
            --x, --y;
        }

        return { location: patternCenter, state };
    }

    /**
     * Calculates the pattern state array when intersected using a skew diagonal line.
     *
     * @private
     * @param {Point} patternCenter - Pattern center coordinates.
     * @param {number} maxCount - The maximum possible number of pixels a pattern state could have.
     * @returns {PatternMeasures}
     * @memberof FinderLocator
     */
    private skewDiagonalPatternMeasures(patternCenter: Point, maxCount: number): PatternMeasures {
        const state = new Int32Array(5);
        // Count pixels from the center and going down.
        let x = patternCenter.x;
        let y = patternCenter.y;
        let stateIdx = 2;
        while (x < this.matrix.width && y >= 0) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                // if encountered white cell at even state, or black cell at odd state, then
                // state has changed, and we advance to the next state.
                ++stateIdx;
                if (stateIdx === 5) {
                    // If we reached the final state then break.
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
            ++x, --y;
        }

        // exact same logic as above but counting up to cover the full pattern.
        x = patternCenter.x - 1;
        y = patternCenter.y + 1;
        stateIdx = 2;
        while (x >= 0 && y < this.matrix.height) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                --stateIdx;
                if (stateIdx === -1) {
                    break;
                }
            }
            // In all cases increament number of pixels in the current state and
            // get out if the state count became larger than the maximum possible.
            if (++state[stateIdx] > maxCount) {
                break;
            }
            --x, ++y;
        }

        return { location: patternCenter, state };
    }
}
