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
     * Number of rows.
     */
    rows: number;
    /**
     * Number of columns.
     */
    cols: number;
    /**
     * Encoded data of size rows * cols.
     */
    data: number[];
}
