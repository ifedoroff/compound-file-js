import {DIFAT} from "./DIFAT";
import {FAT} from "./FAT";

export class FATtoDIFATFacade {

    private difat: DIFAT;
    private fat: FAT;

    setDifat(difat: DIFAT): void {
        this.difat = difat;
    }

    setFat(fat: FAT): void {
        this.fat = fat;
    }

    getFatSectorChain(): number[] {
        return this.difat.getFatSectorChain();
    }

    registerFatSectorInDIFAT(sectorPosition: number): void {
        this.difat.registerFATSector(sectorPosition);
    }

    registerDifatSectorInFAT(sectorPosition: number): void {
        this.fat.registerDifatSector(sectorPosition);
    }
}