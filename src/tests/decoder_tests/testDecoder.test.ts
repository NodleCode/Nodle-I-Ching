import { BinaryGF } from "../../core/common/reedsolomon";
import { Decoder } from "../../core/decoder/Decoder";
import { Encoder } from "../../core/encoder/Encoder";
import { getRandomInt } from "../testHelpers";

const msg = "helloworldtestx12";
const encodedMsg = new Uint8ClampedArray([
    1, 17, 7, 4, 11,
    11, 14, 22, 14, 17,
    11, 3, 19, 4, 18,
    19, 23, 27, 28, 7,
    51, 62, 53, 59, 30,
]);
const offset = Encoder.OFFSET;
const ecSymbols = (encodedMsg.length - msg.length - offset) & (~1);

describe("Decoder", () => {
    it("Decodes a received message with errors within the correction limit", () => {
        for (let e = 0; e <= ecSymbols / 2; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg);
            for (let i = 0; i < e; i++) {
                const old = encodedCopy[i + offset];
                do {
                    encodedCopy[i + offset] = getRandomInt(0, BinaryGF.BINARY_GF_6.getSize() - 1);
                } while (encodedCopy[i + offset] === old);
            }
            const decoder = new Decoder();
            const decodedMsg = decoder.decode(encodedCopy);
            expect(msg.toUpperCase()).toEqual(decodedMsg.data);
            expect(decodedMsg.patterns).toBeNull();
            expect(decodedMsg.version).toEqual(encodedMsg[0]);
            expect(decodedMsg.size).toEqual(Math.round(Math.sqrt(encodedMsg.length)));
        }
    });

    it("Throws an error when received errors are beyond the correction limit", () => {
        for (let e = ecSymbols / 2 + 1; e <= ecSymbols + msg.length; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg);
            for (let i = 0; i < e; i++) {
                const old = encodedCopy[i + offset];
                do {
                    encodedCopy[i + offset] = getRandomInt(0, BinaryGF.BINARY_GF_6.getSize() - 1);
                } while (encodedCopy[i + offset] === old);
            }
            const decoder = new Decoder();
            expect(() => decoder.decode(encodedCopy)).toThrowError("Invalid IChing Code!");
        }
    });

    it("Throws an error when errors beyond correction limit are all zeroes", () => {
        for (let e = ecSymbols / 2 + 1; e <= ecSymbols + msg.length; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg);
            for (let i = 0; i < e; i++) {
                encodedCopy[i + offset] = 0;
            }
            const decoder = new Decoder();
            expect(() => decoder.decode(encodedCopy)).toThrowError("Invalid IChing Code!");
        }
    });
});
