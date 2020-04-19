import {StreamRW} from "./StreamRW";

export class StreamHolder {

    private readonly regularStreamRW: StreamRW;
    private readonly miniStreamRW: StreamRW;
    private readonly sizeThreshold: number;

    constructor(regularStreamRW: StreamRW, miniStreamRW: StreamRW, sizeThreshold: number) {
        this.regularStreamRW = regularStreamRW;
        this.miniStreamRW = miniStreamRW;
        this.sizeThreshold = sizeThreshold;
    }

    private forSize(size: number): StreamRW {
        if(size >= this.sizeThreshold) {
            return this.regularStreamRW;
        } else {
            return this.miniStreamRW;
        }
    }


    getStreamData(startingLocation: number, size: number): number[] {
        return this.forSize(size).read(startingLocation, size);
    }

    setStreamData(data: number[]): number {
        return this.forSize(data.length).write(data);
    }

    read(startingLocation: number, size: number, fromIncl: number, toExcl: number): number[] {
        return this.forSize(size).read(startingLocation, fromIncl, toExcl);
    }

    writeAt(startingLocation: number, size: number, position: number, data: number[]): void {
        this.forSize(size).writeAt(startingLocation, position, data);
    }

    append(startingLocation: number, size: number, data: number[]): number {
        if(size < this.sizeThreshold && size + data.length >= this.sizeThreshold) {
            const result = this.forSize(size).read(startingLocation, size);
            result.push(...data);
            return this.forSize(size + data.length).write(result);
        } else {
            return this.forSize(size).append(startingLocation, size, data);
        }
    }
}