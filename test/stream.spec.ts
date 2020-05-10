import {instance, mock, when, verify, anything, capture} from "ts-mockito";
import {MiniFAT} from "../src/alloc/MiniFAT";
import {FAT} from "../src/alloc/FAT";
import {Sectors} from "../src/Sectors";
import {Header} from "../src/Header";
import {FREESECT_MARK_OR_NOSTREAM, initializedWidth} from "../src/utils";
import {MiniStreamRW} from "../src/stream/MiniStreamRW";
import {SimpleSector} from "../src/dataview/SimpleSector";
import {FixedSizeChunkedDataview} from "../src/dataview/FixedSizeChunkedDataview";
import { expect } from "chai";
import {RegularStreamRW} from "../src/stream/RegularStream";
import {Sector} from "../src/dataview/Sector";

describe('Mini Stream test', () => {
    let miniFATMock: MiniFAT;
    let fatMock: FAT;
    let sectorsMock: Sectors;
    let headerMock: Header;
    beforeEach(() => {
        miniFATMock = mock(MiniFAT);
        fatMock = mock(FAT);
        sectorsMock = mock(Sectors);
        headerMock = mock(Header);
        when(headerMock.getMiniSectorShift()).thenReturn(MiniStreamRW.MINI_STREAM_CHUNK_SIZE);
        when(headerMock.getSectorShift()).thenReturn(Header.HEADER_LENGTH);
    });

    it('read operation', () => {
        when(miniFATMock.buildChain(0)).thenReturn([0,1,2,3,4,5,6,7,8,9]);
        const firstSectorData = initializedWidth(Header.HEADER_LENGTH, 0);
        firstSectorData.splice(0, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 0));
        firstSectorData.splice(64, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 1));
        firstSectorData.splice(128, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 2));
        firstSectorData.splice(192, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 3));
        firstSectorData.splice(256, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 4));
        firstSectorData.splice(320, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 5));
        firstSectorData.splice(384, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 6));
        firstSectorData.splice(448, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 7));
        const firstSector = SimpleSector.from(new FixedSizeChunkedDataview(512, firstSectorData), 0);
        const secondSectorData = initializedWidth(Header.HEADER_LENGTH, 0);
        secondSectorData.splice(0, 64, ...initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 8));
        const secondSector = SimpleSector.from(new FixedSizeChunkedDataview(512, secondSectorData), 1);
        when(sectorsMock.sector(0)).thenReturn(firstSector);
        when(sectorsMock.sector(1)).thenReturn(secondSector);
        when(fatMock.buildChain(0)).thenReturn([0, 1]);
        const miniStreamRW = new MiniStreamRW(instance(miniFATMock), instance(fatMock), 0, 516, instance(sectorsMock), instance(headerMock));
        const result = miniStreamRW.read(0, 516);
        expect(result.length).eq(516);
        verify(miniFATMock.buildChain(0)).once();
        expect(result.slice(0, 64)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 0));
        expect(result.slice(64, 128)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 1));
        expect(result.slice(128, 192)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 2));
        expect(result.slice(192, 256)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 3));
        expect(result.slice(256, 320)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 4));
        expect(result.slice(320, 384)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 5));
        expect(result.slice(384, 448)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 6));
        expect(result.slice(448, 512)).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 7));
    });

    it('write of the first mini stream in the Mini Stream sector chain', () => {
        const sectors = new Sectors(new FixedSizeChunkedDataview(512), instance(headerMock));
        const miniStreamRW = new MiniStreamRW(instance(miniFATMock), instance(fatMock), -1, 0, sectors, instance(headerMock));
        const data = initializedWidth(Header.HEADER_LENGTH, 0);
        for (let i = 0; i < 520; i++) {
            data[i] = Math.floor(i / MiniStreamRW.MINI_STREAM_CHUNK_SIZE);
        }
        miniStreamRW.write(data);
        verify(fatMock.registerSector(0, null)).once();
        verify(fatMock.registerSector(1, 0)).once();
        verify(miniFATMock.registerSector(0, null)).once();
        verify(miniFATMock.registerSector(1, 0)).once();
        verify(miniFATMock.registerSector(2, 1)).once();
        verify(miniFATMock.registerSector(3, 2)).once();
        verify(miniFATMock.registerSector(4, 3)).once();
        verify(miniFATMock.registerSector(5, 4)).once();
        verify(miniFATMock.registerSector(6, 5)).once();
        verify(miniFATMock.registerSector(7, 6)).once();
        verify(miniFATMock.registerSector(8, 7)).once();
        const firstSector = sectors.sector(0);
        expect(firstSector.subView(0, 64).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 0));
        expect(firstSector.subView(64, 128).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 1));
        expect(firstSector.subView(128, 192).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 2));
        expect(firstSector.subView(192, 256).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 3));
        expect(firstSector.subView(256, 320).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 4));
        expect(firstSector.subView(320, 384).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 5));
        expect(firstSector.subView(384, 448).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 6));
        expect(firstSector.subView(448, 512).getData()).to.deep.eq(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 7));
        const secondSector = sectors.sector(1);
        expect(secondSector.subView(0,8).getData()).to.deep.eq(initializedWidth(8, 8));
        expect(miniStreamRW.getMiniStreamLength()).eq(9 * MiniStreamRW.MINI_STREAM_CHUNK_SIZE);
        expect(miniStreamRW.getMiniStreamFirstSectorPosition()).eq(0);
    });

    it('write of NOT first mini stream in the Mini Stream sector chain', () => {
        const sectors = new Sectors(new FixedSizeChunkedDataview(Header.HEADER_LENGTH), instance(headerMock));
        sectors.allocate();
        sectors.allocate();
        when(fatMock.buildChain(0)).thenReturn([0,1]);
        const miniStreamRW = new MiniStreamRW(instance(miniFATMock), instance(fatMock), 0, 10 * MiniStreamRW.MINI_STREAM_CHUNK_SIZE, sectors, instance(headerMock));
        const data = initializedWidth(512, 0);
        for (let i = 0; i < 520; i++) {
            data[i] = Math.floor(i/64);
        }
        miniStreamRW.write(data);
        verify(fatMock.registerSector(2, 1)).once();
        verify(miniFATMock.registerSector(10, null)).once();
        verify(miniFATMock.registerSector(11, 10)).once();
        verify(miniFATMock.registerSector(12, 11)).once();
        verify(miniFATMock.registerSector(13, 12)).once();
        verify(miniFATMock.registerSector(14, 13)).once();
        verify(miniFATMock.registerSector(15, 14)).once();
        verify(miniFATMock.registerSector(16, 15)).once();
        verify(miniFATMock.registerSector(17, 16)).once();
        verify(miniFATMock.registerSector(18, 17)).once();
        const sector1 = sectors.sector(1);
        // should be filled with FREESECT since it is default value for a newly allocated sector
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, FREESECT_MARK_OR_NOSTREAM)).to.deep.eq(sector1.subView(0, 64).getData());
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, FREESECT_MARK_OR_NOSTREAM)).to.deep.eq(sector1.subView(64, 128).getData());
        // here starts data written during test
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 0)).to.deep.eq(sector1.subView(128, 192).getData());
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 1)).to.deep.eq(sector1.subView(192, 256).getData());
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 2)).to.deep.eq(sector1.subView(256, 320).getData());
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 3)).to.deep.eq(sector1.subView(320, 384).getData());
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 4)).to.deep.eq(sector1.subView(384, 448).getData());
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 5)).to.deep.eq(sector1.subView(448, 512).getData());
        const sector2 = sectors.sector(2);
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 6)).to.deep.eq(sector2.subView(0, 64).getData());
        expect(initializedWidth(MiniStreamRW.MINI_STREAM_CHUNK_SIZE, 7)).to.deep.eq(sector2.subView(64, 128).getData());
        expect(initializedWidth(8, 8)).to.deep.eq(sector2.subView(128, 136).getData());
        // should be filled with FREESECT since it is default value for a newly allocated sector
        expect(initializedWidth(376, FREESECT_MARK_OR_NOSTREAM)).to.deep.eq(sector2.subView(136, 512).getData());
        expect(miniStreamRW.getMiniStreamLength()).eq(19 * MiniStreamRW.MINI_STREAM_CHUNK_SIZE);
        expect(miniStreamRW.getMiniStreamFirstSectorPosition()).eq(0);
    });
});

describe('Regular Stream test', () => {
    let fatMock: FAT;
    let sectorsMock: Sectors;
    let headerMock: Header;
    beforeEach(() => {
        fatMock = mock(FAT);
        sectorsMock = mock(Sectors);
        headerMock = mock(Header);
        when(headerMock.getSectorShift()).thenReturn(Header.HEADER_LENGTH);
    });

    it('read operation', () => {
        when(fatMock.buildChain(1)).thenReturn([1,2,3]);
        when(sectorsMock.sector(1))
            .thenReturn(SimpleSector.from(new FixedSizeChunkedDataview(Header.HEADER_LENGTH, initializedWidth(Header.HEADER_LENGTH, 1)), 1));
        when(sectorsMock.sector(2))
            .thenReturn(SimpleSector.from(new FixedSizeChunkedDataview(Header.HEADER_LENGTH, initializedWidth(Header.HEADER_LENGTH, 2)), 2));
        when(sectorsMock.sector(3))
            .thenReturn(SimpleSector.from(new FixedSizeChunkedDataview(Header.HEADER_LENGTH, initializedWidth(Header.HEADER_LENGTH, 3)), 3));
        const regularStreamRW = new RegularStreamRW(instance(fatMock), instance(sectorsMock), instance(headerMock));
        const result = regularStreamRW.read(1, 1300);
        expect(result.length).eq(1300);
        expect(initializedWidth(512, 1)).to.deep.eq(result.slice(0, 512));
        expect(initializedWidth(512, 2)).to.deep.eq(result.slice(512, 1024));
        expect(initializedWidth(276, 3)).to.deep.eq(result.slice(1024, 1300));
        verify(fatMock.buildChain(1)).once();
        verify(sectorsMock.sector(1)).once();
        verify(sectorsMock.sector(2)).once();
        verify(sectorsMock.sector(3)).once();
    });

    it('write operation', () => {
        const firstMock = mock<Sector>();
        when(firstMock.getPosition()).thenReturn(0);
        const first = instance(firstMock);
        const secondMock = mock<Sector>();
        when(secondMock.getPosition()).thenReturn(1);
        const second = instance(secondMock);
        const thirdMock = mock<Sector>();
        when(thirdMock.getPosition()).thenReturn(2);
        const third = instance(thirdMock);
        const fourthMock = mock<Sector>();
        when(fourthMock.getPosition()).thenReturn(3);
        const fourth = instance(fourthMock);
        when(sectorsMock.allocate())
            .thenReturn(first).thenReturn(second).thenReturn(third).thenReturn(fourth);
        const regularStreamRW = new RegularStreamRW(instance(fatMock), instance(sectorsMock), instance(headerMock));
        const data = initializedWidth(2000, 0);
        regularStreamRW.write(data);

        verify(firstMock.writeAt(0, anything())).once();
        verify(secondMock.writeAt(0, anything())).once();
        verify(thirdMock.writeAt(0, anything())).once();
        verify(fourthMock.writeAt(0, anything())).once();
        const [, bytes] = capture(fourthMock.writeAt).last();
        expect(bytes.length).eq(464);
        verify(sectorsMock.allocate()).times(4);
        verify(fatMock.registerSector(0, null)).once();
        verify(fatMock.registerSector(1, 0)).once();
        verify(fatMock.registerSector(2, 1)).once();
        verify(fatMock.registerSector(3, 2)).once();
    });
});