import {Header} from "../src/Header";
import {SimpleDataview} from "../src/dataview/SimpleDataview";
import {ENDOFCHAIN_MARK, FREESECT_MARK_OR_NOSTREAM, FREESECT_MARK_OR_NOSTREAM_INT, initializedWidth} from "../src/utils";
import {Sectors} from "../src/Sectors";
import {FixedSizeChunkedDataview} from "../src/dataview/FixedSizeChunkedDataview";
import { expect } from "chai";
import {dummyHeader} from "./header.spec";

describe('Sectors test', () => {
    let header: Header;
    beforeEach(() => {
        header = new Header(new SimpleDataview(dummyHeader()));
    });

    it('retrieve current number of sectors allocated', () => {
        const data = initializedWidth(4 * 512, 0);
        const sectors = new Sectors(new FixedSizeChunkedDataview(512, data), header);
        expect(sectors.sector(0)).not.eq(null);
        expect(sectors.sector(1)).not.eq(null);
        expect(sectors.sector(2)).not.eq(null);
        expect(sectors.sector(3)).not.eq(null);
        expect(() => sectors.sector(4)).to.throw();
    });

    it('allocation of the first sector', () => {
        const backedDataView = new FixedSizeChunkedDataview(512);
        const sectors = new Sectors(backedDataView, header);
        const allocated = sectors.allocate();
        expect(allocated).not.eq(null);
        expect(allocated.getData()).to.deep.eq(initializedWidth(512, FREESECT_MARK_OR_NOSTREAM));
        expect(backedDataView.getSize()).eq(Header.HEADER_LENGTH);
    });

    it('allocate FAT sector', () => {
        const backedDataView = new FixedSizeChunkedDataview(Header.HEADER_LENGTH, initializedWidth(Header.HEADER_LENGTH, 5));
        const sectors = new Sectors(backedDataView, header);
        const allocated = sectors.allocate();
        expect(allocated).not.eq(null);
        expect(allocated.getData()).to.deep.eq(initializedWidth(Header.HEADER_LENGTH, FREESECT_MARK_OR_NOSTREAM));
        expect(backedDataView.getSize()).eq(1024);
    });

    it('allocate DIFAT sector', () => {
        const backedDataView = new FixedSizeChunkedDataview(Header.HEADER_LENGTH, initializedWidth(Header.HEADER_LENGTH, 5));
        const sectors = new Sectors(backedDataView, header);
        const allocated = sectors.allocateDIFAT();
        expect(allocated).not.eq(null);
        const sample = initializedWidth(Header.HEADER_LENGTH, FREESECT_MARK_OR_NOSTREAM);
        sample.splice(508, 4, ...ENDOFCHAIN_MARK);
        expect(allocated.getData()).to.deep.eq(sample);
        expect(backedDataView.getSize()).eq(1024);
    })
});