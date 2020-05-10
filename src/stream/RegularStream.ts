import {FAT} from "../alloc/FAT";
import {Header} from "../Header";
import {Sectors} from "../Sectors";
import {initializedWidth} from "../utils";
import {VariableSizeChunkedDataView} from "../dataview/VarSizeChunkedDataview";
import {StreamRW} from "./StreamRW";

export class RegularStreamRW implements StreamRW {

    private readonly fat: FAT;
    private readonly sectors: Sectors;
    private readonly header: Header;

    constructor(fat: FAT, sectors: Sectors, header: Header) {
        this.fat = fat;
        this.sectors = sectors;
        this.header = header;
    }

    read(startingSector: number, lengthOrFromIncl: number, toExcl?: number): number[] {
        if(toExcl == null) {
            const result = initializedWidth(lengthOrFromIncl, 0);
            let positionInResult = 0;
            for (const sectorPosition of this.fat.buildChain(startingSector)) {
                if (lengthOrFromIncl > 0) {
                    const sector = this.sectors.sector(sectorPosition);
                    const bytesToRead = Math.min(sector.getSize(), lengthOrFromIncl);
                    result.splice(positionInResult, bytesToRead, ...sector.subView(0, bytesToRead).getData());
                    positionInResult += bytesToRead;
                    lengthOrFromIncl -= bytesToRead;
                } else {
                    break;
                }
            }
            return result;
        } else {
            return new VariableSizeChunkedDataView(this.fat.buildChain(startingSector).map((sectorPosition) => this.sectors.sector(sectorPosition)))
                .subView(lengthOrFromIncl, toExcl).getData();
        }
    }

    write(data: number[]): number {
        let firstSectorPosition = null;
        let previousSectorPosition = null;
        for (let i = 0; i < data.length; i+=this.header.getSectorShift()) {
            const sector = this.sectors.allocate();
            const writeBytes = Math.min(this.header.getSectorShift(), data.length - i);
            sector.writeAt(0, data.slice(i, i + writeBytes));
            const sectorPosition = sector.getPosition();
            this.fat.registerSector(sectorPosition, previousSectorPosition);
            if(firstSectorPosition == null) {
                firstSectorPosition = sectorPosition;
            }
            previousSectorPosition = sectorPosition;
        }
        return firstSectorPosition;
    }

    writeAt(startingSector: number, position: number, data: number[]): void {
        new VariableSizeChunkedDataView(this.fat.buildChain(startingSector).map((pos) => this.sectors.sector(pos)))
            .writeAt(position, data);
    }

    append(startingSector: number, currentSize: number, data: number[]): number {
        const sectorChain = this.fat.buildChain(startingSector);
        if(sectorChain.length === 0) {
            return this.write(data);
        }
        const lastSectorPosition = sectorChain[sectorChain.length - 1];
        const lastSector = this.sectors.sector(lastSectorPosition);
        let freeBytesInLastSector = 0;
        let remainingBytes = data.length;
        if(currentSize % this.header.getSectorShift() !== 0) {
            freeBytesInLastSector = lastSector.getSize() - currentSize % this.header.getSectorShift();
            if(freeBytesInLastSector > 0) {
                const byteToWrite = Math.min(freeBytesInLastSector, data.length);
                lastSector.writeAt(lastSector.getSize() - freeBytesInLastSector, data.slice(0, byteToWrite));
                freeBytesInLastSector -= byteToWrite;
                remainingBytes -= byteToWrite;
            }
        }
        if(freeBytesInLastSector > 0 || remainingBytes === 0) {
            return startingSector;
        }
        const numberOfChunks = this.howManyChunksNeeded(remainingBytes);
        let previousSectorPosition = lastSectorPosition;
        for (let i = 0; i < numberOfChunks; i+=this.header.getSectorShift()) {
            const sector = this.sectors.allocate();
            const writeBytes = Math.min(this.header.getSectorShift(), data.length - i);
            sector.writeAt(0, data.slice(i, i + writeBytes));
            const sectorPosition = sector.getPosition();
            this.fat.registerSector(sectorPosition, previousSectorPosition);
            previousSectorPosition = sectorPosition;
        }
        return startingSector;
    }

    private howManyChunksNeeded(dataLength: number): number {
        let numberOfChunks;
        if(dataLength % this.header.getSectorShift() === 0) {
            numberOfChunks = Math.floor(dataLength / this.header.getSectorShift());
        } else {
            numberOfChunks = Math.floor(dataLength / this.header.getSectorShift()) + 1;
        }
        return numberOfChunks;
    }
}