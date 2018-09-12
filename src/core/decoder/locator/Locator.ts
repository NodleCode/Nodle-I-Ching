import { BitMatrix } from "../../BitMatrix";
import { cross, nearlySame, Point, sqDistance, vec } from "../../geometry";
import { PatternsLocation } from "../PatternsLocation";
import { AlignmentLocator } from "./AlignmentLocator";
import { FinderLocator } from "./FinderLocator";
import { LocationError } from "./LocationError";

export class Locator {
    /**
     * Minimum distance between finder patterns.
     */
    public static MIN_PATTERN_DIST = 10;

    /**
     * The ratio of alignment pattern size to finder pattern size.
     */
    public static FINDER_TO_ALIGNMENT_RATIO = 5 / 7;

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
        const compareErrorGreater = (a: LocationError, b: LocationError): number => {
            if (a.error < b.error) {
                return -1;
            } else if (a.error > b.error) {
                return 1;
            }
            return 0;
        };

        // Locate Finder Patterns.
        const finderLocator = new FinderLocator();
        const finders = finderLocator.locate(this.matrix);
        // Sort the array of found patterns to pick the three with the smallest error.
        finders.sort(compareErrorGreater);
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
            this.locations.finderAverageSize * Locator.FINDER_TO_ALIGNMENT_RATIO;

        // Calculate the search region for the alignment pattern locator
        const xRange = Math.floor(this.locations.bottomLeft.x + this.locations.bottomRight.x) / 2;
        const yRange = Math.floor(this.locations.topRight.y + this.locations.bottomRight.y) / 2;
        const startPoint: Point = {
            x: this.locations.bottomLeft.x + xRange,
            y: this.locations.topRight.y + yRange,
        };
        const endPoint: Point = {
            x: startPoint.x + xRange,
            y: startPoint.y + yRange,
        };

        // Locate Alignment patterns.
        const alignmentLocator = new AlignmentLocator();
        const alignments = alignmentLocator.locate(this.matrix, startPoint, endPoint);

        if (alignments.length > 0) {
            // Sort the array of found patterns to pick the one with the larget error.
            alignments.sort(compareErrorGreater);
            this.locations.bottomRight = alignments[0].location;
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
