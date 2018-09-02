import { EncodedIChing } from "../EncodedIChing";

/**
 * @export
 * @class Encoder
 */
export class Encoder {
    /**
     * Creates an IChing code from provided content.
     *
     * @static
     * @param {string} content
     * @returns {EncodedIChing}
     */
    public static encode(content: string): EncodedIChing {
        const version: number = 0;
        const rows: number = 8;
        const cols: number = 8;

        const data: number[] = [];
        for (let i = 0; i < rows * cols; i++) {
            data[i] = i;
        }

        data[0] = version;
        data[1] = content.length;

        content = content.toUpperCase();
        for (let i = 0; i < content.length; i++) {
            const c: string = content.charAt(i);
            if (c >= "0" && c <= "9") {
                data[i + 2] = 26 + c.charCodeAt(0) - "0".charCodeAt(0);
            } else {
                data[i + 2] = c.charCodeAt(0) - "A".charCodeAt(0);
            }
        }

        return { version, rows, cols, data };
    }
}
