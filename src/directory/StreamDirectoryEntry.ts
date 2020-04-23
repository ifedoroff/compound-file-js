import {ColorFlag, DirectoryEntry, ObjectType} from "./DirectoryEntry";
import {DirectoryEntryChain} from "./DirectoryEntryChain";
import {CFDataview} from "../dataview/СFDataview";
import * as Long from "long";
import "../Long";
import {StreamHolder} from "../stream/StreamHolder";
import {isEndOfChain} from "../utils";

export class StreamDirectoryEntry extends DirectoryEntry {

    private readonly streamHolder: StreamHolder;

    constructor(id: number, directoryEntryChain: DirectoryEntryChain, streamHolder: StreamHolder, view: CFDataview, name?: string, colorFlag?: ColorFlag, objectType: ObjectType = ObjectType.Stream) {
        super(id, directoryEntryChain, view, name, colorFlag, objectType);
        this.streamHolder = streamHolder;
    }

    getStreamData(): number[] {
        if(this.hasStreamData() && this.getStreamSize() > 0) {
            return this.streamHolder.getStreamData(this.getStreamStartingSector(), this.getStreamSize());
        } else {
            return [];
        }
    }

    setStreamData(data: number[]): void {
        this.setStreamStartingSector(this.streamHolder.setStreamData(data));
        this.setStreamSize(data.length);
    }

    read(fromIncl: number, toExcl: number): number[] {
        return this.streamHolder.read(this.getStreamStartingSector(), this.getStreamSize(), fromIncl, toExcl);
    }

    writeAt(position: number, data: number[]): void {
        if (position < 0) throw new Error("Starting position should be greater than 0: start = " + position);
        if(position + data.length > this.getStreamSize()) throw new Error(`Cannot write beyond the end of the stream: start = ${position}, end = ${position + data.length}`);
        this.streamHolder.writeAt(this.getStreamStartingSector(), this.getStreamSize(), position, data);
    }

    append(data: number[]): void {
        const startingLocation = this.streamHolder.append(this.getStreamStartingSector(), this.getStreamSize(), data);
        this.setStreamStartingSector(startingLocation);
        this.setStreamSize(this.getStreamSize() + data.length);
    }

    setStreamSize(length: number): void {
        this.view.subView(DirectoryEntry.FLAG_POSITION.STREAM_SIZE, DirectoryEntry.FLAG_POSITION.STREAM_SIZE + 4).writeAt(0, Long.fromValue(length).to4BytesLE());
    }

    getStreamSize(): number {
        return Long.fromBytesLE(this.view.subView(DirectoryEntry.FLAG_POSITION.STREAM_SIZE, DirectoryEntry.FLAG_POSITION.STREAM_SIZE + 4).getData()).toNumber();
    }

    hasStreamData(): boolean {
        return this.getObjectType() === ObjectType.Stream && !isEndOfChain(this.getStreamStartingSector());
    }
}