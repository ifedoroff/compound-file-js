import { expect } from "chai";
import {CompoundFile} from "../src/CompoundFile";
import {initializedWidth} from "../src/utils";

describe('Stream Directory Entry test', () => {
    it('read mini stream data', () => {
        const compoundFile = new CompoundFile();
        const storage = compoundFile.getRootStorage().addStorage("test");
        const miniStream = storage.addStream("mini", [1, 2, 3, 4, 5, 6, 7]);
        expect(miniStream.read(2, 5)).to.deep.eq([3 ,4, 5]);

        const bytes = initializedWidth(65, 0);
        bytes[64] = 1;
        const miniStream1 = storage.addStream("mini1", bytes);
        expect(miniStream1.read(63, 65)).to.deep.eq([0, 1]);
    });

    it('read regular stream data', () => {
        const compoundFile = new CompoundFile();
        const storage = compoundFile.getRootStorage().addStorage("test");
        let bytes = initializedWidth(4096, 0);
        bytes[4093] = 2;
        bytes[4094] = 3;
        bytes[4095] = 4;
        const miniStream = storage.addStream("mini", bytes);
        expect(miniStream.read(4093, 4096)).to.deep.eq([2, 3, 4]);


        bytes = initializedWidth(4097, 0);
        bytes[4096] = 1;
        const miniStream1 = storage.addStream("mini1", bytes);
        expect(miniStream1.read(4095, 4097)).to.deep.eq([0, 1]);
    });

    it('writeAt method of mini stream', () => {
        const compoundFile = new CompoundFile();
        const storage = compoundFile.getRootStorage().addStorage("test");
        const finalMiniStream = storage.addStream("mini", [0, 1, 2, 3, 4, 5, 6, 7]);
        expect(() => finalMiniStream.writeAt(0, initializedWidth(9, 0))).throw();
        expect(() => finalMiniStream.writeAt(9, initializedWidth(1, 0))).throw();
        expect(() => finalMiniStream.writeAt(-1, initializedWidth(1, 0))).throw();
        finalMiniStream.writeAt(2, [15]);
        expect(finalMiniStream.read(2, 3)).to.deep.eq([15]);

        const miniStream1 = storage.addStream("mini1", initializedWidth(65, 0));
        miniStream1.writeAt(63, [1]);
        expect(miniStream1.read(63, 64)).to.deep.eq([1]);
        miniStream1.writeAt(64, [1]);
        expect(miniStream1.read(64, 65)).to.deep.eq([1]);
    });

    it('writeAt method of regular stream', () => {
        const compoundFile = new CompoundFile();
        const storage = compoundFile.getRootStorage().addStorage("test");
        const finalMiniStream = storage.addStream("mini", [0, 1, 2, 3, 4, 5, 6, 7]);
        expect(() => finalMiniStream.writeAt(0, initializedWidth(9, 0)));
        expect(() => finalMiniStream.writeAt(9, initializedWidth(1, 0)));
        expect(() => finalMiniStream.writeAt(-1, initializedWidth(1, 0)));
        const bytes = initializedWidth(4096, 0);
        finalMiniStream.setStreamData(bytes);
        expect(() => finalMiniStream.writeAt(0, initializedWidth(4097, 0)));
        expect(() => finalMiniStream.writeAt(4096, initializedWidth(1, 0)));
        expect(() => finalMiniStream.writeAt(-1, initializedWidth(1, 0)));
        finalMiniStream.writeAt(2, [15]);
        expect(finalMiniStream.read(2, 3)).to.deep.eq([15]);

        const miniStream1 = storage.addStream("mini1", initializedWidth(4097, 0));
        miniStream1.writeAt(4095, [1]);
        expect(miniStream1.read(4095, 4096)).to.deep.eq([1]);
        miniStream1.writeAt(4096, [1]);
        expect(miniStream1.read(4096, 4097)).to.deep.eq([1]);
    });

    it('append to mini stream', () => {
        const compoundFile = new CompoundFile();
        let mini = compoundFile.getRootStorage().addStream("mini", [0, 1, 2]);
        mini.append([3,4,5]);
        expect(mini.getStreamData()).to.deep.eq([0, 1,2,3,4,5]);
        mini = compoundFile.getRootStorage().addStream("mini1", initializedWidth(64, 1));
        mini.append([2,3,4]);
        expect(mini.getStreamSize()).eq(67);
        expect(mini.read(64, 67)).to.deep.eq([2,3,4]);
        mini = compoundFile.getRootStorage().addStream("mini2", initializedWidth(63, 1));
        mini.append([0]);
        expect(mini.getStreamSize()).eq(64);
        expect(mini.read(63, 64)).to.deep.eq([0]);
    });

    it('apend to regular stream', () => {
        const compoundFile = new CompoundFile();
        let mini = compoundFile.getRootStorage().addStream("mini", initializedWidth(4100, 0));
        mini.append([3,4,5]);
        expect(mini.getStreamSize()).eq(4103);
        expect(mini.read(4100, 4103)).to.deep.eq([3, 4, 5]);
        mini = compoundFile.getRootStorage().addStream("mini1", initializedWidth(4096, 1));
        mini.append([2,3,4]);
        expect(mini.getStreamSize()).eq(4099);
        expect(mini.read(4096, 4099)).to.deep.eq([2, 3, 4]);
        mini = compoundFile.getRootStorage().addStream("mini2", initializedWidth(63, 1));
        mini.append([0]);
        expect(mini.getStreamSize()).eq(64);
        expect(mini.read(63, 64)).to.deep.eq([0]);
    });

    it('append data so that mini stream converts to regular stream (this happens once stream passes threshold in 4096 bytes)', () => {
        const compoundFile = new CompoundFile();
        const miniStream = compoundFile.getRootStorage().addStream("mini", initializedWidth(4095, 0));
        miniStream.append([1]);
        // Previous operation should turn mini stream in a regular stream
        const regularStream = miniStream;
        expect(regularStream.getStreamData().length).eq(4096);
        expect(regularStream.read(4095, 4096)).to.deep.eq([1]);
    });
});