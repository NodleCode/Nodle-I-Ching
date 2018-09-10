import { Locator } from "../";
import { loadPng } from "../../../../fileHelpers";
import { singleChannelToBitMatrix } from "../../../../testHelpers";

describe("locate", () => {

    it('locates a "perfect" image', async () => {
        const img = await loadPng("./test_data/binarized/perfect.png");
        const matrix = singleChannelToBitMatrix(img);
        const locator = new Locator();
        const locations = locator.locate(matrix);
        expect(true).toBeTruthy();
    });

});
