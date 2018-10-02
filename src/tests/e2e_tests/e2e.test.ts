import { decode } from "../..";
import { loadJpeg } from "../fileHelpers";

const testsCount = 82;
const testPath = (testNumber: number) => `./src/tests/test_data/camera_images/${testNumber}.jpg`;

describe("End to End testing scenarios", async () => {
    for (let test = 1; test <= testsCount; ++test) {
        it("Decodes sample " + test + " correctly!", async () => {
            const img = await loadJpeg(testPath(test));
            decode(img.data, img.width, img.height);
        });
    }
});
