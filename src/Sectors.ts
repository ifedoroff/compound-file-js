import {CFDataview} from "./dataview/СFDataview";
import {Header} from "./Header";
import {Sector} from "./dataview/Sector";
import {SimpleSector} from "./dataview/SimpleSector";
import {ENDOFCHAIN_MARK, FREESECT_MARK_OR_NOSTREAM} from "./utils";
import {DIFATSector} from "./dataview/DIFATSector";

export class Sectors {

    private readonly dataView: CFDataview;
    private readonly sectorShift: number;
    private readonly header: Header;
    private readonly sectors: Sector[] = [];

    constructor(dataView: CFDataview, header: Header) {
        this.dataView = dataView;
        this.sectorShift = header.getSectorShift();
        this.header = header;
        this.readSectors();
    }

    sector(position: number): Sector {
        if(position > this.sectors.length) {
            throw new Error();
        }
        return this.sectors[position];
    }

    readSectors(): void {
        // Skip first 512 bytes designated for Header
        if(!this.dataView.isEmpty()) {
            if(this.dataView.getSize() % this.sectorShift !== 0)
                throw new Error();
            for (let i = 1; i < this.dataView.getSize() / this.sectorShift; i++) {
                this.sectors.push(SimpleSector.from(this.dataView.subView(i * this.sectorShift, (i + 1) * this.sectorShift), this.sectors.length));
            }
        }
    }

    allocate(): Sector {
        const allocated = SimpleSector.from(this.dataView.allocate(this.sectorShift), this.sectors.length);
        allocated.fill(FREESECT_MARK_OR_NOSTREAM);
        this.sectors.push(allocated);
        return allocated;
    }

    allocateDIFAT(): DIFATSector {
        const sector = new DIFATSector(this.allocate());
        sector.fill(FREESECT_MARK_OR_NOSTREAM);
        sector.subView(508).writeAt(0, ENDOFCHAIN_MARK);
        return sector;
    }
}
