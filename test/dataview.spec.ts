import { expect } from "chai";
import {SimpleDataview} from "../src/dataview/SimpleDataview";
import {FixedSizeChunkedDataview} from "../src/dataview/FixedSizeChunkedDataview";
import {VariableSizeChunkedDataView} from "../src/dataview/VarSizeChunkedDataview";

describe('should throw exception on overflow during write operation', () => {
    it('Simple Data View', () => {
        let view = new SimpleDataview(new Uint8Array(0));
        expect(() => view.writeAt(0, new Uint8Array([1]))).to.throw();
        view = new SimpleDataview(new Uint8Array(512));
        expect(() => view.writeAt(510, new Uint8Array(6))).to.throw();
    });

    it('Referencing Subview', () => {
        let view = new SimpleDataview(new Uint8Array(1)).subView(0, 1);
        expect(() => view.writeAt(1, new Uint8Array([1]))).to.throw();
        view = new SimpleDataview(new Uint8Array(512)).subView(510);
        expect(() => view.writeAt(0, new Uint8Array(6))).to.throw();
    });

    it('Fixed Size Chunked Dataview', () => {
        const view = new FixedSizeChunkedDataview(512,
        [new SimpleDataview(new Uint8Array(512)), new SimpleDataview(new Uint8Array(512))]);
        expect(() => view.writeAt(1024, new Uint8Array([1]))).to.throw();
        expect(() => view.writeAt(1020, new Uint8Array(6))).to.throw();
    });

    it('Var Size Chunked Dataview', () => {
        const view = new VariableSizeChunkedDataView(
            [new SimpleDataview(new Uint8Array(64)), new SimpleDataview(new Uint8Array(128))]
        );
        expect(() => view.writeAt(196, new Uint8Array([1]))).to.throw();
        expect(() => view.writeAt(190, new Uint8Array(6))).to.throw();
    });
});
describe('test allocate', () => {
    it('Simple Data View', () => {
        const view = new SimpleDataview(new Uint8Array(0));
        expect(() => view.allocate(1)).to.throw();
    });

    it('Referencing Subview', () => {
        const view = new SimpleDataview(new Uint8Array(1)).subView(0);
        expect(() => view.allocate(1)).to.throw();
    });

    it('Fixed Size Chunked Dataview', () => {
        const view = new FixedSizeChunkedDataview(64,
            [new SimpleDataview(new Uint8Array(64))]);
        expect(() => view.allocate(1)).to.throw();
        expect(() => view.allocate(64)).to.not.throw();
    });

    it('Var Size Chunked Dataview', () => {
        const view = new VariableSizeChunkedDataView([new SimpleDataview(new Uint8Array(0)), new SimpleDataview(new Uint8Array(0))]);
        expect(() => view.allocate(1)).to.throw();
    });
});

describe('test subview', () => {
    it('Simple Data View', () => {
        const view = new SimpleDataview(new Uint8Array(64));
        expect(() => view.subView(64)).to.throw();
        expect(() => view.subView(63, 65)).to.throw();
        expect(view.subView(0, 0).getSize()).eq(0);
        expect(view.subView(0, 64).getSize()).eq(64);
        expect(view.subView(0, 1).getSize()).eq(1);
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();
    });

    it('Referencing Subview', () => {
        const view = new SimpleDataview(new Uint8Array(1)).subView(0);
        expect(view.subView(0).getSize()).eq(1);
        expect(() => view.subView(1)).to.throw();
        expect(view.subView(0, 0).getSize()).eq(0);
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();
    });

    it('Fixed Size Chunked Dataview', () => {
        const view = new FixedSizeChunkedDataview(64,
            [new SimpleDataview(new Uint8Array(64)), new SimpleDataview(new Uint8Array(64))]);
        expect(() => view.subView(1)).to.throw();
        expect(() => view.subView(0, 0)).to.throw();
        expect(() => view.subView(63, 65)).to.throw();
        expect(() => view.subView(64)).to.throw();
        expect(() => view.subView(128).getSize()).to.throw();
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();
    });

    it('Var Size Chunked Dataview', () => {
        const view = new VariableSizeChunkedDataView([new SimpleDataview(new Uint8Array(64)), new SimpleDataview(new Uint8Array(32))]);
        expect(() => view.subView(96)).to.throw();
        expect(view.subView(32).getSize()).eq(64);
        expect(view.subView(0, 0).getSize()).eq(0);
        expect(view.subView(0).getSize()).eq(96);
        expect(view.subView(0, 96).getSize()).eq(96);
        expect(view.subView(0, 96).getSize()).eq(96);
        expect(() => view.subView(-1).getSize()).to.throw();
        expect(() => view.subView(1, 0).getSize()).to.throw();
    });
});