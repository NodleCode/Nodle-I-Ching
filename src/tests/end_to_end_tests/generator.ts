import * as fs from "fs-extra";
import { EncodedIChing } from "../../core/EncodedIChing";
import { Encoder } from "../../core/encoder";
import { Writer } from "../../core/writer";
import { savePng } from "../fileHelpers";
import { getRandomInt } from "../testHelpers";

const resolutions = [500, 1000, 1500, 2000];
const ecLevels = [Encoder.EC_NONE, Encoder.EC_LOW, Encoder.EC_MEDIUM, Encoder.EC_HIGH];
const testDataCount = 5;
const minLength = 10;
const maxLength = 40;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

interface TestData {
    payload: string;
    ecLevel: number;
    resolution: number;
    code: EncodedIChing;
    path: string;
}

const jsonObject = {
    data: [] as TestData[],
};

for (let test = 0; test < testDataCount; test++) {
    const length = getRandomInt(minLength, maxLength);
    let payload = "";
    for (let i = 0; i < length; i++) {
        payload += alphabet[getRandomInt(0, alphabet.length - 1)];
    }

    for (const ecLevel of ecLevels) {
        const code = Encoder.encode(payload, ecLevel);
        for (const resolution of resolutions) {
            const writer = new Writer(resolution);
            const imgData = writer.render(code);

            const path = "./src/tests/end_to_end_tests/data/"
                + payload + "-" + resolution + "-" + ecLevel + ".png";
            savePng(path, imgData);
            jsonObject.data.push({ payload, ecLevel, resolution, code, path });
        }
    }
}

fs.writeFile("./src/tests/end_to_end_tests/data/samples.json", JSON.stringify(jsonObject));
