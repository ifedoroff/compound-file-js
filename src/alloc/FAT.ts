import {Header} from "../Header";
import {Sectors} from "../Sectors";
import {FATtoDIFATFacade} from "./FATtoDIFATFacade";
import {AllocationTable} from "./AllocationTable";
import {DISECT_MARK, FATSECT_MARK} from "../utils";
import {Sector} from "../dataview/Sector";

export class FAT extends AllocationTable {

    private readonly header: Header;
    private readonly difat: FATtoDIFATFacade;

    constructor(sectors: Sectors, header: Header, difat: FATtoDIFATFacade) {
        super(sectors, difat.getFatSectorChain(), header.getSectorShift());
        this.header = header;
        this.difat = difat;
    }

    registerDifatSector(position: number): void {
        this.getFatSectorPointingToAllocatedSector(position).writeAt(this.calculatePositionInsideFatSector(position), DISECT_MARK);
    }

    protected allocateNewSector(): Sector {
        const newSector = super.allocateNewSector();
        const sectorPosition = newSector.getPosition();
        const fatSectorPointingToAllocatedSector = this.getFatSectorPointingToAllocatedSector(sectorPosition);
        const positionInsideFatSector = this.calculatePositionInsideFatSector(sectorPosition);
        fatSectorPointingToAllocatedSector.writeAt(positionInsideFatSector, FATSECT_MARK);
        this.difat.registerFatSectorInDIFAT(newSector.getPosition());
        this.header.setNumberOfFatSectors(this.sectorChain.length);
        return newSector;
    }
}