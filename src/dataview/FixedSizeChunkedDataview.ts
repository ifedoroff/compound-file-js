import {CFDataview} from "./СFDataview";
import {ReferencingSubview} from "./ReferencingSubview";
import {SimpleDataview} from "./SimpleDataview";
import {initializedWidth} from "../utils";

/**
 * @internal
 */
export class FixedSizeChunkedDataview implements CFDataview {

    private readonly chunkSize: number;
    private readonly chunks: CFDataview[] = [];

    constructor(chunkSize: number, dataChunks?: number[]|CFDataview[]) {
        this.chunkSize = chunkSize;
        if(dataChunks != null) {
            if(typeof dataChunks[0] === 'number') {
                if(dataChunks.length % chunkSize !== 0) throw new Error();
                const dataLength = dataChunks.length;
                const rawView = new SimpleDataview(dataChunks as number[]);
                for (let i = 0; i < dataLength; i += 512) {
                    this.chunks.push(new ReferencingSubview(rawView, i, i + 512));
                }
            } else {
                this.chunks.push(...(dataChunks as CFDataview[]));
            }
        }
    }

    writeAt(position: number, bytes: number[]): CFDataview {
        return this.chunks[Math.floor(position / 512)].writeAt(position%512, bytes);
    }

    getSize(): number {
        return this.chunks.length * this.chunkSize;
    }

    getData(): number[] {
        const result: number[] = [];
        for (const chunk of this.chunks) {
            result.push(...chunk.getData());
        }
        return result;
    }

    subView(start: number, end?: number): CFDataview {
        if(end == null) throw new Error("'end' parameter is mandatory");
        if(Math.floor(start/this.chunkSize) !== Math.floor((end - 1)/this.chunkSize)) throw new Error(`Can only get subview enclosed by one chunk. Actual values: ${start} - ${end}`);
        if(start === end) throw new Error("Cannot get subview of size 0");
        const chunk = this.chunks[Math.floor(start / this.chunkSize)];
        if(end % this.chunkSize === 0) {
            return chunk.subView(start % this.chunkSize);
        } else {
            return chunk.subView(start % this.chunkSize, end % this.chunkSize);
        }
    }

    allocate(length: number): CFDataview {
        if (length !== this.chunkSize) throw new Error();
        const view = new SimpleDataview(initializedWidth(length, 0));
        this.chunks.push(view);
        return view;
    }

    fill(filler: number[]): CFDataview {
        throw new Error("Unsupported operation");
    }

    readAt(position: number, length: number): number[] {
        throw new Error("Unsupported operation");
    }

    isEmpty(): boolean {
        return false;
    }
}