import {CFDataview} from "./СFDataview";

/**
 * @internal
 */
export class ReferencingSubview implements CFDataview {

    private readonly capacity: number;
    private readonly start: number;
    private readonly end: number;
    private readonly delegate: CFDataview;

    constructor(delegate: CFDataview, start: number, end: number) {
        this.delegate = delegate;
        this.capacity = end - start;
        this.start = start;
        this.end = end;
    }

    writeAt(position: number, bytes: number[]): CFDataview {
        return this.delegate.writeAt(this.start + position, bytes);
    }

    public getSize(): number {
        return this.capacity;
    }

    public getData(): number[] {
        return this.delegate.readAt(this.start, this.end - this.start);
    }

    subView(start: number, end?: number): CFDataview {
        if(end == null) {
            end = this.capacity;
        }
        if(end < start) {
            throw new Error(`end < start (${end} < ${start})`);
        }
        if(start < 0) {
            throw new Error(`subView start: ${start}, view start: ${this.start}`);
        }
        if(end > this.capacity) {
            throw new Error(`subView end: ${end}, view end: ${this.capacity}`);
        }
        if(start >= this.capacity) {
            throw new Error(`subView start: ${start}, view end: ${this.capacity}`);
        }
        if(end < 0) {
            throw new Error(`subView end: ${end}, view start: ${this.start}`);
        }
        return new ReferencingSubview(this.delegate, this.start + start, this.start + end);
    }

    allocate(length: number): CFDataview {
        throw new Error("Unsupported operation");
    }

    fill(filler: number[]): CFDataview {
        if(this.getSize() % filler.length !== 0) throw new Error();
        const step: number = filler.length;
        for (let i = 0; i < this.getSize(); i+=step) {
            this.writeAt(i, filler);
        }
        return this;
    }

    readAt(position: number, length: number): number[] {
        if(this.start + position >= this.end) {
            throw new Error(`Starting position cannot be greater then subview 'end'. (starting position: ${position} < view end: ${this.end})`);
        }
        if(this.start + position + length >= this.end) {
            throw new Error(`Operation exceeds view limits. (read end position ${position + length}< view end: ${this.end})`);
        }
        return this.delegate.readAt(this.start + position, length);
    }

    isEmpty(): boolean {
        return this.getSize() === 0;
    }
}