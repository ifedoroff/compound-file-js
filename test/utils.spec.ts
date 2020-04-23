import {toUTF16Bytes, toUTF16String} from "../src/utils";
import { expect } from "chai";

describe('test utility methods', () => {
    it('string encoding to/from UTF16 bytes', () => {
        const str = "abc";
        const asUTF16Bytes = toUTF16Bytes(str);
        expect(toUTF16String(asUTF16Bytes)).eq(str);
    });
});