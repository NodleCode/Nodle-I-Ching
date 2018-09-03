import { Point } from "../Point";

/**
 * Interface representing the decoded IChing code and information about the image.
 *
 * @export
 * @interface IChingCode
 */
export interface IChingCode {
    /**
     * IChing code version number
     */
    version: number;
    /**
     *
     */
    data: string;
    binary: number[];
    finders: {
        topRight: Point;
        topLeft: Point;
        bottomRight: Point;
        bottomLeft: Point;
    };
}
