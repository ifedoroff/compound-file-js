import {StorageDirectoryEntry} from "./StorageDirectoryEntry";
import {DirectoryEntryChain} from "./DirectoryEntryChain";
import {CFDataview} from "../dataview/СFDataview";
import {ColorFlag, DirectoryEntry, ObjectType} from "./DirectoryEntry";
import {Color} from "../tree/Node";
import {DirectoryEntryNode} from "./DirectoryEntryNode";

export class RootStorageDirectoryEntry extends StorageDirectoryEntry {

    static readonly NAME = "Root Entry";
    public static readonly ID = 0;

    constructor(id: number, directoryEntryChain: DirectoryEntryChain, view: CFDataview, name?: string, colorFlag?: ColorFlag , objectType: ObjectType = ObjectType.Storage) {
        super(id, directoryEntryChain, view, name, colorFlag, objectType);
        const child = this.getChild();
        if(child != null) {
            this.tree.setRoot(new DirectoryEntryNode(child, Color.BLACK));
        }
    }

    getChild(): DirectoryEntry {
        if(this.getChildPosition() === RootStorageDirectoryEntry.ID) {
            throw new Error("Root Entry child cannot have ID == 0");
        }
        return super.getChild();
    }

    setRightSibling(rightSibling: DirectoryEntry): void {
        if(rightSibling != null) {
            throw new Error("Root Storage cannot have siblings");
        }
    }

    setLeftSibling(leftSibling: DirectoryEntry): void {
        if(leftSibling != null) {
            throw new Error("Root Storage cannot have siblings");
        }
    }

    setDirectoryEntryName(name: string): void {
        if("Root Entry" !== name) {
            throw new Error(`Name of Root Storage directory entry is always ${RootStorageDirectoryEntry.NAME}`);
        }
        super.setDirectoryEntryName(name);
    }
}