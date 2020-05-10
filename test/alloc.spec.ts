import {Sectors} from "../src/Sectors";
import {instance, mock, verify, when} from "ts-mockito";
import {Header} from "../src/Header";
import {
    ENDOFCHAIN_MARK,
    ENDOFCHAIN_MARK_INT,
    FATSECT_MARK,
    FREESECT_MARK_OR_NOSTREAM,
    initializedWidth
} from "../src/utils";
import * as Long from "long";
import "../src/Long";
import {SimpleSector} from "../src/dataview/SimpleSector";
import {SimpleDataview} from "../src/dataview/SimpleDataview";
import {AllocationTable} from "../src/alloc/AllocationTable";
import { expect } from "chai";
import {FixedSizeChunkedDataview} from "../src/dataview/FixedSizeChunkedDataview";
import {FATtoDIFATFacade} from "../src/alloc/FATtoDIFATFacade";
import {FAT} from "../src/alloc/FAT";
import {MiniFAT} from "../src/alloc/MiniFAT";
import {DIFAT} from "../src/alloc/DIFAT";
import {DIFATSector} from "../src/dataview/DIFATSector";

describe('allocation table test', () => {
    let sectorsMock: Sectors;
    let header: Header;

    beforeEach(()=> {
        sectorsMock = mock(Sectors);
        const headerMock = mock(Header);
        when(headerMock.getSectorShift()).thenReturn(Header.HEADER_LENGTH);
        header = instance(headerMock);
    });

    it('test building a chain of sectors', () => {
        const firstSector = [];
        firstSector.push(...Long.fromValue(1).to4BytesLE());
        firstSector.push(...Long.fromValue(2).to4BytesLE());
        firstSector.push(...Long.fromValue(5).to4BytesLE());
        firstSector.push(...Long.fromValue(4).to4BytesLE());
        const secondSector = [];
        secondSector.push(...Long.fromValue(6).to4BytesLE());
        secondSector.push(...ENDOFCHAIN_MARK);
        secondSector.push(...ENDOFCHAIN_MARK);
        secondSector.push(...ENDOFCHAIN_MARK);
        when(sectorsMock.sector(0)).thenReturn(SimpleSector.from(new SimpleDataview(firstSector), 0));
        when(sectorsMock.sector(1)).thenReturn(SimpleSector.from(new SimpleDataview(secondSector), 1));
        const allocationTable = new AllocationTable(
            instance(sectorsMock),
            [0, 1],
            16);
        expect(allocationTable.buildChain(0).length).eq(4);
        expect(allocationTable.buildChain(0)).to.deep.eq([0,1,2,5]);
        expect(allocationTable.buildChain(3).length).eq(3);
        expect(allocationTable.buildChain(3)).to.deep.eq([3,4,6]);
    });

    it('allocate more than 128 FAT sectors (129 Sectors must be allocated in fact -- 1 additional is for storing 129th sector position)', () => {
        const sectors = new Sectors(new FixedSizeChunkedDataview(512), header);
        const allocationTable = new AllocationTable(sectors, [], header.getSectorShift());
        let previousSectorPosition = null;
        let firstSectorPosition = null;
        for (let i = 0; i < 129; i++) {
            const sectorPosition = sectors.allocate().getPosition();
            if(firstSectorPosition == null) {
                firstSectorPosition = sectorPosition;
            }
            allocationTable.registerSector(sectorPosition, previousSectorPosition);
            previousSectorPosition = sectorPosition;
        }
//        verify(fatToDIFATFacade, times(2)).registerFatSectorInDIFAT(anyInt());
        const chain = allocationTable.buildChain(firstSectorPosition);
        expect(chain.length).eq(129);
    });

    it('sector chain is empty if the parameter sectorPosition (position of the first sector in chain) is ENDOFCHAIN', () => {
        const sectors = new Sectors(new FixedSizeChunkedDataview(512), header);
        const allocationTable = new AllocationTable(sectors, [], header.getSectorShift());
        expect(allocationTable.buildChain(ENDOFCHAIN_MARK_INT).length).eq(0);
    });

});

describe('FAT test', () => {

    let faTtoDIFATFacade: FATtoDIFATFacade;

    beforeEach(() => {
        faTtoDIFATFacade = mock(FATtoDIFATFacade);
        when(faTtoDIFATFacade.getFatSectorChain()).thenReturn([]);
    });

    it('If first FAT sector is registered it\'s position should be written to Header also', () => {
        const rootView = new FixedSizeChunkedDataview(512);
        const header = Header.empty(rootView.allocate(Header.HEADER_LENGTH));
        const sectors = new Sectors(rootView, header);
        const fat = new FAT(sectors, header, instance(faTtoDIFATFacade));
        fat.registerSector(0, null);
        fat.registerSector(1, 0);
        expect(header.getNumberOfFatSectors()).eq(1);
        for (let i = 0; i < 128; i++) {
            fat.registerSector(i + 2, i + 1);
        }
        expect(header.getNumberOfFatSectors()).eq(2);
    });

    it('should properly register more than 128 sectors -- new Sector should be created to store next 128 positions', () => {
        const rootView = new FixedSizeChunkedDataview(512);
        const header = Header.empty(rootView.allocate(Header.HEADER_LENGTH));
        const sectors = new Sectors(new FixedSizeChunkedDataview(512), header);
        const sectorPositions: number[] = [];
        for (let i = 0; i < 129; i++) {
            sectorPositions.push(sectors.allocate().getPosition());
        }
        const allocationTable = new FAT(sectors, header, instance(faTtoDIFATFacade));
        allocationTable.registerSector(sectorPositions[0], null);
        for (let i = 1; i <sectorPositions.length; i++) {
            allocationTable.registerSector(sectorPositions[i], sectorPositions[i - 1]);
        }
        const fatSector = sectors.sector(129);
        for (let i = 0; i < sectorPositions.length - 1; i++) {
            expect(Long.fromBytesLE(fatSector.subView(i * 4, (i + 1) * 4).getData()).toNumber()).eq(sectorPositions[i + 1]);
        }
        expect(Long.fromBytesLE(fatSector.subView(508).getData()).toNumber()).eq(128);
        const secondFatSector = sectors.sector(130);
        expect(secondFatSector.subView(0, 4).getData()).to.deep.eq(ENDOFCHAIN_MARK);
        expect(secondFatSector.subView(4, 8).getData()).to.deep.eq(FATSECT_MARK);
        expect(secondFatSector.subView(8, 12).getData()).to.deep.eq(FATSECT_MARK);
    });

    it('test case when all sector positions (128) fit in one FAT sector', () => {
        const rootView = new FixedSizeChunkedDataview(512);
        const header = Header.empty(rootView.allocate(Header.HEADER_LENGTH));
        const sectors = new Sectors(new FixedSizeChunkedDataview(512), header);
        const sectorPositions: number[] = [];
        for (let i = 0; i < 128; i++) {
            sectorPositions.push(sectors.allocate().getPosition());
        }
        const allocationTable = new FAT(sectors, header, instance(faTtoDIFATFacade));
        allocationTable.registerSector(sectorPositions[0], null);
        for (let i = 1; i <sectorPositions.length; i++) {
            allocationTable.registerSector(sectorPositions[i], sectorPositions[i - 1]);
        }
        const fatSector = sectors.sector(128);
        for (let i = 0; i < sectorPositions.length - 2; i++) {
            expect(Long.fromBytesLE(fatSector.subView(i * 4, (i + 1) * 4).getData()).toNumber()).eq(sectorPositions[i + 1]);
        }
        expect(fatSector.subView(508).getData()).to.deep.eq(ENDOFCHAIN_MARK);
        const secondFATSector = sectors.sector(129);
        expect(secondFATSector.subView(0, 4).getData()).to.deep.eq(FATSECT_MARK);
        expect(secondFATSector.subView(4, 8).getData()).to.deep.eq(FATSECT_MARK);
    });
});

describe('DIFAT test', () => {

    let faTtoDIFATFacadeMock: FATtoDIFATFacade;
    let sectorsMock: Sectors;
    let headerMock: Header;

    beforeEach(() => {
        faTtoDIFATFacadeMock = mock(FATtoDIFATFacade);
        sectorsMock = mock(Sectors);
        headerMock = mock(Header);
        when(headerMock.getSectorShift()).thenReturn(Header.HEADER_LENGTH);
    });

    it('Read FAT sector chain when only DIFAT entries in Header exist', () => {
        const difatEntriesInHeader: number[] = [];
        for (let i = 0; i < 100; i++) {
            difatEntriesInHeader.push(i);
        }
        when(headerMock.getDifatEntries()).thenReturn(difatEntriesInHeader);
        when(headerMock.getFirstDifatSectorLocation()).thenReturn(Long.fromBytesLE(ENDOFCHAIN_MARK).toNumber());
        expect(new DIFAT(instance(sectorsMock), instance(headerMock), instance(faTtoDIFATFacadeMock)).getFatSectorChain().length).eq(100);
    });

    it('Read FAT sector chain when two DIFAT sectors exist + DIFAT entries in Header ', () => {
        const difatEntriesInHeader: number[] = [];
        for (let i = 0; i < Header.DIFAT_ENTRIES_LIMIT_IN_HEADER; i++) {
            difatEntriesInHeader.push(i);
        }
        when(headerMock.getDifatEntries()).thenReturn(difatEntriesInHeader);
        when(headerMock.getFirstDifatSectorLocation()).thenReturn(0);
        const sectors = new Sectors(new FixedSizeChunkedDataview(512), instance(headerMock));
        const firstSector = sectors.allocateDIFAT();
        for (let i = 0; i < 127; i++) {
            firstSector.subView(i * 4, (i + 1) * 4).writeAt(0, Long.fromValue(i).to4BytesLE())
        }
        firstSector.subView(508).writeAt(0, Long.fromValue(1).to4BytesLE());
        const secondSector = sectors.allocateDIFAT();
        secondSector.subView(0, 4).writeAt(0, Long.fromValue(0).to4BytesLE());
        secondSector.subView(508).writeAt(0, ENDOFCHAIN_MARK);
        expect(new DIFAT(sectors, instance(headerMock), instance(faTtoDIFATFacadeMock)).getFatSectorChain().length).eq(237);
    });

    it('register first FAT sector', () => {
        when(headerMock.canFitMoreDifatEntries()).thenReturn(true);
        when(headerMock.getFirstDifatSectorLocation()).thenReturn(Long.fromBytesLE(ENDOFCHAIN_MARK).toNumber());
        new DIFAT(instance(sectorsMock), instance(headerMock), instance(faTtoDIFATFacadeMock)).registerFATSector(1);
        verify(headerMock.registerFatSector(1)).times(1);
    });

    it('register FAT sector at position 436 (last DIFAT entry in Header)', () => {
        when(headerMock.canFitMoreDifatEntries()).thenReturn(true);
        when(headerMock.getFirstDifatSectorLocation()).thenReturn(Long.fromBytesLE(ENDOFCHAIN_MARK).toNumber());
        new DIFAT(instance(sectorsMock), instance(headerMock), instance(faTtoDIFATFacadeMock)).registerFATSector(1);
        verify(headerMock.registerFatSector(1)).times(1);
    });

    it('register FAT sector in first DIFAT sector (sector to store DIFAT entries following beyond those in Header)', () => {
        when(headerMock.canFitMoreDifatEntries()).thenReturn(false);
        when(headerMock.getFirstDifatSectorLocation()).thenReturn(Long.fromBytesLE(ENDOFCHAIN_MARK).toNumber());
        const sectorMock = mock(DIFATSector);
        when(sectorMock.getPosition()).thenReturn(1);
        when(sectorsMock.allocateDIFAT()).thenReturn(instance(sectorMock));
        new DIFAT(instance(sectorsMock), instance(headerMock), instance(faTtoDIFATFacadeMock)).registerFATSector(0);
        verify(sectorsMock.allocateDIFAT()).times(1);
        verify(faTtoDIFATFacadeMock.registerDifatSectorInFAT(1)).times(1);
        verify(sectorMock.registerFatSector(0)).times(1);
    });

    it('register 2 FAT sectors in the first DIFAT sector', () => {
        when(headerMock.getFirstDifatSectorLocation()).thenReturn(Long.fromBytesLE(ENDOFCHAIN_MARK).toNumber());
        when(headerMock.canFitMoreDifatEntries()).thenReturn(false);
        const sector = new DIFATSector(SimpleSector.from(new SimpleDataview(initializedWidth(512, 0)), 1, FREESECT_MARK_OR_NOSTREAM));
        when(sectorsMock.allocateDIFAT()).thenReturn(sector);

        const difat = new DIFAT(instance(sectorsMock), instance(headerMock), instance(faTtoDIFATFacadeMock));
        difat.registerFATSector(0);
        difat.registerFATSector(1);

        verify(sectorsMock.allocateDIFAT()).times(1);
        verify(faTtoDIFATFacadeMock.registerDifatSectorInFAT(1)).times(1);
        expect(Long.fromBytesLE(sector.subView(0, 4).getData()).toNumber()).eq(0);
        expect(Long.fromBytesLE(sector.subView(4, 8).getData()).toNumber()).eq(1);
        expect(sector.subView(8, 12).getData()).to.deep.eq(FREESECT_MARK_OR_NOSTREAM);
    });

    it('register 2 FAT sectors -- first going to DIFAT sector #1 and second to DIFAT sector #2 (check that additional DIFAT sector is created on overflow)', () => {
        when(headerMock.canFitMoreDifatEntries()).thenReturn(false);
        when(headerMock.getFirstDifatSectorLocation()).thenReturn(0);
        const sectors = new Sectors(new FixedSizeChunkedDataview(512), instance(headerMock));
        const firstSector = sectors.allocateDIFAT();
        for (let i = 0; i < 126; i++) {
            firstSector.subView(i * 4, (i + 1) * 4).writeAt(0, Long.fromValue(i).to4BytesLE());
        }
        const difat = new DIFAT(sectors, instance(headerMock), instance(faTtoDIFATFacadeMock));
        difat.registerFATSector(126);
        difat.registerFATSector(127);

        verify(faTtoDIFATFacadeMock.registerDifatSectorInFAT(1)).times(1);
        expect(Long.fromBytesLE(firstSector.subView(504, 508).getData()).toNumber()).eq(126);
        expect(Long.fromBytesLE(firstSector.subView(508).getData()).toNumber()).eq(1);
        expect(Long.fromBytesLE(sectors.sector(1).subView(0, 4).getData()).toNumber()).eq(127);
    });

    it('number of DIFAT sectors has to be stored in Header', () => {
        const rootView = new FixedSizeChunkedDataview(512);
        const header = Header.empty(rootView.allocate(Header.HEADER_LENGTH));
        const sectors = new Sectors(rootView, header);
        const difat = new DIFAT(sectors, header, instance(faTtoDIFATFacadeMock));
        for (let i = 0; i < Header.DIFAT_ENTRIES_LIMIT_IN_HEADER + 2; i++) {
            difat.registerFATSector(i);
        }
        expect(header.getFirstDifatSectorLocation()).gte(0);
        expect(header.getNumberOfDifatSectors()).eq(1);
    });

});

describe('Mini FAT test', () => {

    let faTtoDIFATFacadeMock: FATtoDIFATFacade;

    beforeEach(() => {
        faTtoDIFATFacadeMock = mock(FATtoDIFATFacade);
        when(faTtoDIFATFacadeMock.getFatSectorChain()).thenReturn([]);
    });

    it('Number of Mini FAT sectors should be written to Header', () => {
        const rootView = new FixedSizeChunkedDataview(512);
        const header = Header.empty(rootView.allocate(Header.HEADER_LENGTH));
        const sectors = new Sectors(rootView, header);
        const fat = new FAT(sectors, header, instance(faTtoDIFATFacadeMock));
        const  miniFAT = new MiniFAT(sectors, header, fat);
        miniFAT.registerSector(0, null);
        miniFAT.registerSector(1, 0);
        expect(header.getNumberOfMiniFatSectors()).eq(1);
        for (let i = 0; i < 128; i++) {
            miniFAT.registerSector(i+2, i+1);
        }
        expect(header.getNumberOfMiniFatSectors()).eq(2);
        expect(header.getFirstMinifatSectorLocation()).gte(0);
    })
});