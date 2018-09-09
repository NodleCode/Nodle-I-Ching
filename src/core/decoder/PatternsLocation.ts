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
     * Bottom-right finder pattern position.
     */
    bottomRight: Point;
    /**
     * Bottom-left finder pattern position.
     */
    bottomLeft: Point;
}
