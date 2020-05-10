import {CFDataview} from "../dataview/СFDataview";
import {DirectoryEntryChain} from "./DirectoryEntryChain";
import * as Long from 'long';
import "../Long";
import {
    addTrailingZeros,
    ENDOFCHAIN_MARK_INT,
    FREESECT_MARK_OR_NOSTREAM,
    initializedWidth, isEndOfChain, isFreeSectOrNoStream, toUTF16Bytes,
    toUTF16WithNoTrailingZeros
} from "../utils";
import {Color} from "../tree/Node";

export enum ColorFlag {
    RED = 0, BLACK = 1
}

export enum ObjectType {
    Storage = 1, Stream = 2, RootStorage = 5, Unknown = 0
}

export function toNodeColor(colorFlag: ColorFlag): Color {
    return colorFlag === ColorFlag.BLACK ? Color.BLACK : Color.RED;
}

export function toColorFlag(color: Color): ColorFlag {
    return color === Color.BLACK ? ColorFlag.BLACK : ColorFlag.RED;
}

export class DirectoryEntry{

    public static readonly ENTRY_LENGTH = 128;
    public static readonly ENTRY_NAME_MAXIMUM_LENGTH_UTF16_STRING = 31;
    public static readonly ENTRY_NAME_MAXIMUM_LENGTH = 64;
    protected view: CFDataview;
    private objectType: ObjectType;
    private colorFlag: ColorFlag;
    private id: number;
    protected directoryEntryChain: DirectoryEntryChain;

    static FLAG_POSITION = {

        DIRECTORY_ENTRY_NAME: 0,
        DIRECTORY_ENTRY_NAME_LENGTH: 64,
        OBJECT_TYPE: 66,
        COLOR_FLAG: 67,
        LEFT_SIBLING: 68,
        RIGHT_SIBLING: 72,
        CHILD: 76,
        CLSID: 80,
        STATE_BITS: 96,
        CREATION_TIME: 100,
        MODIFY_TIME: 108,
        STARTING_SECTOR_LOCATION: 116,
        STREAM_SIZE: 120,
    };

    constructor(id: number, directoryEntryChain: DirectoryEntryChain, view: CFDataview, name?: string, colorFlag?: ColorFlag , objectType?: ObjectType) {
        this.id = id;
        this.directoryEntryChain = directoryEntryChain;
        this.view = view;
        if(name == null) {
            if (view.getSize() !== DirectoryEntry.ENTRY_LENGTH)
                throw new Error();
            const nameLength = Long.fromBytesLE(view.subView(DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME_LENGTH, DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME_LENGTH + 2).getData()).toNumber();
            if (nameLength < 0 || nameLength > DirectoryEntry.ENTRY_NAME_MAXIMUM_LENGTH)
                throw new Error();
            this.objectType = view.subView(DirectoryEntry.FLAG_POSITION.OBJECT_TYPE, DirectoryEntry.FLAG_POSITION.OBJECT_TYPE + 1).getData()[0] as ObjectType;
            this.colorFlag = view.subView(DirectoryEntry.FLAG_POSITION.COLOR_FLAG, DirectoryEntry.FLAG_POSITION.COLOR_FLAG + 1).getData()[0] as ColorFlag;
            this.setStateBits(initializedWidth(4, 0));
            this.setCLSID(initializedWidth(16, 0));
            this.setModifiedTime(initializedWidth(8, 0));
            this.setCreationTime(initializedWidth(8, 0));
        } else {
            this.setObjectType(objectType);
            this.setColorFlag(colorFlag);
            const nameLength = name.length * 2 + 2;
            if(nameLength < 0 || nameLength > DirectoryEntry.ENTRY_NAME_MAXIMUM_LENGTH)
                throw new Error();
            this.setDirectoryEntryName(name);
            this.setLeftSibling(null);
            this.setRightSibling(null);
            view.subView(DirectoryEntry.FLAG_POSITION.STREAM_SIZE, DirectoryEntry.FLAG_POSITION.STREAM_SIZE + 8).writeAt(0, Long.fromValue(0).toBytesLE());
            this.setStreamStartingSector(ENDOFCHAIN_MARK_INT);
        }
    }

    compareTo(o: DirectoryEntry): number {
        const result = this.getDirectoryEntryName().length - o.getDirectoryEntryName().length;
        if(result === 0) {
            if(this.getDirectoryEntryName().toUpperCase() > o.getDirectoryEntryName().toUpperCase()) {
                return 1;
            } else if(this.getDirectoryEntryName().toUpperCase() < o.getDirectoryEntryName().toUpperCase()) {
                return -1;
            } else {
                return 0;
            }
        }
        return result;
    }

    setRightSibling(rightSibling: DirectoryEntry): void {
        if(rightSibling == null) {
            this.view.subView(DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING, DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING + 4).writeAt(0, FREESECT_MARK_OR_NOSTREAM);
        } else {
            this.view.subView(DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING, DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING + 4).writeAt(0, Long.fromValue(rightSibling.getId()).to4BytesLE());
        }
    }

    static setRightSibling(view: CFDataview, position: number) {
        view.subView(DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING, DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING + 4).writeAt(0, Long.fromValue(position).to4BytesLE());
    }

    setLeftSibling(leftSibling: DirectoryEntry): void {
        if(leftSibling == null) {
            this.view.subView(DirectoryEntry.FLAG_POSITION.LEFT_SIBLING, DirectoryEntry.FLAG_POSITION.LEFT_SIBLING + 4).writeAt(0, FREESECT_MARK_OR_NOSTREAM);
        } else {
            this.view.subView(DirectoryEntry.FLAG_POSITION.LEFT_SIBLING, DirectoryEntry.FLAG_POSITION.LEFT_SIBLING + 4).writeAt(0, Long.fromValue(leftSibling.getId()).to4BytesLE());
        }
    }

    static setLeftSibling(view: CFDataview, position: number) {
        view.subView(DirectoryEntry.FLAG_POSITION.LEFT_SIBLING, DirectoryEntry.FLAG_POSITION.LEFT_SIBLING + 4).writeAt(0, Long.fromValue(position).to4BytesLE());
    }

    setDirectoryEntryName(name: string): void {
        if(!name) {
            throw new Error("Directory Entry name should be non-null and non-empty string");
        }
        if(name.length > DirectoryEntry.ENTRY_NAME_MAXIMUM_LENGTH_UTF16_STRING) {
            throw new Error("Directory Entry name may contain 31 UTF-16 at most + NULL terminated character");
        }
        this.view
            .subView(DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME, DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME + DirectoryEntry.ENTRY_NAME_MAXIMUM_LENGTH)
            .writeAt(0, addTrailingZeros(toUTF16Bytes(name), DirectoryEntry.ENTRY_NAME_MAXIMUM_LENGTH));
        const lengthInBytesIncludingTerminatorSymbol = name.length;
        this.view
            .subView(DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME_LENGTH, DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME_LENGTH + 2)
            .writeAt(0, Long.fromValue(lengthInBytesIncludingTerminatorSymbol * 2 + 2).to2BytesLE());
    }

    getId(): number {
        return this.id;
    }

    getDirectoryEntryName(): string {
        return toUTF16WithNoTrailingZeros(
            this.view
                .subView(DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME, DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME + DirectoryEntry.ENTRY_NAME_MAXIMUM_LENGTH)
                .getData()
        );
    }

    getDirectoryEntryNameLength(): number {
        return Long.fromBytesLE(this.view
            .subView(DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME_LENGTH, DirectoryEntry.FLAG_POSITION.DIRECTORY_ENTRY_NAME_LENGTH + 2).getData()
        ).toNumber();
    }

    getDirectoryEntryNameLengthUTF8(): number {
        return (this.getDirectoryEntryNameLength() - 2)/2;
    }

    getChild(): DirectoryEntry {
        const childPosition = this.getChildPosition();
        return isFreeSectOrNoStream(childPosition) ? null : this.directoryEntryChain.getEntryById(childPosition);
    }

    protected getChildPosition(): number {
        return DirectoryEntry.getChildPosition(this.view);
    }

    static getChildPosition(view: CFDataview): number {
        return Long.fromBytesLE(view.subView(DirectoryEntry.FLAG_POSITION.CHILD, DirectoryEntry.FLAG_POSITION.CHILD + 4).getData()).toNumber();
    }

    private setObjectType(objectType: ObjectType): void {
        this.objectType = objectType;
        this.view
            .subView(DirectoryEntry.FLAG_POSITION.OBJECT_TYPE, DirectoryEntry.FLAG_POSITION.OBJECT_TYPE +1)
            .writeAt(0, [objectType]);
    }

    public getLeftSibling(): DirectoryEntry {
        const leftSiblingPosition = this.getLeftSiblingPosition();
        return isFreeSectOrNoStream(leftSiblingPosition) || isEndOfChain(leftSiblingPosition) ? null : this.directoryEntryChain.getEntryById(leftSiblingPosition);
    }
    getLeftSiblingPosition(): number {
        return DirectoryEntry.getLeftSiblingPosition(this.view);
    }

    static getLeftSiblingPosition(view: CFDataview): number {
        return Long.fromBytesLE(view.subView(DirectoryEntry.FLAG_POSITION.LEFT_SIBLING, DirectoryEntry.FLAG_POSITION.LEFT_SIBLING + 4).getData()).toNumber();
    }

    getRightSibling(): DirectoryEntry {
        const rightSiblingPosition = this.getRightSiblingPosition();
        return isFreeSectOrNoStream(rightSiblingPosition) ? null : this.directoryEntryChain.getEntryById(rightSiblingPosition);
    }

    getRightSiblingPosition(): number {
        return DirectoryEntry.getRightSiblingPosition(this.view);
    }

    static getRightSiblingPosition(view: CFDataview): number {
        return Long.fromBytesLE(view.subView(DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING, DirectoryEntry.FLAG_POSITION.RIGHT_SIBLING + 4).getData()).toNumber();
    }

    getStreamStartingSector(): number {
        return Long.fromBytesLE(this.view.subView(DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION, DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION + 4).getData()).toNumber();
    }

    setStreamStartingSector(startingSector: number): void {
        this.view
            .subView(DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION, DirectoryEntry.FLAG_POSITION.STARTING_SECTOR_LOCATION + 4)
            .writeAt(0, Long.fromValue(startingSector).to4BytesLE());
    }

    traverse(action: (d: DirectoryEntry) => void): void {
        action(this);
        this.getLeftSibling()?.traverse(action);
        this.getRightSibling()?.traverse(action);
        this.getChild()?.traverse(action);
    }

    getObjectType(): ObjectType {
        return this.objectType;
    }

    public getColorFlag(): ColorFlag {
        return this.colorFlag;
    }

    setColorFlag(colorFlag: ColorFlag): void {
        this.colorFlag = colorFlag;
        this.view
            .subView(DirectoryEntry.FLAG_POSITION.COLOR_FLAG, DirectoryEntry.FLAG_POSITION.COLOR_FLAG +1)
            .writeAt(0, [colorFlag]);
    }

    invertColor(): void {
        this.colorFlag === ColorFlag.BLACK ? this.setColorFlag(ColorFlag.RED) : this.setColorFlag(ColorFlag.BLACK);
    }

    setCLSID(bytes: number[]): void {
        this.view.subView(DirectoryEntry.FLAG_POSITION.CLSID, DirectoryEntry.FLAG_POSITION.CLSID + 16).writeAt(0, bytes);
    }

    setStateBits(bytes: number[]): void {
        this.view.subView(DirectoryEntry.FLAG_POSITION.STATE_BITS, DirectoryEntry.FLAG_POSITION.STATE_BITS + 4).writeAt(0, bytes);
    }

    setCreationTime(bytes: number[]): void {
        this.view.subView(DirectoryEntry.FLAG_POSITION.CREATION_TIME, DirectoryEntry.FLAG_POSITION.CREATION_TIME + 8).writeAt(0, bytes);
    }

    setModifiedTime(bytes: number[]): void {
        this.view.subView(DirectoryEntry.FLAG_POSITION.MODIFY_TIME, DirectoryEntry.FLAG_POSITION.MODIFY_TIME + 8).writeAt(0, bytes);
    }

    getCLSID(): number[] {
        return this.view.subView(DirectoryEntry.FLAG_POSITION.CLSID, DirectoryEntry.FLAG_POSITION.CLSID + 16).getData();
    }

    getStateBits(): number[] {
        return this.view.subView(DirectoryEntry.FLAG_POSITION.STATE_BITS, DirectoryEntry.FLAG_POSITION.STATE_BITS + 4).getData();
    }

    getCreationTime(): number[] {
        return this.view.subView(DirectoryEntry.FLAG_POSITION.CREATION_TIME, DirectoryEntry.FLAG_POSITION.CREATION_TIME + 8).getData();
    }

    getModifiedTime(): number[] {
        return this.view.subView(DirectoryEntry.FLAG_POSITION.MODIFY_TIME, DirectoryEntry.FLAG_POSITION.MODIFY_TIME + 8).getData();
    }

}
