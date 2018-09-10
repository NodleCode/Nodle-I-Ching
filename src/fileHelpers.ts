import * as fs from "fs-extra";
import * as upng from "upng-js";
import { ImageData } from "./core/ImageData";

/**
 * Loads local image to ImageData interface
 *
 * @export
 * @param {string} path - Local path to image
 * @returns {Promise<ImageData>}
 */
export async function loadPng(path: string): Promise<ImageData> {
    const img = await fs.readFile(path);
    const data = upng.decode(img.buffer);
    return {
        data: new Uint8ClampedArray(upng.toRGBA8(data)),
        width: data.width,
        height: data.height,
    };
}
