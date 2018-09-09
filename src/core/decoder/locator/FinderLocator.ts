import { BitMatrix } from "../../BitMatrix";
import { Point } from "../../geometry";
import { sumArray } from "../../utils";
import { LocationScore } from "./LocationScore";

/**
 * @export
 * @class FinderLocator
 * @description Locates all possible locations of Finder patterns and calculates score
 * for each location.
 */
export class FinderLocator {
    /**
     * Main class method - locates possible locations of finder patterns
     *
     * @param {BitMatrix} matrix - Matrix representing binarized image.
     * @returns {LocationScore[]} - Array of all possible locations of the patterns.
     * @memberof FinderLocator
     */
    private matrix: BitMatrix;

    public locate(matrix: BitMatrix): LocationScore[] {
        this.matrix = matrix;
        const locations = [];
        // Initialize state array with 5 positions to keep track of number of pixels in
        // each state of the patterns
        const state = new Uint8ClampedArray(5);
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
                            // If valid pattern, calculates its score and push it to results
                            const patternCenter: Point = {
                                x: x - Math.floor(state[stateIdx - 3] / 2) -
                                    state[stateIdx - 2] - state[stateIdx - 1],
                                y,
                            };
                            locations.push({
                                location: patternCenter,
                                score: this.calculateScore(patternCenter),
                            });

                            // we continue searching in case this pattern was a false positive.
                            // The last state could be the first state for another pattern.
                            state[0] = state[4];
                            stateIdx = 1;
                        } else {
                            // If it wasn't a valid pattern, we still can make use of the last
                            // three states as the first three in another pattern.
                            state[0] = state[2];
                            state[1] = state[3];
                            state[2] = state[4];
                            stateIdx = 3;
                        }
                    }
                }
                // In all cases increament number of pixels in the current state.
                ++state[stateIdx];
            }
        }

        // Handle the case that the image right side cuts a finder pattern.
        // This case could happen if a user is trying to fit the code to the screen exactly.
        if (stateIdx === 4 && this.isValidPattern(state)) {
            // If valid pattern, calculates its score and push it to results
            const patternCenter: Point = {
                x: matrix.width - Math.floor(state[stateIdx - 2] / 2) -
                    state[stateIdx - 1] - state[stateIdx],
                y: matrix.height - 1,
            };
            locations.push({
                location: patternCenter,
                score: this.calculateScore(patternCenter),
            });
        }

        return locations;
    }

    /**
     * Checks if the ratios of calculated states indeed form a valid pattern.
     *
     * @private
     * @param {Uint8ClampedArray} state - Array represents calculated states for
     * the probable pattern.
     * @returns {boolean} - either it's a valid pattern or not.
     * @memberof FinderLocator
     */
    private isValidPattern(state: Uint8ClampedArray): boolean {
        // Since the finder pattern ratios is 1:1:3:1:1, it consist of 7 units,
        // a unit for each state except for the middle state consists of 3 units,
        // so we first calculates how much pixels each unit consists of.
        const unit = sumArray(state) / 7;
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
     * and calculate score according to that.
     *
     * @private
     * @param {Point} patternCenter - The center of the pattern to calculate score for.
     * @returns {number} - Integer value from 1 to 4 representing pattern score.
     * @memberof FinderLocator
     */
    private calculateScore(patternCenter: Point): number {
        let score = 1;
        // Check if a vertical line passin through the center will intersect with the pattern
        // with the required ratios, and increament the score if so.
        if (this.checkVerticalRatio(patternCenter)) {
            ++score;
        }
        // The same check for the main (right) diagonal.
        if (this.checkMainDiagonalRatio(patternCenter)) {
            ++score;
        }
        // The same check for the skew (left) diagonal.
        if (this.checkSkewDiagonalRatio(patternCenter)) {
            ++score;
        }
        return score;
    }

    private checkVerticalRatio(patternCenter: Point): boolean {
        const state = new Uint8ClampedArray(5);
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
            // In all cases increament number of pixels in the current state.
            ++state[stateIdx];
        }

        // exact same logic as above but counting up to cover the full pattern.
        for (let y = patternCenter.y - 1, stateIdx = 2; y >= 0; --y) {
            if ((stateIdx & 1) === this.matrix.get(x, y)) {
                --stateIdx;
                if (stateIdx === -1) {
                    break;
                }
            }
            ++state[stateIdx];
        }

        return this.isValidPattern(state);
    }

    private checkMainDiagonalRatio(patternCenter: Point): boolean {
        const state = new Uint8ClampedArray(5);
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
            // In all cases increament number of pixels in the current state.
            ++state[stateIdx];
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
            ++state[stateIdx];
            --x, --y;
        }

        return this.isValidPattern(state);
    }

    private checkSkewDiagonalRatio(patternCenter: Point): boolean {
        const state = new Uint8ClampedArray(5);
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
            // In all cases increament number of pixels in the current state.
            ++state[stateIdx];
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
            ++state[stateIdx];
            --x, ++y;
        }

        return this.isValidPattern(state);
    }
}
