import {CFDataview} from "./СFDataview";
import {ReferencingSubview} from "./ReferencingSubview";
import {SimpleDataview} from "./SimpleDataview";

/**
 * @internal
 */
export class FixedSizeChunkedDataview implements CFDataview {

    private readonly chunkSize: number;
    private readonly chunks: CFDataview[] = [];

    constructor(chunkSize: number, dataChunks?: Uint8Array|CFDataview[]) {
        this.chunkSize = chunkSize;
        if(dataChunks instanceof Uint8Array) {
            if(dataChunks.length % chunkSize !== 0) throw new Error();
            const dataLength = dataChunks.length;
            const rawView = new SimpleDataview(dataChunks);
            for (let i = 0; i < dataLength; i += 512) {
                this.chunks.push(new ReferencingSubview(rawView, i, i + 512));
            }
        } else {
            this.chunks.push(...dataChunks);
        }
    }

    writeAt(position: number, bytes: Uint8Array): CFDataview {
        return this.chunks[position / 512].writeAt(position%512, bytes);
    }

    getSize(): number {
        return this.chunks.length * this.chunkSize;
    }

    getData(): Uint8Array {
        const result = new Uint8Array(this.getSize());
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            result.set(chunk.getData(), i * this.chunkSize);
        }
        return result;
    }


    subView(start: number, end?: number): CFDataview {
        if(end == null) throw new Error("'end' parameter is mandatory");
        if(start/this.chunkSize !== (end - 1)/this.chunkSize) throw new Error(`Can only get subview enclosed by one chunk. Actual values: ${start} - ${end}`);
        if(start === end) throw new Error("Cannot get subview of size 0");
        const chunk = this.chunks[start / this.chunkSize];
        if(end % this.chunkSize === 0) {
            return chunk.subView(start % this.chunkSize);
        } else {
            return chunk.subView(start % this.chunkSize, end % this.chunkSize);
        }
    }

    allocate(length: number): CFDataview {
        if (length !== this.chunkSize) throw new Error();
        const view = new SimpleDataview(new Uint8Array(length));
        this.chunks.push(view);
        return view;
    }

    fill(filler: Uint8Array): CFDataview {
        throw new Error("Unsupported operation");
    }

    readAt(position: number, length: number): Uint8Array {
        throw new Error("Unsupported operation");
    }

    isEmpty(): boolean {
        return false;
    }
}