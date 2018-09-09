import { PatternsLocation } from "./PatternsLocation";

/**
 * @export
 * @interface IChingCode
 * @description Interface representing the decoded IChing code and information about the image.
 */
export interface IChingCode {
    /**
     * IChing code version number.
     */
    version: number;
    /**
     * Decoded data in the form of string.
     */
    data: string;
    /**
     * Decoded data in the form of binary string.
     */
    binary: string;
    /**
     * Location of finder and alignment patterns in the image.
     */
    finders: PatternsLocation;
}
