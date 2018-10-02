import { decode } from "../..";
import { loadJpeg } from "../fileHelpers";

const testsCount = 10;
const testPath = (testNumber: number) => `./src/tests/test_data/camera_images/${testNumber}.jpg`;

describe("End to End testing scenarios", async () => {
    for (let test = 1 + testsCount * 4; test <= testsCount * 8; ++test) {
        it("Decodes sample " + test + " correctly!", async () => {
            const img = await loadJpeg(testPath(test));
            decode(img.data, img.width, img.height);
        });
    }
});
