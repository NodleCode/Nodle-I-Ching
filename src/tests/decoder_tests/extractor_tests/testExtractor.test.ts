import { Extractor } from "../../../core/decoder/extractor";
import { EncodedIChing } from "../../../core/EncodedIChing";
import { loadPng } from "../../fileHelpers";
import { singleChannelToBitMatrix } from "../../testHelpers";

const compare = (real: EncodedIChing, expected: EncodedIChing): boolean => {
    if (real.version !== expected.version || real.rows !== expected.rows ||
            real.cols !== expected.cols || real.data.length !== expected.data.length) {
        return false;
    }
    for (let i = 0; i < real.data.length; i++) {
        if (real.data[i] !== expected.data[i]) {
            return false;
        }
    }
    return true;
};

describe("Extract", () => {
    it("Extracts symbols from a perfect image", async () => {
        const expected: EncodedIChing = {
            version: 0,
            rows: 8,
            cols: 8,
            data: new Uint8ClampedArray([
                0, 11, 14, 17, 14, 1, 14, 17,
                14, 54, 52, 53, 60, 13, 14, 15,
                16, 17, 18, 19, 20, 21, 22, 23,
                24, 25, 26, 27, 28, 29, 30, 31,
                32, 33, 34, 35, 36, 37, 38, 39,
                40, 41, 42, 43, 44, 45, 46, 47,
                48, 49, 50, 51, 52, 53, 54, 55,
                56, 57, 58, 59, 60, 61, 62, 63,
            ]),
        };

        const img = await loadPng("./src/tests/test_data/binarized/perfect_post_correction.png");
        const matrix = singleChannelToBitMatrix(img);
        const extractor = new Extractor();
        const real = extractor.extract(matrix);

        expect(compare(real, expected)).toBeTruthy();
    });

    it("Detects missing bits from symbols in a perfect image", async () => {
        const expected: EncodedIChing = {
            version: 0,
            rows: 8,
            cols: 8,
            data: new Uint8ClampedArray([
                0, 11, 14, 17, 14, 1, 14, 17,
                14, 54, 52, 53, 60, 13, 14, 15,
                16, 17, 18, 19, 20, 21, 22, 23,
                24, 25, 26, 27, 60, 29, 31, 31,
                32, 33, 34, 63, 36, 37, 38, 63,
                40, 41, 42, 43, 44, 45, 46, 47,
                48, 49, 50, 51, 52, 53, 54, 55,
                56, 57, 58, 59, 60, 61, 62, 63,
            ]),
        };

        const img = await loadPng(
            "./src/tests/test_data/binarized/perfect_post_correction_missing.png",
        );
        const matrix = singleChannelToBitMatrix(img);
        const extractor = new Extractor();
        const real = extractor.extract(matrix);

        expect(compare(real, expected)).toBeTruthy();
    });
});
