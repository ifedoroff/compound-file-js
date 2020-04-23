import {CompoundFile} from "../src/CompoundFile";
import { expect, assert } from "chai";
import {RootStorageDirectoryEntry} from "../src/directory/RootStorageDirectoryEntry";

describe('compound file test', () => {
    it('create new', () => {
        const compoundFile = new CompoundFile();
        const rootStorage = compoundFile.getRootStorage();
        assert.isNull(rootStorage.getLeftSibling());
        assert.isNull(rootStorage.getRightSibling());
        assert.isNull(rootStorage.getChild());
        expect(rootStorage.getDirectoryEntryName()).eq(RootStorageDirectoryEntry.NAME);
        expect(rootStorage.getDirectoryEntryNameLengthUTF8()).eq(10);
    });

    it('rewrite compound file', () => {
        const compoundFile = new CompoundFile();
        const rootStorage = compoundFile.getRootStorage();
        rootStorage.addStorage("first");
        rootStorage.addStorage("second");
        rootStorage.addStream("stream1", [1,2,3,4]);
        const copy = compoundFile.rewrite();
        assert.isNotNull(copy.getRootStorage().findChild(dirEntry => "first" === dirEntry.getDirectoryEntryName()));
        assert.isNotNull(copy.getRootStorage().findChild(dirEntry => "second" === dirEntry.getDirectoryEntryName()));
        assert.isNotNull(copy.getRootStorage().findChild(dirEntry => "stream1" === dirEntry.getDirectoryEntryName()));
    });
});