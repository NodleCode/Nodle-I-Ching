import { Point } from "../../geometry";

/**
 * @export
 * @interface LocationError
 * @description Represents each pattern location and the score of this location, the probabilty of
 * being a pattern location.
 */
export interface LocationError {
    /**
     * The center of the pattern.
     */
    location: Point;
    /**
     * The pattern error, consists of ratio and size errors
     */
    error: number;
}
