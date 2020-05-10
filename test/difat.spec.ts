import {Header} from "../src/Header";
import {SimpleDataview} from "../src/dataview/SimpleDataview";
import {initializedWidth} from "../src/utils";
import {Sectors} from "../src/Sectors";
import { expect } from "chai";
import * as Long from "long";
import "../src/Long"
import {SimpleSector} from "../src/dataview/SimpleSector";
import {DIFATSector} from "../src/dataview/DIFATSector";
import {
    mock,
    when
} from "ts-mockito";
import {FixedSizeChunkedDataview} from "../src/dataview/FixedSizeChunkedDataview";

function difatSector() {
    const header: Header = Header.empty(new SimpleDataview(initializedWidth(512, 0)));
    return new Sectors(new FixedSizeChunkedDataview(Header.SECTOR_SHIFT_VERSION_3_INT), header).allocateDIFAT();
}

describe('DIFAT test', () => {
    it('register new FAT sector', () => {
        const sector = difatSector();
        for (let i = 0; i < 127; i++) {
            sector.registerFatSector(i);
        }
        expect(() => sector.registerFatSector(127)).to.throw();
    });

    it('retrieve registered FAT sector', () => {
        const data = initializedWidth(Header.SECTOR_SHIFT_VERSION_3_INT, 0);
        for (let i = 0; i < 128; i++) {
            data.splice(i * 4, 4, ...Long.fromValue(i).to4BytesLE());
        }
        const sector = new DIFATSector(SimpleSector.from(new SimpleDataview(data), 0));
        expect(127).eq(sector.getRegisteredFatSectors().length);
    });

    it('register DIFAT sector', () => {
        const sector = difatSector();
        sector.registerNextDifatSector(1);
        expect(sector.subView(508).getData()).to.deep.eq(Long.fromValue(1).to4BytesLE());
    });
});