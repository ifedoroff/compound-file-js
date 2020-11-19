import {Header} from "./Header";
import {DIFAT} from "./alloc/DIFAT";
import {Sectors} from "./Sectors";
import {FAT} from "./alloc/FAT";
import {MiniFAT} from "./alloc/MiniFAT";
import {DirectoryEntryChain} from "./directory/DirectoryEntryChain";
import {CFDataview} from "./dataview/СFDataview";
import {FATtoDIFATFacade} from "./alloc/FATtoDIFATFacade";
import {MiniStreamRW} from "./stream/MiniStreamRW";
import {StreamHolder} from "./stream/StreamHolder";
import {RegularStreamRW} from "./stream/RegularStream";
import {StreamRW} from "./stream/StreamRW";
import {FixedSizeChunkedDataview} from "./dataview/FixedSizeChunkedDataview";
import {ENDOFCHAIN_MARK, ENDOFCHAIN_MARK_INT} from "./utils";
import { DirectoryEntry } from "./directory/DirectoryEntry";
import * as Long from "long";
import "./Long";
import {RootStorageDirectoryEntry} from "./directory/RootStorageDirectoryEntry";
import {StorageDirectoryEntry} from "./directory/StorageDirectoryEntry";
import {StreamDirectoryEntry} from "./directory/StreamDirectoryEntry";

export class CompoundFile {

    private readonly header: Header;
    private readonly difat: DIFAT;
    private readonly sectors: Sectors;
    private readonly fat: FAT;
    private readonly miniFat: MiniFAT;
    private readonly directoryEntryChain: DirectoryEntryChain;
    private dataView: CFDataview;

    public static fromBytes(bytes: number[]): CompoundFile {
        return new CompoundFile(new FixedSizeChunkedDataview(512, bytes));
    }

    public static fromUint8Array(bytes: Uint8Array): CompoundFile {
        return new CompoundFile(new FixedSizeChunkedDataview(512,  [].slice.call(bytes)));
    }

    constructor(dataView?: CFDataview) {
        const emptyFile = dataView == null;
        if(emptyFile) {
            dataView = CompoundFile.empty();
        }
        this.dataView = dataView;
        this.header = new Header(dataView.subView(0, Header.HEADER_LENGTH));
        this.sectors = new Sectors(dataView, this.header);
        const faTtoDIFATFacade = new FATtoDIFATFacade();
        this.difat = new DIFAT(this.sectors, this.header, faTtoDIFATFacade);
        faTtoDIFATFacade.setDifat(this.difat);
        this.fat = new FAT(this.sectors, this.header, faTtoDIFATFacade);
        faTtoDIFATFacade.setFat(this.fat);
        this.miniFat = new MiniFAT(this.sectors, this.header, this.fat);
        const miniStreamRW = new MiniStreamRW(this.miniFat, this.fat, this.getMiniStreamFirstSectorLocation(), this.getMiniStreamLength(), this.sectors, this.header);
        const me = this;
        const listenableMiniStream: StreamRW = {
            read: (startingSector: number, lengthOrFromIncl: number, toExcl?: number) => miniStreamRW.read(startingSector, lengthOrFromIncl, toExcl),

            write: (data: number[]) => {
                const firstSectorLocation = miniStreamRW.write(data);
                me.setMiniStreamFirstSectorLocation(miniStreamRW.getMiniStreamFirstSectorPosition());
                me.setMiniStreamLength(miniStreamRW.getMiniStreamLength());
                return firstSectorLocation;
            },

            writeAt: (startingSector: number, position: number, data: number[]) => miniStreamRW.writeAt(startingSector, position, data),

            append: (startingSector: number, currentSize: number, data: number[]) => {
                const firstSectorLocation = miniStreamRW.append(startingSector, currentSize, data);
                me.setMiniStreamFirstSectorLocation(miniStreamRW.getMiniStreamFirstSectorPosition());
                me.setMiniStreamLength(miniStreamRW.getMiniStreamLength());
                return firstSectorLocation;
            }
        };

        const streamReader = new StreamHolder(
            new RegularStreamRW(this.fat, this.sectors, this.header),
            listenableMiniStream,
            this.header.getMiniStreamCutoffSize()
        );

        this.directoryEntryChain = new DirectoryEntryChain(this.sectors, this.fat, this.header, streamReader);
        if(emptyFile) {
            this.directoryEntryChain.createRootStorage();
        }
    }

    private static empty(): CFDataview {
        const dataView = new FixedSizeChunkedDataview(Header.SECTOR_SHIFT_VERSION_3_INT);
        Header.empty(dataView.allocate(Header.HEADER_LENGTH));
        return dataView;
    }

    getMiniStreamFirstSectorLocation(): number {
        if(ENDOFCHAIN_MARK_INT === this.header.getFirstDirectorySectorLocation()) {
            return ENDOFCHAIN_MARK_INT;
        } else {
            return Long.fromBytesLE(this.sectors.sector(this.header.getFirstDirectorySectorLocation()).subView(DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION, DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION + 4).getData()).toNumber();
        }
    }

    getMiniStreamLength(): number {
        if(ENDOFCHAIN_MARK_INT === this.header.getFirstDirectorySectorLocation()) {
            return 0;
        } else {
            return Long.fromBytesLE(this.sectors.sector(this.header.getFirstDirectorySectorLocation()).subView(DirectoryEntry.FLAG_POSITION.STREAM_SIZE, DirectoryEntry.FLAG_POSITION.STREAM_SIZE + 4).getData()).toNumber();
        }
    }

    setMiniStreamFirstSectorLocation(position: number): void {
        this.sectors.sector(this.header.getFirstDirectorySectorLocation())
            .subView(DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION, DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION + 4)
            .writeAt(0, position >= 0 ? Long.fromValue(position).to4BytesLE() : ENDOFCHAIN_MARK);
    }

    setMiniStreamLength(size: number): void {
        this.sectors.sector(this.header.getFirstDirectorySectorLocation())
            .subView(DirectoryEntry.FLAG_POSITION.STREAM_SIZE, DirectoryEntry.FLAG_POSITION.STREAM_SIZE + 4)
            .writeAt(0, Long.fromValue(size).to4BytesLE());
    }

    getRootStorage(): RootStorageDirectoryEntry {
        return this.directoryEntryChain.getRootStorage();
    }

    asBytes(): number[] {
        return this.dataView.getData();
    }

    rewrite(): CompoundFile {
        const copy = new CompoundFile();
        const rootStorage = this.getRootStorage();
        const rootStorageCopy = copy.getRootStorage();
        rootStorage.eachChild(this.copyConsumer(rootStorageCopy));
        return copy;
    }

    private copyConsumer(this: CompoundFile, parent: StorageDirectoryEntry): (directoryEntry: DirectoryEntry) => void {
        const consumer = this.copyConsumer.bind(this);
        return (directoryEntry: DirectoryEntry) => {
            if(directoryEntry instanceof StorageDirectoryEntry) {
                const copy = parent.addStorage(directoryEntry.getDirectoryEntryName());
                directoryEntry.eachChild(consumer(copy));
            } else if (directoryEntry instanceof StreamDirectoryEntry) {
                parent.addStream(directoryEntry.getDirectoryEntryName(), directoryEntry.getStreamData());
            } else {
                throw new Error('Unsupported object type: ' + (typeof directoryEntry));
            }
        };
    }

}
