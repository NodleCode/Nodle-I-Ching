# IChing-JS

An IChing encoding and decoding library written in typescript for use in javascript-based web apps.

## Installation

## Usage

### Encoding

IChing-JS library exports a method `iching.encode(payload, options?)`.

#### Arguments
- `payload` - A string of alphanumeric characters that is the desired payload of the IChing.
- `options` (optional) - Additional options:
    - `ECLevel` - Error correction level, a number between 0 and 1 representing the maximum percentage of errors that can be corrected, relative to the payload length. Defaults to [`Encoder.EC_MEDIUM`](./src/core/encoder/Encoder.ts#L34) (0.15).
    - `Resolution` - A number representing the width and height of the square image produced by the method. Defaults to 1250.

#### Return Value
If the encoding process succeeds, the method will return an object that implements the [`EncodedIChing`](./src/core/encoder/EncodedIChing.ts) interface.

### Decoding

IChing-JS library exports a method `iching.decode(imageData, width, height)`.

#### Arguments
- `imageData` - A `Uint8ClampedArray` of RGBA pixel values in the form `[r0, g0, b0, a0, r1, g1, b1, a1, ...]`. The length of this array should be `4 * width * height`.
- `width` - The width of the image to be decoded.
- `height` - The height of the image to be decoded.

#### Return value
If the decoding process succeeds, the method will return an object that implements the [`DecodedIChing`](./src/core/decoder/DecodedIChing.ts) interface.