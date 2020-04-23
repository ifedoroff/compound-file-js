import { expect } from "chai";
import {SimpleDataview} from "../src/dataview/SimpleDataview";
import {FixedSizeChunkedDataview} from "../src/dataview/FixedSizeChunkedDataview";
import {VariableSizeChunkedDataView} from "../src/dataview/VarSizeChunkedDataview";

describe('should throw exception on overflow during write operation', () => {
    it('Simple Data View', () => {
        let view = new SimpleDataview(new Array(0));
        expect(() => view.writeAt(0, [1])).to.throw();
        view = new SimpleDataview(new Array(512));
        expect(() => view.writeAt(510, new Array(6))).to.throw();
    });

    it('Referencing Subview', () => {
        let view = new SimpleDataview(new Array(1)).subView(0, 1);
        expect(() => view.writeAt(1,[1])).to.throw();
        view = new SimpleDataview(new Array(512)).subView(510);
        expect(() => view.writeAt(0, new Array(6))).to.throw();
    });

    it('Fixed Size Chunked Dataview', () => {
        const view = new FixedSizeChunkedDataview(512,
        [new SimpleDataview(new Array(512)), new SimpleDataview(new Array(512))]);
        expect(() => view.writeAt(1024, [1])).to.throw();
        expect(() => view.writeAt(1020, new Array(6))).to.throw();
    });

    it('Var Size Chunked Dataview', () => {
        const view = new VariableSizeChunkedDataView(
            [new SimpleDataview(new Array(64)), new SimpleDataview(new Array(128))]
        );
        expect(() => view.writeAt(196, [1])).to.throw();
        expect(() => view.writeAt(190, new Array(6))).to.throw();
    });
});
describe('test allocate', () => {
    it('Simple Data View', () => {
        const view = new SimpleDataview(new Array(0));
        expect(() => view.allocate(1)).to.throw();
    });

    it('Referencing Subview', () => {
        const view = new SimpleDataview(new Array(1)).subView(0);
        expect(() => view.allocate(1)).to.throw();
    });

    it('Fixed Size Chunked Dataview', () => {
        const view = new FixedSizeChunkedDataview(64,
            [new SimpleDataview(new Array(64))]);
        expect(() => view.allocate(1)).to.throw();
        expect(() => view.allocate(64)).to.not.throw();
    });

    it('Var Size Chunked Dataview', () => {
        const view = new VariableSizeChunkedDataView([new SimpleDataview(new Array(0)), new SimpleDataview(new Array(0))]);
        expect(() => view.allocate(1)).to.throw();
    });
});

describe('test subview', () => {
    it('Simple Data View', () => {
        const view = new SimpleDataview(new Array(64));
        expect(() => view.subView(64)).to.throw();
        expect(() => view.subView(63, 65)).to.throw();
        expect(view.subView(0, 0).getSize()).eq(0);
        expect(view.subView(0, 64).getSize()).eq(64);
        expect(view.subView(0, 1).getSize()).eq(1);
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();
    });

    it('Referencing Subview', () => {
        const view = new SimpleDataview(new Array(1)).subView(0);
        expect(view.subView(0).getSize()).eq(1);
        expect(() => view.subView(1)).to.throw();
        expect(view.subView(0, 0).getSize()).eq(0);
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();
    });

    it('Fixed Size Chunked Dataview', () => {
        const view = new FixedSizeChunkedDataview(64,
            [new SimpleDataview(new Array(64)), new SimpleDataview(new Array(64))]);
        expect(() => view.subView(1)).to.throw();
        expect(() => view.subView(0, 0)).to.throw();
        expect(() => view.subView(63, 65)).to.throw();
        expect(() => view.subView(64)).to.throw();
        expect(() => view.subView(128).getSize()).to.throw();
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();
    });

    it('Var Size Chunked Dataview', () => {
        let view = new VariableSizeChunkedDataView([new SimpleDataview(new Array(64)), new SimpleDataview(new Array(32))]);
        expect(() => view.subView(96)).to.throw();
        expect(view.subView(32).getSize()).eq(64);
        expect(view.subView(0, 0).getSize()).eq(0);
        expect(view.subView(0).getSize()).eq(96);
        expect(view.subView(0, 96).getSize()).eq(96);
        expect(view.subView(0, 96).getSize()).eq(96);
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();

        view = new VariableSizeChunkedDataView([new SimpleDataview(new Array(64))]);
        expect(view.subView(0).getSize()).eq(64);
        expect(view.subView(60).getSize()).eq(4);
        expect(view.subView(5, 10).getSize()).eq(5);
        expect(() => view.subView(64)).to.throw();
    });
});