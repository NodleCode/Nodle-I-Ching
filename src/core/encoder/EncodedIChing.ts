import { ImageData } from "../ImageData";

/**
 * Interface representing the encoded IChing.
 *
 * @export
 * @interface EncodedIChing
 */
export interface EncodedIChing {
    /**
     * IChing code version number.
     */
    version: number;
    /**
     * Number of rows and columns in the IChing code.
     */
    size: number;
    /**
     * Encoded data of length size * size.
     */
    data: Uint8ClampedArray;
    /**
     * Raw pixel data of the rendered image.
     */
    imageData: ImageData;
}
