import {ColorFlag, DirectoryEntry, ObjectType} from "./DirectoryEntry";
import {NodeFactory, RedBlackTree} from "../tree/RedBlackTree";
import {DirectoryEntryChain} from "./DirectoryEntryChain";
import {Color} from "../tree/Node";
import {CFDataview} from "../dataview/СFDataview";
import {DirectoryEntryNode} from "./DirectoryEntryNode";
import {StreamDirectoryEntry} from "./StreamDirectoryEntry";
import * as Long from "long";
import "../Long";

export class StorageDirectoryEntry extends DirectoryEntry {


    public static readonly NODE_FACTORY: NodeFactory<DirectoryEntry> = {
        create: (value: DirectoryEntry,  color: Color) => new DirectoryEntryNode(value, color)
    };

    protected readonly tree = new RedBlackTree(StorageDirectoryEntry.NODE_FACTORY, (o1: DirectoryEntry, o2: DirectoryEntry) => o1.compareTo(o2));

    constructor(id: number, directoryEntryChain: DirectoryEntryChain, view: CFDataview, name?: string, colorFlag?: ColorFlag , objectType: ObjectType = ObjectType.Storage) {
        super(id, directoryEntryChain, view, name, colorFlag, objectType);
        const child = this.getChild();
        if(child != null){
            this.tree.setRoot(new DirectoryEntryNode(child, Color.BLACK))
        }
    }

    setChildDirectoryEntry(entry: DirectoryEntry): void {
        this.view.subView(DirectoryEntry.FLAG_POSITION.CHILD, DirectoryEntry.FLAG_POSITION.CHILD + 4).writeAt(0, Long.fromValue(entry.getId()).to4BytesLE());
    }

    private addChild<T extends DirectoryEntry>(entry: DirectoryEntry): T {
        this.tree.insert(entry);
        this.setChildDirectoryEntry(this.tree.getRoot().getValue());
        return entry as T;
    }

    addStream(name: string, data: number[]): StreamDirectoryEntry {
        return this.addChild(this.directoryEntryChain.createStream(name, ColorFlag.RED, data));
    }

    addStorage(name: string): StorageDirectoryEntry {
        return this.addChild(this.directoryEntryChain.createStorage(name, ColorFlag.RED));
    }

    findChild<T extends DirectoryEntry>(predicate: (dirEntry: DirectoryEntry) => boolean) {
        let result: T;
        this.eachChild((directoryEntry: DirectoryEntry) => {
            if(predicate(directoryEntry)) {
                result = directoryEntry as T
            }
        }, predicate);
        return result;
    }

    findChildren(predicate: (dirEntry: DirectoryEntry) => boolean): DirectoryEntry[] {
        const children: DirectoryEntry[] = [];
        this.eachChild((directoryEntry: DirectoryEntry) => {
            if(predicate(directoryEntry)) {
                children.push(directoryEntry);
            }
        }, () => false);
        return children;
    }

    public children(): DirectoryEntry[] {
        const children: DirectoryEntry[] = [];
        this.eachChild((directoryEntry: DirectoryEntry) => {
            children.push(directoryEntry);
        });
        return children;
    }

    storages(): StorageDirectoryEntry[] {
        return this.children().filter((directoryEntry: DirectoryEntry) => directoryEntry instanceof StorageDirectoryEntry).map((directoryEntry: DirectoryEntry) => directoryEntry as StorageDirectoryEntry);
    }

    streams(): StreamDirectoryEntry[] {
        return this.children().filter((directoryEntry: DirectoryEntry) => directoryEntry instanceof StreamDirectoryEntry).map((directoryEntry: DirectoryEntry) => directoryEntry as StreamDirectoryEntry);
    }

    eachChild(consumer: (directoryEntry: DirectoryEntry) => void, stopPredicate?: (dirEntry: DirectoryEntry) => boolean) {
        if(stopPredicate == null) {
            stopPredicate = () => false;
        }
        const visitedNodes: number[] = [];
        let currentNode = this.tree.getRoot();
        if(currentNode == null) {
            return;
        }
        while(true) {
            if(currentNode != null && visitedNodes.indexOf(currentNode.getValue().getId()) === -1) {
                visitedNodes.push(currentNode.getValue().getId());
                consumer(currentNode.getValue());
                if(stopPredicate(currentNode.getValue())) {
                    break;
                }
            }
            const leftChild = currentNode.getLeftChild();
            if(leftChild != null && visitedNodes.indexOf(leftChild.getValue().getId()) === -1) {
                currentNode = currentNode.getLeftChild();
                continue;
            }
            const rightChild = currentNode.getRightChild();
            if(rightChild != null && visitedNodes.indexOf(rightChild.getValue().getId()) === -1) {
                currentNode = currentNode.getRightChild();
                continue;
            }
            const parent = currentNode.getParent();
            if(parent != null) {
                currentNode = currentNode.getParent();
                continue;
            }
            break;
        }
    }

}