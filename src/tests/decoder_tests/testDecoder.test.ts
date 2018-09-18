import { BinaryGF } from "../../core/common/reedsolomon";
import { Decoder } from "../../core/decoder";
import { Encoder } from "../../core/encoder";

const msg = "helloworldtestx12";
const encodedMsg = Encoder.encode(msg).data;
const offset = Encoder.OFFSET;
const ecSymbols = (encodedMsg.length - msg.length - offset) & (~1);

const getRandomInt = (max): number => {
    return Math.floor(Math.random() * Math.floor(max));
};

describe("Decoder", () => {
    it("Decodes a received message with errors within the correction limit", () => {
        for (let e = 0; e <= ecSymbols / 2; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg);
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

    it("Throws an error when received errors are beyond the correction limit", () => {
        for (let e = ecSymbols / 2 + 1; e <= ecSymbols + msg.length; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg);
            for (let i = 0; i < e; i++) {
                const old = encodedCopy[i + offset];
                do {
                    encodedCopy[i + offset] = getRandomInt(BinaryGF.BINARY_GF_6.getSize());
                } while (encodedCopy[i + offset] === old);
            }
            expect(() => Decoder.decode(encodedCopy)).toThrowError("Invalid IChing Code!");
        }
    });

    it("Throws an error when errors beyond correction limit are all zeroes", () => {
        for (let e = ecSymbols / 2 + 1; e <= ecSymbols + msg.length; e++) {
            const encodedCopy = new Uint8ClampedArray(encodedMsg);
            for (let i = 0; i < e; i++) {
                encodedCopy[i + offset] = 0;
            }
            expect(() => Decoder.decode(encodedCopy)).toThrowError("Invalid IChing Code!");
        }
    });
});
