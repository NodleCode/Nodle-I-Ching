import { BitMatrix } from "../../BitMatrix";
import { cross, distance, nearlySame, Point, sqDistance, vec } from "../../geometry";
import { PatternsLocation } from "../PatternsLocation";
import { LocationError } from "./LocationError";
import { PatternLocator } from "./PatternLocator";

export class Locator {
    /**
     * Minimum distance between finder patterns.
     */
    public static MIN_PATTERN_DIST = 50;

    /**
     * The ratio of alignment pattern size to finder pattern size.
     */
    public static ALIGNMENT_TO_FINDER_RATIO = 5 / 7;

    /**
     * The maximum tolerance allowed for a pattern size to differentiate than its estimated size.
     */
    public static LOOSE_SIZE_TOLERANCE = 5;

    /**
     * A lower tolerance value allowed for a pattern size to differentiate than its estimated size.
     */
    public static CONFINED_SIZE_TOLERANCE = 4;

    /**
     * Finder pattern ratios between white and black states.
     */
    public static FINDER_RATIOS = new Uint8Array([ 1, 1, 3, 1, 1 ]);

    /**
     * Alignment pattern ratios between white and black states.
     */
    public static ALIGNMENT_RATIOS = new Uint8Array([ 1, 3, 1 ]);

    private matrix: BitMatrix;
    private locations: PatternsLocation;

    /**
     * Main class method, locate the finder and alignment patterns
     *
     * @param {BitMatrix} matrix - Matrix representing binarized image.
     * @returns {PatternsLocation} - Locations of the finder and alignment patterns.
     * @memberof Locator
     */
    public locate(matrix: BitMatrix): PatternsLocation {
        this.matrix = matrix;
        this.locations = {} as PatternsLocation;
        /**
         * compare function to sort location according to error in accending order.
         */
        const compareError = (a: LocationError, b: LocationError): number => (a.error - b.error);

        // Locate Finder Patterns.
        const patternLocator = new PatternLocator();
        const finders = patternLocator.locate(this.matrix, Locator.FINDER_RATIOS);

        // Sort the array of found patterns to pick the three with the smallest error.
        finders.sort(compareError);

        // First we get the least error three distinct finder patterns without checking their sizes.
        let optimalFinders = this.findOptimalPatterns(finders);
        // Then we get the optimal finder patterns by checking each one size against estimated size.
        // Making the estimate size equal to the maximum among our first guess patterns makes since
        // because it's harder for large objects to achieve the required finder patterns ratio.
        const estimatedFinderSize = Math.max(
            optimalFinders[0].size, optimalFinders[1].size, optimalFinders[2].size,
        );
        optimalFinders = this.findOptimalPatterns(finders, estimatedFinderSize);

        this.assignFinders(
            optimalFinders[0].location,
            optimalFinders[1].location,
            optimalFinders[2].location,
        );
        this.locations.finderAverageSize = (
            optimalFinders[0].size +
            optimalFinders[1].size +
            optimalFinders[2].size
        ) / 3;

        // Calculate the estimated location and size of the bottom-right alignment pattern
        this.locations.bottomRight = {
            x: this.locations.topRight.x - this.locations.topLeft.x + this.locations.bottomLeft.x,
            y: this.locations.topRight.y - this.locations.topLeft.y + this.locations.bottomLeft.y,
        };
        this.locations.alignmentSize =
            this.locations.finderAverageSize * Locator.ALIGNMENT_TO_FINDER_RATIO;

        // Average distance between patterns
        let patternsDistance = distance(this.locations.topLeft, this.locations.topRight);
        patternsDistance += distance(this.locations.topLeft, this.locations.bottomLeft);
        patternsDistance = Math.round(patternsDistance / 2);

        // Calculate the search region for the alignment pattern locator
        // Search start point
        const startPoint: Point = {
            x: Math.max(0, this.locations.bottomRight.x - (patternsDistance)),
            y: Math.max(0, this.locations.bottomRight.y - (patternsDistance)),
        };

        // Search end point
        const endPoint: Point = {
            x: Math.min(matrix.width, this.locations.bottomRight.x + (patternsDistance)),
            y: Math.min(matrix.height, this.locations.bottomRight.y + (patternsDistance)),
        };

        // Locate Alignment patterns.
        const alignments = patternLocator.locate(
            this.matrix, Locator.ALIGNMENT_RATIOS,
            true, startPoint, endPoint,
        );

        const estimatedAlignmentSize = this.locations.alignmentSize;
        if (alignments.length > 0) {
            // Sort the array of found patterns to pick the one with the smallest error.
            alignments.sort(compareError);
            for (const pattern of alignments) {
                // If the pattern size is not far away different than the expected,
                // then consider it as the alignment pattern.
                // Used a loose tolerance if the pattern are larger than the expected, because it's
                // harder for large objects to form the required pattern ratio.
                if (
                    pattern.size < Locator.LOOSE_SIZE_TOLERANCE * estimatedAlignmentSize &&
                    pattern.size * Locator.CONFINED_SIZE_TOLERANCE > estimatedAlignmentSize
                ) {
                    this.locations.bottomRight = pattern.location;
                    this.locations.alignmentSize = pattern.size;
                    break;
                }
            }
        }

        return this.locations;
    }

    /**
     * Finds the distinct finder patterns matching a certain size with tolerance equal to
     * LOOSE_SIZE_TOLERANCE*100%.
     *
     * @private
     * @param {LocationError[]} finders - Potential Finder patterns.
     * @param {number} [estimatedSize] - Size to check against, if not passed then no
     * size check happens.
     * @returns {LocationError[]} - The least error three distinct finder patterns.
     * @memberof Locator
     * @throws Error if there're no at least three distinct patterns matches the size.
     */
    private findOptimalPatterns(finders: LocationError[], estimatedSize?: number): LocationError[] {
        const optimalFinders: LocationError[] = [];
        for (let i = 0; i < finders.length && optimalFinders.length < 3; ++i) {
            // Check if points are actually distinct
            let distinctPoint = true;
            for (const oldPattern of optimalFinders) {
                if (nearlySame(
                    oldPattern.location,
                    finders[i].location,
                    Locator.MIN_PATTERN_DIST,
                )) {
                    distinctPoint = false;
                    break;
                }
            }
            if (distinctPoint) {
                // If it's a new pattern then check that it's size isn't far
                // away from the estimated size.
                // Used a loose tolerance if the pattern are larger than the expected, because it's
                // harder for large objects to form the required pattern ratio.
                if (
                    !estimatedSize ||
                    (finders[i].size < Locator.LOOSE_SIZE_TOLERANCE * estimatedSize &&
                    finders[i].size * Locator.CONFINED_SIZE_TOLERANCE > estimatedSize)
                ) {
                    // If all is good then add it to optimalFinders
                    optimalFinders.push(finders[i]);
                }
            }
        }
        if (optimalFinders.length < 3) {
            throw new Error("Couldn't Locate Finder Patterns!");
        }

        return optimalFinders;
    }

    /**
     * Reorder finder patterns and assign them to the returned object.
     *
     * @private
     * @param {Point} a
     * @param {Point} b
     * @param {Point} c
     * @memberof Locator
     */
    private assignFinders(a: Point, b: Point, c: Point) {
        // The topRight and the bottomLeft patterns should have the longest distance
        // so we assign them to variables `a` and `b`
        const distAB = sqDistance(a, b);
        const distAC = sqDistance(a, c);
        const distBC = sqDistance(b, c);
        // Make sure that vector AB has the longest distance
        if (distAC > distAB && distAC > distBC) {
            [c, b] = [b, c];
        } else if (distBC > distAB) {
            [c, a] = [a, c];
        }
        // Now the third point should be on the left from vector (bottomLeft -> topRight)
        // We use cross product to check if that's correct
        // If not then we swap the two points in order for variable `a` to hold bottomLeft
        // and variable `b` to hold topRight
        if (cross(vec(a, b), vec(a, c)) > 0) {
            [a, b] = [b, a];
        }

        // assign finder patterns to the returned object and assign alignment pattern to
        // null in case we didn't find any.
        this.locations.bottomLeft = a;
        this.locations.topRight = b;
        this.locations.topLeft = c;
    }
}
