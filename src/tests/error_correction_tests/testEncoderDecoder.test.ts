import { BinaryGF } from "../../core/common/reedsolomon";
import { Decoder } from "../../core/decoder";
import { Encoder } from "../../core/encoder";

const msg = "thisisatestblabla1234";
const encodedMsg = Encoder.encode(msg);
const offset = Encoder.OFFSET;
const extraSymbols = Encoder.ROWS * Encoder.COLS - msg.length - offset;
const ecSymbols = extraSymbols & 1 ? extraSymbols ^ 1 : extraSymbols;

const getRandomInt = (max): number => {
    return Math.floor(Math.random() * Math.floor(max));
};

describe("Encoder & Decoder", () => {
    it("Successfully decodes a received message with errors within the correction limit", () => {
        for (let e = 0; e <= ecSymbols / 2; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg.data);
            for (let i = 0; i < e; i++) {
                const old = encodedCopy[i + offset];
                do {
                    encodedCopy[i + offset] = getRandomInt(BinaryGF.BINARY_GF_6.getSize());
                } while (encodedCopy[i + offset] === old);
            }
            const decodedMsg = Decoder.decode(encodedCopy);
            expect(msg.toUpperCase()).toEqual(decodedMsg);
        }
    });

    it("Successfully throws an error when received errors are beyond the correction limit", () => {
        for (let e = ecSymbols / 2 + 1; e <= ecSymbols + msg.length; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg.data);
            for (let i = 0; i < e; i++) {
                const old = encodedCopy[i + offset];
                do {
                    encodedCopy[i + offset] = getRandomInt(BinaryGF.BINARY_GF_6.getSize());
                } while (encodedCopy[i + offset] === old);
            }
            expect(() => Decoder.decode(encodedCopy)).toThrow();
        }
    });
});
