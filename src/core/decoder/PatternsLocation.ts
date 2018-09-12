import { Point } from "../geometry";

/**
 * @export
 * @interface FindersLocation
 * @description Finder and alignment patterns locations in the input image
 */
export interface PatternsLocation {
    /**
     * Top-right finder pattern position.
     */
    topRight: Point;
    /**
     * Top-left finder pattern position.
     */
    topLeft: Point;
    /**
     * Bottom-left finder pattern position.
     */
    bottomLeft: Point;
    /**
     * Bottom-right alignment pattern position.
     */
    bottomRight: Point;
    /**
     * The average size of the three finder patterns.
     */
    finderAverageSize: number;
    /**
     * The size of the bottom-right alignment pattern.
     */
    alignmentSize: number;
}
