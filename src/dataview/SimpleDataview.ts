
import {CFDataview} from "./СFDataview";
import {ReferencingSubview} from "./ReferencingSubview";
import {fill} from "../utils"

/**
 * @internal
 */
export class SimpleDataview implements CFDataview {

    private readonly data: Uint8Array;

    constructor(data: NonNullable<Uint8Array>) {
        this.data = data;
    }

    writeAt(position: number, bytes:Uint8Array): CFDataview {
        if(position + bytes.byteLength > this.data.length) {
            throw new Error(`${bytes.byteLength} + ${position} > ${this.data.byteLength}`);
        }
        this.data.set(bytes, position);
        return this;
    }

    getSize(): number {
        return this.data.length;
    }

    public getData(): Uint8Array {
        return this.data;
    }

    subView(start: number, end?: number): CFDataview {
        if(end == null) {
            end = this.data.length;
        }
        const dataStart: number = 0;
        const dataEnd: number = this.data.length;
        if(end < start) {
            throw new Error(`end < start (${end} < ${start})`);
        }
        if(start < dataStart) {
            throw new Error(`subView start: ${start}, view start: ${dataStart}`);
        }
        if(end > dataEnd) {
            throw new Error(`subView end: ${end}, view end: ${dataEnd}`);
        }
        if(start >= dataEnd) {
            throw new Error(`subView start: ${start}, view end: ${dataEnd}`);
        }
        if(end < dataStart) {
            throw new Error(`subView end: ${end}, view start: ${dataStart}`);
        }
        return new ReferencingSubview(this, start, end);
    }


    allocate(length: number): CFDataview {
        throw new Error("Unsupported operation");
    }

    fill(filler: Uint8Array): CFDataview {
        fill(this.data, filler);
        return this;
    }

    readAt(position: number, length: number): Uint8Array {
            return this.data.subarray(position, position + length);
    }

    isEmpty(): boolean {
        return this.getSize() === 0;
    }
}