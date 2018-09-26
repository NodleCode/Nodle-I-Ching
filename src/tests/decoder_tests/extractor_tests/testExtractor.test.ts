import { Extractor } from "../../../core/decoder/extractor";
import { EncodedIChing } from "../../../core/EncodedIChing";
import { loadPng } from "../../fileHelpers";
import { singleChannelToBitMatrix } from "../../testHelpers";

const countErrors = (real: EncodedIChing, expected: EncodedIChing): number => {
    if (real.version !== expected.version || real.rows !== expected.rows ||
            real.cols !== expected.cols || real.data.length !== expected.data.length) {
        return 64;
    }

    let errorCount = 0;
    for (let i = 0; i < real.data.length; i++) {
        if (real.data[i] !== expected.data[i]) {
            errorCount++;
        }
    }
    return errorCount;
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

        const img = await loadPng("./src/tests/test_data/transformed/perfect_post_correction.png");
        const matrix = singleChannelToBitMatrix(img);
        const extractor = new Extractor();
        const real = extractor.extract(matrix);

        expect(countErrors(real, expected)).toBeLessThanOrEqual(0);
    });

    it("Detects missing bits and symbols in a perfect image", async () => {
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
            "./src/tests/test_data/transformed/perfect_post_correction_missing.png",
        );
        const matrix = singleChannelToBitMatrix(img);
        const extractor = new Extractor();
        const real = extractor.extract(matrix);

        expect(countErrors(real, expected)).toBeLessThanOrEqual(0);
    });

    it("Extracts data with at most one error from corrected, low resolution images", async () => {
        const expected: EncodedIChing = {
            version: 1,
            rows: 5,
            cols: 5,
            data: new Uint8ClampedArray([
                1, 11, 14, 17, 14,
                1, 14, 17, 14, 28,
                26, 27, 34, 20, 0,
                32, 41, 12, 9, 3,
                44, 26, 53, 33, 13,
            ]),
        };
        const testCasesCount = 3;

        for (let i = 0; i < testCasesCount; i++) {
            const img = await loadPng("./src/tests/test_data/transformed/" + (i + 1) + ".png");
            const matrix = singleChannelToBitMatrix(img);
            const extractor = new Extractor();
            const real = extractor.extract(matrix);
            expect(countErrors(real, expected)).toBeLessThanOrEqual(1);
        }
    });
});
