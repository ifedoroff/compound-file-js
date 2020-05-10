import {CFDataview} from "./dataview/СFDataview";
import * as Long from 'long';
import { DifatEntries } from "./DifatEntries";
import {ENDOFCHAIN_MARK, FREESECT_MARK_OR_NOSTREAM, equal, initializedWidth} from "./utils";

export class Header {

    static FLAG_POSITION = {
        SIGNATURE: 0,
        CLSID: 8,
        MINOR_VERSION: 24,
        MAJOR_VERSION: 26,
        BYTE_ORDER: 28,
        SECTOR_SHIFT: 30,
        MINI_SECTOR_SHIFT: 32,
        MINI_STREAM_CUTOFF_SIZE_POSITION: 56,
        FIRST_DIRECTORY_SECTOR: 48,
        NUMBER_OF_FAT_SECTORS: 44,
        FIRST_MINIFAT_SECTOR: 60,
        NUMBER_OF_MINIFAT_SECTORS: 64,
        FIRST_DIFAT_SECTOR: 68,
        NUMBER_OF_DIFAT_SECTORS: 72,
        DIFAT_ENTRIES_FIRST_POSITION: 76
    };

    public static readonly HEADER_SIGNATURE = [0xE1, 0x1A, 0xB1, 0xA1, 0xE0, 0x11, 0xCF, 0xD0].reverse();
    public static readonly MAJOR_VERSION_3 = [0x03, 0x00];
    public static readonly MINOR_VERSION_3 = [0x3E, 0x00];
    public static readonly BYTE_ORDER_LITTLE_ENDIAN = [0xFE, 0xff];
    public static readonly SECTOR_SHIFT_VERSION_3 = [0x09, 0x00];
    public static readonly SECTOR_SHIFT_VERSION_3_INT: number = Math.pow(2, Long.fromBytesLE(Header.SECTOR_SHIFT_VERSION_3).toNumber());
    public static readonly MINI_SECTOR_SHIFT_VERSION_3 = [0x06, 0x00];
    public static readonly MINI_SECTOR_SHIFT_VERSION_3_INT = Math.pow(2, Long.fromBytesLE(Header.MINI_SECTOR_SHIFT_VERSION_3).toNumber());
    public static readonly MINI_STREAM_CUTOFF_SIZE_INT = 0x00001000;
    public static readonly MINI_STREAM_CUTOFF_SIZE = Long.fromValue(Header.MINI_STREAM_CUTOFF_SIZE_INT).to4BytesLE()
    public static readonly HEADER_LENGTH = 512;
    public static readonly DIFAT_ENTRIES_LIMIT_IN_HEADER: number = 109;
    private readonly dataView: CFDataview;
    private readonly difatEntries: DifatEntries;

    static empty(dataView: CFDataview): Header {
        dataView.subView(Header.FLAG_POSITION.SIGNATURE, Header.FLAG_POSITION.SIGNATURE + 8).writeAt(0, Header.HEADER_SIGNATURE);
        dataView.subView(Header.FLAG_POSITION.MINOR_VERSION, Header.FLAG_POSITION.MINOR_VERSION + 2).writeAt(0, Header.MINOR_VERSION_3);
        dataView.subView(Header.FLAG_POSITION.MAJOR_VERSION, Header.FLAG_POSITION.MAJOR_VERSION + 2).writeAt(0, Header.MAJOR_VERSION_3);
        dataView.subView(Header.FLAG_POSITION.BYTE_ORDER, Header.FLAG_POSITION.BYTE_ORDER + 2).writeAt(0, Header.BYTE_ORDER_LITTLE_ENDIAN);
        dataView.subView(Header.FLAG_POSITION.SECTOR_SHIFT, Header.FLAG_POSITION.SECTOR_SHIFT + 2).writeAt(0, Header.SECTOR_SHIFT_VERSION_3);
        dataView.subView(Header.FLAG_POSITION.MINI_SECTOR_SHIFT, Header.FLAG_POSITION.MINI_SECTOR_SHIFT + 2).writeAt(0, Header.MINI_SECTOR_SHIFT_VERSION_3);
        dataView.subView(Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION, Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION + 4).writeAt(0, Header.MINI_STREAM_CUTOFF_SIZE);
        dataView.subView(Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION, Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION + 4).writeAt(0, Header.MINI_STREAM_CUTOFF_SIZE);
        dataView.subView(Header.FLAG_POSITION.FIRST_DIFAT_SECTOR, Header.FLAG_POSITION.FIRST_DIFAT_SECTOR + 4).writeAt(0, ENDOFCHAIN_MARK);
        dataView.subView(Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR, Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR + 4).writeAt(0, ENDOFCHAIN_MARK);
        dataView.subView(Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR, Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR + 4).writeAt(0, ENDOFCHAIN_MARK);
        dataView.subView(Header.FLAG_POSITION.DIFAT_ENTRIES_FIRST_POSITION, 512).fill(FREESECT_MARK_OR_NOSTREAM);
        return new Header(dataView);
    }


    constructor(dataView: CFDataview) {
        if(dataView.getSize() !== Header.HEADER_LENGTH) {
            throw new Error();
        }
        if(!equal(Header.HEADER_SIGNATURE, dataView.subView(Header.FLAG_POSITION.SIGNATURE, Header.FLAG_POSITION.SIGNATURE + 8).getData()))
            throw new Error();
        if(!equal(Header.MINOR_VERSION_3, dataView.subView(Header.FLAG_POSITION.MINOR_VERSION, Header.FLAG_POSITION.MINOR_VERSION +2).getData()))
            throw new Error();
        if(!equal(Header.MAJOR_VERSION_3, dataView.subView(Header.FLAG_POSITION.MAJOR_VERSION, Header.FLAG_POSITION.MAJOR_VERSION +2).getData()))
            throw new Error();
        if(!equal(Header.BYTE_ORDER_LITTLE_ENDIAN, dataView.subView(Header.FLAG_POSITION.BYTE_ORDER, Header.FLAG_POSITION.BYTE_ORDER + 2).getData()))
            throw new Error();
        if(!equal(Header.SECTOR_SHIFT_VERSION_3, dataView.subView(Header.FLAG_POSITION.SECTOR_SHIFT, Header.FLAG_POSITION.SECTOR_SHIFT + 2).getData()))
            throw new Error();
        if(!equal(Header.MINI_SECTOR_SHIFT_VERSION_3, dataView.subView(Header.FLAG_POSITION.MINI_SECTOR_SHIFT, Header.FLAG_POSITION.MINI_SECTOR_SHIFT + 2).getData()))
            throw new Error();
        if(!equal(initializedWidth(6, 0), dataView.subView(34, 40).getData()))
            throw new Error();
        if(!equal(initializedWidth(4, 0), dataView.subView(40, 44).getData()))
            throw new Error();
        if(!equal(Header.MINI_STREAM_CUTOFF_SIZE, dataView.subView(Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION, Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION + 4).getData()))
            throw new Error();
        this.dataView = dataView;
        this.difatEntries = new DifatEntries(this.dataView.subView(Header.FLAG_POSITION.DIFAT_ENTRIES_FIRST_POSITION));
    }

    getFirstDirectorySectorLocation(): number {
        return Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR, Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR + 4).getData()).toNumber();
    }

    getNumberOfFatSectors(): number {
        return Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS + 4).getData()).toNumber();
    }

    getFirstMinifatSectorLocation(): number {
        return Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR, Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR + 4).getData()).toNumber();
    }

    getFirstDifatSectorLocation(): number {
        return Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.FIRST_DIFAT_SECTOR, Header.FLAG_POSITION.FIRST_DIFAT_SECTOR + 4).getData()).toNumber();
    }

    getNumberOfMiniFatSectors(): number {
        return Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS + 4).getData()).toNumber();
    }

    getNumberOfDifatSectors(): number {
        return Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS + 4).getData()).toNumber();
    }

    getDifatEntries(): number[] {
        return this.difatEntries.getDifatEntries();
    }

    canFitMoreDifatEntries(): boolean {
        return !this.difatEntries.isFull();
    }

    setNumberOfFatSectors(i: number): void {
        this.dataView.subView(Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS + 4).writeAt(0, Long.fromValue(i).to4BytesLE());
    }

    setFirstDirectorySectorLocation(i: number): void {
        this.dataView.subView(Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR, Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR + 4).writeAt(0, Long.fromValue(i).to4BytesLE());
    }

    setFirstMinifatSectorLocation(i: number): void {
        this.dataView.subView(Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR, Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR + 4).writeAt(0, Long.fromValue(i).to4BytesLE());
    }

    setNumberOfMiniFatSectors(i: number): void {
        this.dataView.subView(Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS + 4).writeAt(0, Long.fromValue(i).to4BytesLE());
    }

    setFirstDifatSectorLocation(i: number): void {
        this.dataView.subView(Header.FLAG_POSITION.FIRST_DIFAT_SECTOR, Header.FLAG_POSITION.FIRST_DIFAT_SECTOR + 4).writeAt(0, Long.fromValue(i).to4BytesLE());
    }

    setNumberOfDifatSectors(i: number): void {
        this.dataView.subView(Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS + 4).writeAt(0, Long.fromValue(i).to4BytesLE());
    }

    getSectorShift(): number {
        return Math.pow(2, Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.SECTOR_SHIFT, Header.FLAG_POSITION.SECTOR_SHIFT + 2).getData()).toNumber());
    }

    getMiniSectorShift(): number {
        return Math.pow(2, Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.MINI_SECTOR_SHIFT, Header.FLAG_POSITION.MINI_SECTOR_SHIFT + 2).getData()).toNumber());
    }

    getMiniStreamCutoffSize(): number {
        return Long.fromBytesLE(this.dataView.subView(Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION, Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION + 4).getData()).toNumber();
    }

    registerFatSector(sectorPosition: number): void {
        this.difatEntries.registerFatSector(sectorPosition);
    }

}
