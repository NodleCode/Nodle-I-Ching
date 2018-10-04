import * as fs from "fs-extra";
import { EncodedIChing } from "../../core/encoder/EncodedIChing";
import { Encoder } from "../../core/encoder/Encoder";
import { Writer } from "../../core/encoder/writer";
import { savePng } from "../fileHelpers";
import { getRandomInt } from "../testHelpers";

const resolutions = [306, 900, 2000];
const ecLevels = [Encoder.EC_NONE, Encoder.EC_LOW, Encoder.EC_MEDIUM, Encoder.EC_HIGH];
const averageTestDataCount = 2;
const smallTestDataCount = 2;
const minLength = 10;
const maxLength = 40;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

interface TestData {
    test: number;
    payload: string;
    ecLevel: number;
    resolution: number;
    code: EncodedIChing;
    path: string;
}

const jsonObject = {
    data: [] as TestData[],
};

const generateSample = (test: number, length: number, addErrorCorrection = true): void => {
    let payload = "";
    for (let i = 0; i < length; i++) {
        payload += alphabet[getRandomInt(0, alphabet.length - 1)];
    }

    for (const ecLevel of ecLevels) {
        if (!addErrorCorrection && ecLevel !== Encoder.EC_NONE) {
            continue;
        }
        const encoder = new Encoder();
        const code = encoder.encode(payload, ecLevel);
        for (const resolution of resolutions) {
            const writer = new Writer(resolution, true);
            writer.render(code);
            const imgData = code.imageData;

            const path = "./src/tests/test_data/writer_artifacts/"
                + test + "-" + resolution + "-" + ecLevel + ".png";
            savePng(path, imgData);
            jsonObject.data.push({ test, payload, ecLevel, resolution, code, path });
        }
    }
};

// average tests
for (let test = 0; test < averageTestDataCount; ++test) {
    const length = getRandomInt(minLength, maxLength);
    generateSample(test, length);
}

// small length tests
for (let length = 1; length <= smallTestDataCount; ++length) {
    const test = averageTestDataCount + length - 1;
    generateSample(test, length);
}

// full length with no error correction test
generateSample(
    averageTestDataCount + smallTestDataCount,
    Encoder.MAX_SIZE - Encoder.OFFSET,
    false,
);

fs.writeFile("./src/tests/test_data/writer_artifacts/samples.json", JSON.stringify(jsonObject));
