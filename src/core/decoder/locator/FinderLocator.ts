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
        const state = new Uint16Array(5);
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

            // Handle the case that the image right side cuts a finder pattern.
            // This case could happen if a user is trying to fit the code to the screen exactly.
            if (stateIdx === 4 && this.isValidPattern(state)) {
                // If valid pattern, calculates its error and push it to results
                const initialCenter: Point = {
                    x: matrix.width - Math.floor(state[stateIdx - 2] / 2) -
                        state[stateIdx - 1] - state[stateIdx],
                    y,
                };
                locations.push(this.calculateLocationError(initialCenter, state[2] * 2));
            } else {
                stateIdx = 0;
                state[0] = state[1] = state[2] = state[3] = state[4] = 0;
            }
        }

        return locations;
    }

    /**
     * Checks if the ratios of calculated states indeed form a valid pattern.
     *
     * @private
     * @param {Uint16Array} state - Array represents calculated states for
     * the probable pattern.
     * @returns {boolean} - either it's a valid pattern or not.
     * @memberof FinderLocator
     */
    private isValidPattern(state: Uint16Array): boolean {
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
        const vertical = this.calculatePatternMeasures(patternCenter, 0, 1, maxCount);
        const horizontal = this.calculatePatternMeasures(patternCenter, 1, 0, maxCount);
        const mainDiagonal = this.calculatePatternMeasures(patternCenter, 1, 1, maxCount);
        const skewDiagonal = this.calculatePatternMeasures(patternCenter, -1, 1, maxCount);

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
        // 20 is the number of error factors, 4 lines each one of them has 5 pattern states.
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
     * @param {Uint16Array} state - State array representing how many pixels represent
     * each pattern state.
     * @param {number} averageUnit - Average pattern state unit size.
     * @returns {number} - Normalized sum(Xi - mean)^2.
     * @memberof FinderLocator
     */
    private calculateStateError(state: Uint16Array, averageUnit: number): number {
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
     * @memberof FinderLocator
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

        const state = new Uint16Array(5);
        let x = patternCenter.x;
        let y = patternCenter.y;
        let xEnd = dx === -1 ? -1 : this.matrix.width;
        let yEnd = dy === -1 ? -1 : this.matrix.height;
        let stateIdx = 2;
        // Count pixels from the center and going forward.
        while (x !== xEnd && y !== yEnd) {
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
            x += dx;
            y += dy;
        }
        const sumForward = state[2];

        // exact same logic as above but counting backward to cover the full pattern.
        x = patternCenter.x - dx;
        y = patternCenter.y - dy;
        xEnd = dx === 1 ? -1 : this.matrix.width;
        yEnd = dy === 1 ? -1 : this.matrix.height;
        stateIdx = 2;
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
        const sumBackward = state[2] - sumForward;

        // adjust the pattern center according to number of pixels on both sides of the old center.
        const correctedCenter = {
            x: patternCenter.x + Math.floor((sumForward - sumBackward) / 2) * dx,
            y: patternCenter.y + Math.floor((sumForward - sumBackward) / 2) * dy,
        };
        return { location: correctedCenter, state };
    }
}
