
import {CFDataview} from "./СFDataview";
import {ReferencingSubview} from "./ReferencingSubview";
import {fill} from "../utils"

/**
 * @internal
 */
export class SimpleDataview implements CFDataview {

    private readonly data: number[];

    constructor(data: NonNullable<number[]>) {
        this.data = data;
    }

    writeAt(position: number, bytes:number[]): CFDataview {
        if(position + bytes.length > this.data.length) {
            throw new Error(`${bytes.length} + ${position} > ${this.data.length}`);
        }
        this.data.splice(position, bytes.length, ...bytes);
        return this;
    }

    getSize(): number {
        return this.data.length;
    }

    public getData(): number[] {
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

    fill(filler: number[]): CFDataview {
        fill(this.data, filler);
        return this;
    }

    readAt(position: number, length: number): number[] {
            return this.data.slice(position, position + length);
    }

    isEmpty(): boolean {
        return this.getSize() === 0;
    }
}