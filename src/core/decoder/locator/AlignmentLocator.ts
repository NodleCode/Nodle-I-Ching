/**
 * Alignment pattern locator and Finder pattern locator shares a lot of the logic and code,
 * but we decided to split the logic to be easier to support multiple alignment patterns and/or
 * any changes in future versions and to make use of the optimizations that comes from the minor
 * differences between finder and alignment patterns.
 */
import { BitMatrix } from "../../BitMatrix";
import { Point } from "../../geometry";
import { LocationScore } from "./LocationScore";
/**
 * @export
 * @class AlignmentLocator
 * @description Locates all possible locations of alignment patterns nearby the estimate
 * location and calculates score for each location.
 */
export class AlignmentLocator {
    /**
     * alignment pattern nested circles ratio.
     */
    public static ALIGNMENT_RATIO = [1, 3, 1];

    /**
     * Main class method - locates possible locations of alignment patterns
     *
     * @param {BitMatrix} matrix - Matrix representing binarized image.
     * @param {Point} startPoint - The starting point of the alignemnt pattern search region.
     * @param {Point} endPoint - The ending point of the alignemnt pattern search region.
     * @returns {LocationScore[]} - Array of all possible locations of the pattern.
     * @memberof AlignmentLocator
     */
    public locate(matrix: BitMatrix, startPoint: Point, endPoint: Point): LocationScore[] {
        // TODO add the alignment locator logic.
        return [];
    }
}
