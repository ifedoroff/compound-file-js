import {FREESECT_MARK_OR_NOSTREAM, initializedWidth} from "../src/utils";
import {ColorFlag, DirectoryEntry, ObjectType} from "../src/directory/DirectoryEntry";
import {StreamDirectoryEntry} from "../src/directory/StreamDirectoryEntry";
import {mock} from "ts-mockito";
import {DirectoryEntryChain} from "../src/directory/DirectoryEntryChain";
import {StreamHolder} from "../src/stream/StreamHolder";
import {StorageDirectoryEntry} from "../src/directory/StorageDirectoryEntry";
import { expect } from "chai";
import {CompoundFile} from "../src/CompoundFile";
import exp = require("constants");

describe('Storage Directory Entry test', () => {
    let data: number[];
    let directoryEntryChainMock: DirectoryEntryChain;
    let streamHolderMock: StreamHolder;
    beforeEach(() => {
        data = initializedWidth(512, 0);
        data[DirectoryEntry.FLAG_POSITION.OBJECT_TYPE] = ObjectType.Storage;
        data[DirectoryEntry.FLAG_POSITION.COLOR_FLAG] = ColorFlag.BLACK;
        data.splice(DirectoryEntry.FLAG_POSITION.LEFT_SIBLING, 4, ...FREESECT_MARK_OR_NOSTREAM);
        data.splice(DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING, 4, ...FREESECT_MARK_OR_NOSTREAM);
        data.splice(DirectoryEntry.FLAG_POSITION.CHILD, 4, ...FREESECT_MARK_OR_NOSTREAM);
        directoryEntryChainMock = mock(DirectoryEntryChain);
        streamHolderMock = mock(StreamHolder);
    });

    it('adding children', () => {
        const compoundFile = new CompoundFile();
        const storage = compoundFile.getRootStorage();
        storage.addStream("a", [0]);
        storage.addStream("ab", [0]);
        storage.addStorage("b");
        expect(storage.getChild().getDirectoryEntryName()).eq("b");
        expect(storage.getChild().getLeftSibling().getDirectoryEntryName()).eq("a");
        expect(storage.getChild().getRightSibling().getDirectoryEntryName()).eq("ab");
        expect(storage.getChild().getColorFlag()).eq(ColorFlag.BLACK);
        expect(storage.getChild().getLeftSibling().getColorFlag()).eq(ColorFlag.RED);
        expect(storage.getChild().getRightSibling().getColorFlag()).eq(ColorFlag.RED);
    });

    it('find child', () => {
        const compoundFile = new CompoundFile();
        const rootStorage = compoundFile.getRootStorage();
        const storage1 = rootStorage.addStorage("storage1");
        rootStorage.addStorage("storage2");
        rootStorage.addStream("stream1", [1,2,3,4,5]);
        storage1.addStorage("storage11");
        storage1.addStream("stream11", [5,4,3,2,1]);
        expect(rootStorage.findChild((directoryEntry => directoryEntry.getDirectoryEntryName().toUpperCase() === "storage1".toUpperCase()))).not.eq(null);
        expect(rootStorage.findChild((directoryEntry => directoryEntry.getDirectoryEntryName().toUpperCase() === "storage2".toUpperCase()))).not.eq(null);
        expect(rootStorage.findChild<StreamDirectoryEntry>((directoryEntry => directoryEntry.getDirectoryEntryName().toUpperCase() === "stream1".toUpperCase())).getStreamData()).to.deep.eq([1,2,3,4,5]);
        expect(storage1.findChild<StreamDirectoryEntry>((directoryEntry => directoryEntry.getDirectoryEntryName().toUpperCase() === "stream11".toUpperCase())).getStreamData()).to.deep.eq([5,4,3,2,1]);
        expect(rootStorage.findChild(dirEntry => "missing" === dirEntry.getDirectoryEntryName())).eq(undefined);
    });

    it('find children', () => {
        const compoundFile = new CompoundFile();
        const rootStorage = compoundFile.getRootStorage();
        rootStorage.addStorage("storage1");
        rootStorage.addStorage("storage2");
        rootStorage.addStream("stream1", [1,2,3,4,5]);
        expect(rootStorage.findChildren((directoryEntry => directoryEntry instanceof StorageDirectoryEntry)).length).eq(2);
        expect(rootStorage.findChildren((directoryEntry => directoryEntry instanceof StreamDirectoryEntry)).length).eq(1);
    });

    it('all children method', () => {
        const compoundFile = new CompoundFile();
        const rootStorage = compoundFile.getRootStorage();
        rootStorage.addStorage("storage1");
        rootStorage.addStorage("storage2");
        rootStorage.addStream("stream1", [1,2,3,4,5]);
        rootStorage.addStream("stream2", [1,2,3,4,5]);
        rootStorage.addStream("stream3", [1,2,3,4,5]);
        expect(rootStorage.children().length).eq(5);
        expect(rootStorage.storages().length).eq(2);
        expect(rootStorage.streams().length).eq(3);
    });

});