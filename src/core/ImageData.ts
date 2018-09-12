/**
 * Represents image data.
 *
 * @export
 * @interface ImageData
 */
export interface ImageData {
    /**
     * Image width.
     */
    width: number;
    /**
     * Image height.
     */
    height: number;
    /**
     * Array containing RGBA image pixels, each pixel consists
     * of four consecutive cells representing red, green, blue, alpha values for the pixel.
     * [r0, g0, b0, a0, r1, g1, b1, a1, ...]
     */
    data: Uint8ClampedArray;
}
