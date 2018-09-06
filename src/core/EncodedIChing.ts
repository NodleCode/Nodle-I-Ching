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
     * Width, in symbols, of IChing code.
     */
    width: number;
    /**
     * Height, in symbols, of IChing code.
     */
    height: number;
    /**
     * Encoded data of size rows * cols.
     */
    data: Uint16Array;
}
