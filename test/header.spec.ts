import {Header} from "../src/Header";
import {ENDOFCHAIN_MARK, initializedWidth} from "../src/utils";
import { expect } from "chai";
import {SimpleDataview} from "../src/dataview/SimpleDataview";
import Long from "long";
import "../src/Long";

const DUMMY_HEADER = initializedWidth(Header.HEADER_LENGTH, 0);
DUMMY_HEADER.splice(Header.FLAG_POSITION.SIGNATURE,  8, ...Header.HEADER_SIGNATURE);
DUMMY_HEADER.splice(Header.FLAG_POSITION.MINOR_VERSION,  2, ...Header.MINOR_VERSION_3);
DUMMY_HEADER.splice(Header.FLAG_POSITION.MAJOR_VERSION,  2, ...Header.MAJOR_VERSION_3);
DUMMY_HEADER.splice(Header.FLAG_POSITION.BYTE_ORDER,  2, ...Header.BYTE_ORDER_LITTLE_ENDIAN);
DUMMY_HEADER.splice(Header.FLAG_POSITION.SECTOR_SHIFT, 2, ...Header.SECTOR_SHIFT_VERSION_3);
DUMMY_HEADER.splice(Header.FLAG_POSITION.MINI_SECTOR_SHIFT, 2, ...Header.MINI_SECTOR_SHIFT_VERSION_3);
DUMMY_HEADER.splice(Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION, 4, ...Header.MINI_STREAM_CUTOFF_SIZE);
DUMMY_HEADER.splice(Header.FLAG_POSITION.FIRST_DIFAT_SECTOR, 4, ...ENDOFCHAIN_MARK);
DUMMY_HEADER.splice(Header.FLAG_POSITION.DIFAT_ENTRIES_FIRST_POSITION, 436, ...initializedWidth(436, 0xff));

export function dummyHeader(): number[] {
    const result = [];
    result.push(...DUMMY_HEADER);
    return result;
}

describe('header test', () => {
    let data: number[];
    beforeEach(() => {
        data = dummyHeader()
    });
    it('header block size should be exactly 512 bytes long', () => {
        expect(() => new Header(new SimpleDataview(new Array(513)))).to.throw();
    });

    it('only CFB version 3 is supported', () => {
        data.splice(Header.FLAG_POSITION.MAJOR_VERSION, 2, ...[0x04, 0x00]);
        expect(() => new Header(new SimpleDataview(data))).to.throw();
        data.splice(Header.FLAG_POSITION.MAJOR_VERSION, 2, ...Header.MAJOR_VERSION_3);
        expect(() => new Header(new SimpleDataview(data))).to.not.throw();
    });

    it('only Little Endian byte order is supported', () => {
        data.splice(Header.FLAG_POSITION.BYTE_ORDER,2, ...[0xfd, 0xff]);
        expect(() => new Header(new SimpleDataview(data))).to.throw();
        data.splice(Header.FLAG_POSITION.BYTE_ORDER,2, ...Header.BYTE_ORDER_LITTLE_ENDIAN);
        expect(() => new Header(new SimpleDataview(data))).to.not.throw();
    });


    it('only 512-byte sector shift is supported', () => {
        data.splice(Header.FLAG_POSITION.SECTOR_SHIFT,2, ...[0x90, 0x00]);
        expect(() => new Header(new SimpleDataview(data))).to.throw();
        data.splice(Header.FLAG_POSITION.SECTOR_SHIFT,2, ...Header.SECTOR_SHIFT_VERSION_3);
        expect(() => new Header(new SimpleDataview(data))).to.not.throw();
    });

    it('only 64-byte mini-sector shift is supported', () => {
        data.splice(Header.FLAG_POSITION.MINI_SECTOR_SHIFT,2, ...[0x07, 0x00]);
        expect(() => new Header(new SimpleDataview(data))).to.throw();
        data.splice(Header.FLAG_POSITION.MINI_SECTOR_SHIFT,2, ...Header.MINI_SECTOR_SHIFT_VERSION_3);
        expect(() => new Header(new SimpleDataview(data))).to.not.throw();
    });

    it('reserved bytes in Header should be initialized to 0\'s', () => {
        data.splice(34,6, ...[0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd]);
        expect(() => new Header(new SimpleDataview(data))).to.throw();
        data.splice(34,6, ...[0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        expect(() => new Header(new SimpleDataview(data))).to.not.throw();
    });

    it('bytes in Header describing  Number of Directory Sectors in CFB file should be initialized to 0\'s', () => {
        data.splice(40,4, ...[0xdd, 0xdd, 0xdd, 0xdd]);
        expect(() => new Header(new SimpleDataview(data))).to.throw();
        data.splice(40,4, ...[0x00, 0x00, 0x00, 0x00]);
        expect(() => new Header(new SimpleDataview(data))).to.not.throw();
    });

    it('only 4096-bytes mini-stream cutoff size is supported', () => {
        data.splice(Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION, 4, ...[0x00, 0x20, 0x00, 0x00]);
        expect(() => new Header(new SimpleDataview(data))).to.throw();
        data.splice(Header.FLAG_POSITION.MINI_STREAM_CUTOFF_SIZE_POSITION, 4, ...Header.MINI_STREAM_CUTOFF_SIZE);
        expect(() => new Header(new SimpleDataview(data))).to.not.throw();
    });

    it('check proper handling of read/write operations for certain service information', () => {
        data.splice(Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS, 4, ...[0x01, 0x00, 0x00, 0x00]);
        data.splice(Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR, 4, ...[0x02, 0x00, 0x00, 0x00]);
        data.splice(Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR, 4, ...[0x03, 0x00, 0x00, 0x00]);
        data.splice(Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS, 4, ...[0x04, 0x00, 0x00, 0x00]);
        data.splice(Header.FLAG_POSITION.FIRST_DIFAT_SECTOR, 4, ...[0x05, 0x00, 0x00, 0x00]);
        data.splice(Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS, 4, ...[0x06, 0x00, 0x00, 0x00]);
        const header = new Header(new SimpleDataview(data));
        expect(header.getNumberOfFatSectors()).eq(1);
        expect(header.getFirstDirectorySectorLocation()).eq(2);
        expect(header.getFirstMinifatSectorLocation()).eq(3);
        expect(header.getNumberOfMiniFatSectors()).eq(4);
        expect(header.getFirstDifatSectorLocation()).eq(5);
        expect(header.getNumberOfDifatSectors()).eq(6);
        header.setNumberOfFatSectors(6);
        header.setFirstDirectorySectorLocation(5);
        header.setFirstMinifatSectorLocation(4);
        header.setNumberOfMiniFatSectors(3);
        header.setFirstDifatSectorLocation(2);
        header.setNumberOfDifatSectors(1);
        expect(Long.fromBytesLE(data.slice(Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS + 4)).toNumber()).eq(6);
        expect(Long.fromBytesLE(data.slice(Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR, Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR + 4)).toNumber()).eq(5);
        expect(Long.fromBytesLE(data.slice(Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR, Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR + 4)).toNumber()).eq(4);
        expect(Long.fromBytesLE(data.slice(Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS + 4)).toNumber()).eq(3);
        expect(Long.fromBytesLE(data.slice(Header.FLAG_POSITION.FIRST_DIFAT_SECTOR, Header.FLAG_POSITION.FIRST_DIFAT_SECTOR + 4)).toNumber()).eq(2);
        expect(Long.fromBytesLE(data.slice(Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS + 4)).toNumber()).eq(1);

        // sector shifts
        expect(header.getSectorShift()).eq(Header.SECTOR_SHIFT_VERSION_3_INT);
        expect(header.getMiniSectorShift()).eq(Header.MINI_SECTOR_SHIFT_VERSION_3_INT);
        expect(header.getMiniStreamCutoffSize()).eq(Header.MINI_STREAM_CUTOFF_SIZE_INT);
    });

    it('get information about DIFAT entries in Header', () => {
        data.splice(76, 4, ...Long.fromValue(0).to4BytesLE());
        data.splice(80, 4, ...Long.fromValue(1).to4BytesLE());
        data.splice(84, 4, ...Long.fromValue(2).to4BytesLE());
        const difatEntries = new Header(new SimpleDataview(data)).getDifatEntries();
        expect(difatEntries).to.deep.eq([0,1,2]);
    });

    it('register fat sector', () => {
        const header = new Header(new SimpleDataview(data));
        header.registerFatSector(100);
        expect(header.getDifatEntries().length).eq(1);
        expect(header.getDifatEntries()[0]).eq(100);
        expect(
            Long.fromBytesLE(data.slice(Header.FLAG_POSITION.DIFAT_ENTRIES_FIRST_POSITION, Header.FLAG_POSITION.DIFAT_ENTRIES_FIRST_POSITION + 4)).toNumber()
        ).eq(100);
    });

    it('register fat sector out of acceptable range', () => {
        for (let i = Header.FLAG_POSITION.DIFAT_ENTRIES_FIRST_POSITION; i < Header.HEADER_LENGTH; i++) {
            data.splice(i, 4, ...Long.fromValue(i).toBytesLE());
        }
        expect(() => new Header(new SimpleDataview(data)).registerFatSector(1)).to.throw();
    });

    it('creation of a new Header for empty CFB file', () => {
        const dataView = new SimpleDataview(initializedWidth(512, 0));
        // should not throw and error
        // A side-effect function
        Header.empty(dataView);
        // dataView should contain proper information to be read by Header at this point
        const header = new Header(dataView);
        expect(dataView.subView(Header.FLAG_POSITION.SIGNATURE, Header.FLAG_POSITION.SIGNATURE + 8).getData()).to.deep.eq(Header.HEADER_SIGNATURE);
        expect(dataView.subView(Header.FLAG_POSITION.CLSID, Header.FLAG_POSITION.CLSID + 16).getData()).to.deep.eq(initializedWidth(16, 0));
        expect(dataView.subView(Header.FLAG_POSITION.FIRST_DIFAT_SECTOR, Header.FLAG_POSITION.FIRST_DIFAT_SECTOR + 4).getData()).to.deep.eq(ENDOFCHAIN_MARK);
        expect(dataView.subView(Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_FAT_SECTORS + 4).getData()).to.deep.eq([0,0,0,0]);
        expect(dataView.subView(Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR, Header.FLAG_POSITION.FIRST_MINIFAT_SECTOR + 4).getData()).to.deep.eq(ENDOFCHAIN_MARK);
        expect(dataView.subView(Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_MINIFAT_SECTORS + 4).getData()).to.deep.eq([0,0,0,0]);
        expect(dataView.subView(Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS, Header.FLAG_POSITION.NUMBER_OF_DIFAT_SECTORS + 4).getData()).to.deep.eq([0,0,0,0]);
        expect(dataView.subView(Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR, Header.FLAG_POSITION.FIRST_DIRECTORY_SECTOR + 4).getData()).to.deep.eq(ENDOFCHAIN_MARK);
    });
});