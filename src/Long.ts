import Long from "long";

declare module "long" {
    interface Long {
        to4BytesLE(): number[];
        to4BytesBE(): number[];
        to2BytesLE(): number[];
        to2BytesBE(): number[];
    }
}

Long.prototype.to4BytesLE = function(): number[] {
    return this.toBytesLE().slice(0, 4);
};
Long.prototype.to4BytesBE = function(): number[] {
    return this.toBytesBE().slice(0, 4);
};

Long.prototype.to2BytesLE = function(): number[] {
    return this.toBytesLE().slice(0, 2);
};
Long.prototype.to2BytesBE = function(): number[] {
    return this.toBytesBE().slice(0, 2);
};

const fromBytesLEOriginal = Long.fromBytesLE;
Long.fromBytesLE = (bytes: number[], unsigned?: boolean ): Long => {
    const bytesLength = bytes.length;
    if(bytesLength === 8) {
        return fromBytesLEOriginal(bytes, unsigned);
    } else if(bytesLength === 4) {
        return new Long(
            bytes[0]       |
            bytes[1] <<  8 |
            bytes[2] << 16 |
            bytes[3] << 24,
            0,
            unsigned
        );
    } else if(bytesLength === 2) {
        return new Long(
            bytes[0]       |
            bytes[1] <<  8 ,
            0,
            unsigned
        );
    } else {
        throw new Error("Unsupported bytes length: " + bytesLength);
    }
};
