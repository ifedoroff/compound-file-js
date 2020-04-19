import {AllocationTable} from "./AllocationTable";
import {Sector} from "../dataview/Sector";
import {FAT} from "./FAT";
import {Header} from "../Header";
import {Sectors} from "../Sectors";

export class MiniFAT extends AllocationTable {

    private readonly header: Header;
    private readonly fat: FAT;

    constructor(sectors: Sectors, header: Header, fat: FAT) {
        super(sectors, fat.buildChain(header.getFirstMinifatSectorLocation()), header.getSectorShift());
        this.header = header;
        this.fat = fat;
    }

    protected allocateNewSector(): Sector {
        const newSector = super.allocateNewSector();
        const previousSectorPosition = this.sectorChain.length === 1 ? null : this.sectorChain[this.sectorChain.length - 2];
        this.fat.registerSector(newSector.getPosition(), previousSectorPosition);
        this.header.setNumberOfMiniFatSectors(this.sectorChain.length);
        if(this.sectorChain.length === 1) {
            this.header.setFirstMinifatSectorLocation(this.sectorChain[0]);
        }
        return newSector;
    }
}