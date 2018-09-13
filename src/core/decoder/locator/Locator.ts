import { BitMatrix } from "../../BitMatrix";
import { cross, nearlySame, Point, sqDistance, vec } from "../../geometry";
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
        // Store the most optimal distinct points in optimalFinders array
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
                // If it's a new pattern then check that it's size isn't far away (500%) from the
                // size of the pattern with the smallest errors.
                if (optimalFinders.length > 0) {
                    const min = Math.min(optimalFinders[0].size, finders[i].size);
                    const max = Math.max(optimalFinders[0].size, finders[i].size);
                    if (max > 5 * min) {
                        continue;
                    }

                }
                // If all is good then add it to optimalFinders
                optimalFinders.push(finders[i]);
            }
        }

        if (optimalFinders.length < 3) {
            throw new Error("Couldn't Locate Finder Patterns!");
        }
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
        const PatternsXDistance = Math.abs(this.locations.topRight.x - this.locations.topLeft.x);
        const PatternsYDistance = Math.abs(this.locations.topLeft.y - this.locations.bottomLeft.y);

        // Calculate the search region for the alignment pattern locator
        // Search start point
        const startPoint: Point = {
            x: Math.max(0, this.locations.bottomRight.x - (PatternsXDistance >> 1)),
            y: Math.max(0, this.locations.bottomRight.y - (PatternsYDistance >> 1)),
        };

        // Search end point
        const endPoint: Point = {
            x: Math.min(matrix.width, this.locations.bottomRight.x + (PatternsXDistance >> 1)),
            y: Math.min(matrix.height, this.locations.bottomRight.y + (PatternsYDistance >> 1)),
        };

        // Locate Alignment patterns.
        const alignments = patternLocator.locate(
            this.matrix, Locator.ALIGNMENT_RATIOS, startPoint, endPoint,
        );

        if (alignments.length > 0) {
            // Sort the array of found patterns to pick the one with the smallest error.
            alignments.sort(compareError);
            for (const pattern of alignments) {
                const min = Math.min(pattern.size, this.locations.alignmentSize);
                const max = Math.max(pattern.size, this.locations.alignmentSize);
                // if the pattern size is not away different than the expected (500%),
                // then consider it as the alignment pattern
                if (max < 5 * min) {
                    this.locations.bottomRight = pattern.location;
                    this.locations.alignmentSize = pattern.size;
                    break;
                }
            }
        }

        return this.locations;
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
