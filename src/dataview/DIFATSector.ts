import {Sector} from "./Sector";
import * as Long from "long";
import "../Long";
import {isEndOfChain, isFreeSectOrNoStream} from "../utils";
import {CFDataview} from "./СFDataview";

export class DIFATSector implements Sector {

    private delegate: Sector;
    private fatSectors: number[] = [];

    constructor(delegate: Sector) {
        this.delegate = delegate;
        for (let i = 0; i < delegate.getSize() - 4 - 1; i+=4) {
            const fatSectorPosition = delegate.subView(i, i + 4).getData();
            if(isFreeSectOrNoStream(fatSectorPosition)) {
                break;
            } else {
                this.fatSectors.push(Long.fromBytesLE(fatSectorPosition).toNumber());
            }
        }
    }

    getPosition(): number {
        return this.delegate.getPosition();
    }

    writeAt(position: number, bytes: number[]): CFDataview {
        if(isEndOfChain(bytes) && position !== 508)
            throw new Error();
        if(isFreeSectOrNoStream(bytes) && this.fatSectors.length > position / 4)
            throw new Error();
        if(!isEndOfChain(bytes) && !isFreeSectOrNoStream(bytes) && position !== 508) {
            if(this.fatSectors.length !== position / 4) {
                throw new Error();
            }
        }
        this.fatSectors.push(Long.fromBytesLE(bytes).toNumber());
        return this.delegate.writeAt(position, bytes);
    }

    registerFatSector(sectorPosition: number): void {
        if(this.fatSectors.length >= 127) {
            throw new Error();
        }
        this.writeAt(this.fatSectors.length * 4, Long.fromValue(sectorPosition).to4BytesLE());
    }

    registerNextDifatSector(sectorPosition: number): void {
        this.writeAt(508, Long.fromValue(sectorPosition).to4BytesLE());
    }

    getRegisteredFatSectors(): number[] {
        return this.fatSectors;
    }

    hasFreeSpace(): boolean {
        return this.fatSectors.length < 127;
    }

    getSize(): number {
        return this.delegate.getSize();
    }

    getData(): number[] {
        return this.delegate.getData();
    }

    subView(start: number, end?: number): CFDataview {
        return this.delegate.subView(start, end);
    }

    allocate(length: number): CFDataview {
        return this.delegate.allocate(length);
    }

    fill(filler: number[]): DIFATSector {
        this.delegate.fill(filler);
        return this;
    }

    isEmpty(): boolean {
        return this.delegate.isEmpty();
    }

    readAt(position: number, length: number): number[] {
        return this.delegate.readAt(position, length);
    }
}