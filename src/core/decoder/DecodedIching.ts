import { PatternsLocation } from "./PatternsLocation";

/**
 * @export
 * @interface DecodedIChing
 * @description Interface representing the decoded IChing code and information about the image.
 */
export interface DecodedIChing {
    /**
     * IChing code version number.
     */
    version: number;
    /**
     * Number of rows and columns in the IChing code.
     */
    size: number;
    /**
     * Decoded data in the form of string.
     */
    data: string;
    /**
     * Location of finder and alignment patterns in the image.
     */
    finders: PatternsLocation;
}
