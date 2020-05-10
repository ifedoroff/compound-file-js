import {FAT} from "../alloc/FAT";
import {MiniFAT} from "../alloc/MiniFAT";
import {Header} from "../Header";
import {Sectors} from "../Sectors";
import {ENDOFCHAIN_MARK_INT, FREESECT_MARK_OR_NOSTREAM_INT, initializedWidth} from "../utils";
import {VariableSizeChunkedDataView} from "../dataview/VarSizeChunkedDataview";
import {CFDataview} from "../dataview/СFDataview";
import {Sector} from "../dataview/Sector";
import {StreamRW} from "./StreamRW";

export class MiniStreamRW implements StreamRW {

    public static readonly MINI_STREAM_CHUNK_SIZE = 64;
    private readonly miniFAT: MiniFAT;
    private readonly header: Header;
    private miniStreamLength: number;
    private readonly fat: FAT;
    private readonly miniStreamSectorChain: number[];
    private readonly sectors: Sectors;

    constructor(miniFAT: MiniFAT, fat: FAT, firstMiniStreamSector: number, miniStreamLength: number, sectors: Sectors, header: Header) {
        this.miniFAT = miniFAT;
        this.fat = fat;
        this.miniStreamLength = miniStreamLength;
        if(firstMiniStreamSector >= 0) {
            this.miniStreamSectorChain = fat.buildChain(firstMiniStreamSector);
        } else {
            this.miniStreamSectorChain = [];
        }
        this.sectors = sectors;
        this.header = header;
    }

    read(startingSector: number, lengthOrFromIncl: number, toExcl?: number): number[] {
        if(toExcl == null) {
            const result = initializedWidth(lengthOrFromIncl, 0);
            let position = 0;
            for (const sectorNumber of this.miniFAT.buildChain(startingSector)) {
                if (lengthOrFromIncl > 0) {
                    const data = this.getMiniSectorData(sectorNumber);
                    const bytesToRead = Math.min(data.getSize(), lengthOrFromIncl);
                    result.splice(position, bytesToRead, ...data.subView(0, bytesToRead).getData());
                    position += bytesToRead;
                    lengthOrFromIncl -= bytesToRead;
                } else {
                    break;
                }
            }
            return result;
        } else {
            return new VariableSizeChunkedDataView(this.miniFAT.buildChain(startingSector).map((position) => this.getMiniSectorData(position)))
                .subView(lengthOrFromIncl, toExcl).getData();
        }
    }

    getMiniSectorData(position: number): CFDataview {
        const sectorPosition = Math.floor(position * this.header.getMiniSectorShift() / this.header.getSectorShift());
        const shiftInsideSector = position * this.header.getMiniSectorShift() % this.header.getSectorShift();
        return this.sectors.sector(this.miniStreamSectorChain[sectorPosition]).subView(shiftInsideSector, shiftInsideSector + this.header.getMiniSectorShift());
    }

    write(data: number[]): number {
        if(data.length <= 0) {
            throw new Error();
        }
        const numberOfChunks = this.howManyChunksNeeded(data.length);
        let firstMiniSectorPosition = ENDOFCHAIN_MARK_INT;
        for (let i = 0; i < numberOfChunks; i++) {
            const bytesFromPosition = i * this.header.getMiniSectorShift();
            const bytesUpToPosition = Math.min((i + 1) * this.header.getMiniSectorShift(), data.length);
            const bytesToWrite = data.slice(bytesFromPosition, bytesUpToPosition);
            this.getDataHolderForNextChunk().writeAt(0, bytesToWrite);
            const miniSectorPosition = this.miniStreamLength / this.header.getMiniSectorShift();
            if(firstMiniSectorPosition === ENDOFCHAIN_MARK_INT) {
                firstMiniSectorPosition = miniSectorPosition;
            }
            if(i === 0) {
                this.miniFAT.registerSector(miniSectorPosition, null);
            } else {
                this.miniFAT.registerSector(miniSectorPosition, miniSectorPosition - 1);
            }
            this.miniStreamLength += this.header.getMiniSectorShift();
        }
        return firstMiniSectorPosition;
    }

    howManyChunksNeeded(dataLength: number): number {
        let numberOfChunks;
        if(dataLength % this.header.getMiniSectorShift() === 0) {
            numberOfChunks = Math.floor(dataLength / this.header.getMiniSectorShift());
        } else {
            numberOfChunks = Math.floor(dataLength / this.header.getMiniSectorShift()) + 1;
        }
        return numberOfChunks;
    }

    writeAt(startingSector: number, position: number, data: number[]): void {
        new VariableSizeChunkedDataView(this.miniFAT.buildChain(startingSector).map((pos) => this.getMiniSectorData(pos)))
            .writeAt(position, data);
    }

    append(startingSector: number, currentSize: number, data: number[]): number {
        const sectorChain = this.miniFAT.buildChain(startingSector);
        if(sectorChain.length === 0) {
            return this.write(data);
        }
        const lastSectorPosition = sectorChain[sectorChain.length - 1];
        const lastSector = this.getMiniSectorData(lastSectorPosition);
        let freeBytesInLastSector = 0;
        let remainingBytes = data.length;
        if(currentSize % this.header.getMiniSectorShift() !== 0) {
            freeBytesInLastSector = lastSector.getSize() - currentSize % this.header.getMiniSectorShift();
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
        for (let i = 0; i < numberOfChunks; i++) {
            const bytesFromPosition = i * this.header.getMiniSectorShift();
            const bytesUpToPosition = Math.min((i + 1) * this.header.getMiniSectorShift(), data.length);
            const bytesToWrite = data.slice(bytesFromPosition, bytesUpToPosition);
            this.getDataHolderForNextChunk().writeAt(0, bytesToWrite);
            const miniSectorPosition = this.miniStreamLength / this.header.getMiniSectorShift();
            if(i === 0) {
                this.miniFAT.registerSector(miniSectorPosition, lastSectorPosition);
            } else {
                this.miniFAT.registerSector(miniSectorPosition, miniSectorPosition - 1);
            }
            this.miniStreamLength += this.header.getMiniSectorShift();
        }
        return startingSector;
    }

    getDataHolderForNextChunk(): CFDataview {
        const currentSector = this.getSectorForNextChunk();
        const positionInCurrentSector = this.miniStreamLength % this.header.getSectorShift();
        return currentSector.subView(positionInCurrentSector, positionInCurrentSector + this.header.getMiniSectorShift());
    }

    getSectorForNextChunk(): Sector {
        if(this.miniStreamSectorChain.length === 0) {
            const sector = this.sectors.allocate();
            this.fat.registerSector(sector.getPosition(), null);
            this.miniStreamSectorChain.push(sector.getPosition());
            return sector;
        } else if(this.miniStreamLength % this.header.getSectorShift() === 0) {
            const sector = this.sectors.allocate();
            this.fat.registerSector(sector.getPosition(), this.sectors.sector(this.miniStreamSectorChain[this.miniStreamSectorChain.length - 1]).getPosition());
            this.miniStreamSectorChain.push(sector.getPosition());
            return sector;
        } else {
            return this.sectors.sector(this.miniStreamSectorChain[this.miniStreamSectorChain.length - 1]);
        }
    }

    getMiniStreamLength(): number {
        return this.miniStreamLength;
    }

    getMiniStreamFirstSectorPosition(): number {
        return this.miniStreamLength <= 0 ? FREESECT_MARK_OR_NOSTREAM_INT : this.miniStreamSectorChain[0];
    }
}