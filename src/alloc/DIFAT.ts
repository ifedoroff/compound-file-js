import {Sectors} from "../Sectors";
import {Header} from "../Header";
import {isEndOfChain} from "../utils";
import * as Long from "long";
import "../Long";
import {DIFATSector} from "../dataview/DIFATSector";
import {FATtoDIFATFacade} from "./FATtoDIFATFacade";

export class DIFAT {

    private readonly sectors: Sectors;
    private readonly header: Header;
    private readonly faTtoDIFATFacade: FATtoDIFATFacade;
    private readonly difatSectors: DIFATSector[] = [];

    constructor(sectors: Sectors, header: Header, faTtoDIFATFacade: FATtoDIFATFacade) {
        this.sectors = sectors;
        this.header = header;
        this.faTtoDIFATFacade = faTtoDIFATFacade;
        this.readDifatSectors();
    }

    readDifatSectors(): void {
        const firstDifatSectorLocation = this.header.getFirstDifatSectorLocation();
        if(!isEndOfChain(firstDifatSectorLocation)) {
            let lastSector = new DIFATSector(this.sectors.sector(firstDifatSectorLocation));
            this.difatSectors.push(lastSector);
            let nextSectorPosition = Long.fromBytesLE(lastSector.subView(this.header.getSectorShift() - 4, this.header.getSectorShift()).getData()).toNumber();
            while(!isEndOfChain(nextSectorPosition)) {
                lastSector = new DIFATSector(this.sectors.sector(nextSectorPosition));
                this.difatSectors.push(lastSector);
                nextSectorPosition = Long.fromBytesLE(lastSector.subView(this.header.getSectorShift() - 4, this.header.getSectorShift()).getData()).toNumber();
            }
        }
    }

    getFatSectorChain(): number[] {
        const result = [];
        result.push(...this.header.getDifatEntries());
        for(const difatSector of this.difatSectors) {
            result.push(...difatSector.getRegisteredFatSectors());
        }
        return result;
    }

    registerFATSector(sectorPosition: number): void {
        if(!this.header.canFitMoreDifatEntries()) {
            let difatSector: DIFATSector;
            if(this.difatSectors.length === 0) {
                difatSector = this.sectors.allocateDIFAT();
                this.faTtoDIFATFacade.registerDifatSectorInFAT(difatSector.getPosition());
                this.header.setFirstDifatSectorLocation(difatSector.getPosition());
                this.difatSectors.push(difatSector);
                this.header.setNumberOfDifatSectors(this.difatSectors.length);
            } else if(!this.difatSectors[this.difatSectors.length - 1].hasFreeSpace()) {
                difatSector = this.sectors.allocateDIFAT();
                this.faTtoDIFATFacade.registerDifatSectorInFAT(difatSector.getPosition());
                this.difatSectors[this.difatSectors.length - 1].registerNextDifatSector(difatSector.getPosition());
                this.difatSectors.push(difatSector);
                this.header.setNumberOfDifatSectors(this.difatSectors.length);
            } else {
                difatSector = this.difatSectors[this.difatSectors.length - 1];
            }
            difatSector.registerFatSector(sectorPosition);
        } else {
            this.header.registerFatSector(sectorPosition);
        }
    }
}