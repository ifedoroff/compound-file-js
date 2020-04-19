import {CFDataview} from "./dataview/СFDataview";
import {Header} from "./Header";
import {isFreeSectOrNoStream} from "./utils";
import * as Long from "long";

export class DifatEntries {
    private readonly view: CFDataview;
    private readonly difatEntries: number[] = [];
    constructor(dataView: CFDataview) {
        this.view = dataView;
        for (let i = 0; i < this.view.getSize(); i+=4) {
            const entry = this.view.subView(i, i+4).getData();
            if(isFreeSectOrNoStream(entry)) {
                break;
            }
            this.difatEntries.push(Long.fromBytesLE(entry).toNumber());
        }
    }
    getDifatEntries(): number[] {
        return this.difatEntries;
    }
    registerFatSector(sectorPosition: number): void {
        if(this.difatEntries.length >= Header.DIFAT_ENTRIES_LIMIT_IN_HEADER) {
            throw new Error("Unable to register additional FAT sector in Header");
        }
        this.view.writeAt(this.difatEntries.length * 4, Long.fromValue(sectorPosition).to4BytesLE());
        this.difatEntries.push(sectorPosition);
    }
    isFull(): boolean {
        return this.difatEntries.length >= Header.DIFAT_ENTRIES_LIMIT_IN_HEADER;
    }
}