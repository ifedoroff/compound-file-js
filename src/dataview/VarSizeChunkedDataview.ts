import TreeMap from "ts-treemap";
import {CFDataview} from "./СFDataview";
import {SimpleDataview} from "./SimpleDataview";

/**
 * @internal
 */
export class VariableSizeChunkedDataView implements CFDataview {

    private readonly viewMap: TreeMap<number, CFDataview> = new TreeMap();
    private readonly size: number;

    constructor(views: CFDataview[]) {
        let size = 0;
        for (const view of views) {
            size += view.getSize();
            this.viewMap.set(size - 1, view);
        }
        this.size = size;
    }

    writeAt(position: number, bytes: number[]): CFDataview {
        if(position < 0) throw new Error("Cannot write at index < 0: start = " + position);
        if(position + bytes.length > this.size) throw new Error(`Sub-view should has end index < ${this.size}: end = ${position + bytes.length - 1}`);
        let startingPositionInFirstView: number;
        const beforeFirst = this.viewMap.lowerKey(position);
        if(beforeFirst === undefined) {
            startingPositionInFirstView = position;
        } else {
            startingPositionInFirstView = position - beforeFirst - 1;
        }
        let remaining = bytes.length;
        let currentEntry = this.viewMap.ceilingEntry(position);
        const currentKey: number = currentEntry[0];
        const currentView: CFDataview = currentEntry[1];
        let bytesToWrite = Math.min(currentView.subView(startingPositionInFirstView).getSize(), remaining);
        remaining -= bytesToWrite;
        currentView.writeAt(startingPositionInFirstView, bytes.slice(0, bytesToWrite));
        while(remaining > 0) {
            currentEntry = this.viewMap.higherEntry(currentKey);
            if(currentEntry === undefined) {
                throw new Error("Preliminary end of chain");
            } else {
                bytesToWrite = Math.min(currentView.getSize(), remaining);
                remaining -= bytesToWrite;
                currentView.writeAt(0, bytes.slice(0, bytesToWrite));
            }
        }
        return this;
    }

    getSize(): number {
        return this.size;
    }

    getData(): number[] {
        const result = [];
        let index = 0;
        for (const view of Array.from(this.viewMap.values())) {
            result.push(...view.getData());
            index += view.getSize();
        }
        return result;
    }

    subView(start: number, end?: number): CFDataview {
        if(end == null) {
            if(start < 0)
                throw new Error("Sub-view should has starting index >= 0: start = " + start);
            const [firstKey, firstValue] = this.viewMap.ceilingEntry(start);
            let previousKey;
            if(this.viewMap.lowerEntry(start) === undefined) {
                [previousKey] = [firstKey, firstValue];
            } else {
                [previousKey] = this.viewMap.lowerEntry(start);
            }
            const startingPositionInFirstView = previousKey === firstKey ? start : start - previousKey - 1;
            const result: CFDataview[] = [];
            result.push(firstValue.subView(startingPositionInFirstView));
            result.push(...Array.from(this.viewMap.splitHigher(firstKey, false).values()));
            return new VariableSizeChunkedDataView(result);
        } else {
            if (start < 0) throw new Error("Sub-view should has starting index >= 0: start = " + start);
            if (end > this.size) throw new Error(`Sub-view should has end index < ${this.getSize()}: end = ${end}`);
            if (start >= this.getSize()) throw new Error(`Sub-view should not exceed the size of a view: size = ${this.getSize()}`);
            if (start > end) throw new Error(`Sub-view start should be less or equal to end: start(${start}) / end(${end})`);
            if (start === end) {
                return new SimpleDataview(new Array(0));
            }
            const last = end - 1;
            const firstEntry = this.viewMap.ceilingEntry(start);
            const [firstEntryKey, firstEntryValue]  = firstEntry;
            const lastEntry = this.viewMap.ceilingEntry(last);
            const [lastEntryKey, lastEntryValue] = lastEntry;
            let startingPositionInFirstView;
            const beforeFirst = this.viewMap.lowerKey(start);
            if (beforeFirst === undefined) {
                startingPositionInFirstView = start;
            } else {
                startingPositionInFirstView = start - beforeFirst - 1;
            }
            if (firstEntryKey === lastEntryKey) {
                if (beforeFirst === undefined) {
                    return firstEntryValue.subView(startingPositionInFirstView, end);
                } else {
                    return firstEntryValue.subView(startingPositionInFirstView, end - beforeFirst - 1);
                }
            } else {
                const beforeLast = this.viewMap.lowerKey(last);
                const result: CFDataview[] = [];
                result.push(firstEntryValue.subView(startingPositionInFirstView));
                result.push(...Array.from(this.viewMap.splitHigher(firstEntryKey, false).splitLower(lastEntryKey, false).values()));
                result.push(lastEntryValue.subView(0, end - beforeLast - 1));
                return new VariableSizeChunkedDataView(result);
            }
        }
    }
    allocate(length: number): CFDataview {
        throw new Error("Unsupported Operation");
    }

    fill(filler: number[]): CFDataview {
        this.viewMap.forEach((view) => view.fill(filler));
        return this;
    }

    readAt(position: number, length: number): number[] {
        return this.subView(position, position + length).getData();
    }

    isEmpty(): boolean {
        return this.getSize() === 0;
    }
}