import { Encoder } from "../../core/encoder/Encoder";

const longPayload = "this0payload1is2too3long4for5high6error7correction8level9";
const invalidPayload = "spaces are not supported";
const payload = "validpayload";
const invalidEcLevel = -0.1;

describe("Encoder", () => {
    it("Throws an error when payload is empty", () => {
        const encoder = new Encoder();
        expect(() => encoder.encode("", Encoder.EC_MEDIUM)).toThrowError("Empty payload!");
    });

    it("Throws an error when ecLevel is invalid", () => {
        const encoder = new Encoder();
        expect(() => encoder.encode("", invalidEcLevel)).toThrowError("Empty payload!");
    });

    it("Throws an error when payload and error correction level combination is too big", () => {
        const encoder = new Encoder();
        expect(() => encoder.encode(longPayload, Encoder.EC_MEDIUM)).toThrowError(
            "Payload and error correction level combination is too big!",
        );
    });

    it("Throws an error if payload contains invalid character", () => {
        const encoder = new Encoder();
        expect(() => encoder.encode(invalidPayload, Encoder.EC_MEDIUM)).toThrowError(
            "Invalid character in payload!",
        );
    });

    it("Calculates the correct size of the IChing code", () => {
        const encoder = new Encoder();
        const encodedPayload = encoder.encode(payload, Encoder.EC_HIGH);
        expect(encodedPayload.size).toBe(5);
    });
});
