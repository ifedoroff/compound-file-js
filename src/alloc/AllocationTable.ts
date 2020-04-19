import {Sectors} from "../Sectors";
import {ENDOFCHAIN_MARK, isEndOfChain} from "../utils";
import * as Long from "long";
import "../Long";
import {Sector} from "../dataview/Sector";

export class AllocationTable {

    public static readonly ENTRIES_IN_ONE_FAT_SECTOR = 128;
    protected readonly sectors: Sectors;
    protected readonly sectorChain: number[] = [];
    private readonly sectorSize: number;

    constructor(sectors: Sectors, sectorChain: number[], sectorSize: number) {
        this.sectors = sectors;
        this.sectorChain = sectorChain;
        this.sectorSize = sectorSize;
    }

    buildChain(currentSector: number): number[] {
        if(isEndOfChain(currentSector)) {
            return [];
        }
        const chain: number[] = [];
        while (!isEndOfChain(currentSector)) {
            chain.push(currentSector);
            currentSector = this.getValueAt(currentSector);
        }

        return chain;
    }

    getValueAt(position: number): number {
        const sectorNumber = Math.floor(position * 4 / this.sectorSize);
        const shiftInsideSector = position * 4 % this.sectorSize;
        if(sectorNumber > this.sectorChain.length) {
            throw new Error();
        }
        return Long.fromBytesLE(this.sectors.sector(this.sectorChain[sectorNumber]).subView(shiftInsideSector, shiftInsideSector + 4).getData()).toNumber();
    }

    registerSector(sectorPosition: number, previousSectorPosition: number): void {
        this.getFatSectorPointingToAllocatedSector(sectorPosition).writeAt(this.calculatePositionInsideFatSector(sectorPosition), ENDOFCHAIN_MARK);
        if(previousSectorPosition != null) {
            this.getFatSectorPointingToAllocatedSector(previousSectorPosition).writeAt(this.calculatePositionInsideFatSector(previousSectorPosition), Long.fromValue(sectorPosition).to4BytesLE());
        }
    }

    protected getFatSectorPointingToAllocatedSector(sectorPosition: number): Sector {
        const fatSectorInChain = Math.floor(sectorPosition / AllocationTable.ENTRIES_IN_ONE_FAT_SECTOR);
        if(this.sectorChain.length <= fatSectorInChain) {
            let targetSector: Sector = null;
            while(this.sectorChain.length <= fatSectorInChain) {
                targetSector = this.allocateNewSector();
            }
            return targetSector;
        } else {
            return this.sectors.sector(this.sectorChain[fatSectorInChain]);
        }
    }

    protected allocateNewSector(): Sector {
        const fatSector = this.sectors.allocate();
        const sectorPosition = fatSector.getPosition();
        this.sectorChain.push(sectorPosition);
        return fatSector;
    }

    protected calculatePositionInsideFatSector(sectorPosition: number): number {
        return sectorPosition % AllocationTable.ENTRIES_IN_ONE_FAT_SECTOR * 4;
    }

}