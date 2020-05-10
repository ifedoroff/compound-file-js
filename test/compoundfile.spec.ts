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

    it('save and the read', () => {
        const compoundFile = new CompoundFile();
        const rootStorage = compoundFile.getRootStorage();
        const storage1 = rootStorage.addStorage("storage1");
        let storage2 = rootStorage.addStorage("storage2");
        rootStorage.addStream("stream1", [1,2,3,4]);
        storage2.addStream("stream2", [1,2,3,4]);
        let storage21 = storage2.addStorage("storage21");
        storage21.addStorage("storage211");
        const copy = CompoundFile.fromBytes(compoundFile.asBytes());
        expect(copy.getRootStorage().storages().length).eq(2);
        assert.isNotNull(copy.getRootStorage().findChild(dirEntry => "storage1" === dirEntry.getDirectoryEntryName()));
        storage2 = copy.getRootStorage().findChild(dirEntry => "storage2" === dirEntry.getDirectoryEntryName());
        assert.isNotNull(storage2);
        expect(storage2.children().length).eq(2);
        storage21 = storage2.findChild(dirEntry => "storage21" === dirEntry.getDirectoryEntryName());
        assert.isNotNull(storage2);
        expect(storage21.children().length).eq(1);
    });
});