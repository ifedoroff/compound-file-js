import {DirectoryEntry, toColorFlag, toNodeColor} from "./DirectoryEntry";
import {Color, TreeNode} from "../tree/Node";

export class DirectoryEntryNode extends TreeNode<DirectoryEntry> {

    constructor(value: DirectoryEntry, color: Color) {
        super(value, color);
        this.setColor(color);
    }

    getLeftChild(): DirectoryEntryNode {
        let leftChild: DirectoryEntryNode = super.getLeftChild();
        if(leftChild == null && this.getValue().getLeftSibling() != null) {
            const directoryEntry = this.getValue().getLeftSibling();
            leftChild = new DirectoryEntryNode(directoryEntry, toNodeColor(directoryEntry.getColorFlag()));
            super.setLeftChild(leftChild);
        }
        if(leftChild != null && leftChild.getParent() == null) {
            leftChild.setParent(this);
        }
        return leftChild;
    }

    getRightChild(): DirectoryEntryNode {
        let rightChild: DirectoryEntryNode = super.getRightChild();
        if(rightChild == null && this.getValue().getRightSibling() != null) {
            const directoryEntry: DirectoryEntry = this.getValue().getRightSibling();
            rightChild = new DirectoryEntryNode(directoryEntry, toNodeColor(directoryEntry.getColorFlag()));
            super.setRightChild(rightChild);
        }
        if(rightChild != null && rightChild.getParent() == null) {
            rightChild.setParent(this);
        }
        return rightChild;
    }

    setLeftChild(leftChild: DirectoryEntryNode): void {
        super.setLeftChild(leftChild);
        this.getValue().setLeftSibling(leftChild == null ? null : leftChild.getValue());
    }

    setRightChild(rightChild: DirectoryEntryNode): void {
        super.setRightChild(rightChild);
        this.getValue().setRightSibling(rightChild == null ? null : rightChild.getValue());
    }

    deleteChild(node: DirectoryEntryNode): void {
        if(this.isLeftChild(node)) {
            this.getValue().setLeftSibling(null);
        } else if(this.isRightChild(node)) {
            this.getValue().setRightSibling(null);
        }
        super.deleteChild(node);
    }

    substituteNode(node: DirectoryEntryNode, substitute: DirectoryEntryNode): void {
        if(this.isRightChild(node)) {
            this.getValue().setRightSibling(substitute.getValue());
        } else if(this.isLeftChild(node)) {
            this.getValue().setLeftSibling(substitute.getValue());
        }
        super.substituteNode(node, substitute);
    }

    setColor(color: Color): void {
        super.setColor(color);
        this.getValue().setColorFlag(toColorFlag(color));
    }

    invertColor(): void {
        super.invertColor();
        this.getValue().invertColor();
    }
}