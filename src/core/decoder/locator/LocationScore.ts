import { Point } from "../../geometry";

/**
 * @export
 * @interface LocationScore
 * @description Represents each pattern location and the score of this location, the probabilty of
 * being a pattern location.
 */
export interface LocationScore {
    /**
     * The center of the pattern.
     */
    location: Point;
    /**
     * The score of the location from 0.0 to 1.0
     */
    score: number;
}
