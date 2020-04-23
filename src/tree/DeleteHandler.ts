import {UpdateHandler} from "./UpdateHandler";
import {Color, TreeNode} from "./Node";
import {RedBlackTree} from "./RedBlackTree";

export class DeleteHandler<T> extends UpdateHandler<T> {
    private readonly comparator: (o1: T, o2: T) => number;

    constructor(tree: RedBlackTree<T>, comparator: (o1: T, o2: T) => number) {
        super(tree);
        this.comparator = comparator;
    }

    delete(node: TreeNode<T>): void {
        if(!node.hasChildren()) {
            if(this.tree.isRoot(node)) {
                this.tree.setRoot(null);
            } else {
                if (node.getColor() === Color.BLACK) {
                    const sibling = node.sibling();
                    node.getParent().deleteChild(node);
                    this.recover(sibling);
                } else {
                    node.getParent().deleteChild(node);
                }
            }
        } else if(node.hasTwoChildren()) {
            const substituteWith = this.inOrderPredecessor(node);
            this.swap(node, substituteWith);
            this.delete(node);
        } else {
            let substituteWith;
            if(node.getRightChild() == null) {
                substituteWith = node.getLeftChild();
            } else {
                substituteWith = node.getRightChild();
            }
            if(this.tree.isRoot(node)) {
                this.tree.setRoot(substituteWith);
                substituteWith.setColor(Color.BLACK);
            } else if(substituteWith.getColor() === Color.RED || node.getColor() === Color.RED) {
                node.getParent().substituteNode(node, substituteWith);
                substituteWith.setColor(Color.BLACK);
            } else {
                const sibling = node.sibling();
                node.getParent().substituteNode(node, substituteWith);
                this.recover(sibling);
            }
        }
    }

    inOrderPredecessor(node: TreeNode<T>): TreeNode<T> {
        if(node.getLeftChild() == null) {
            return null;
        } else {
            const allChildren = node.getLeftChild().getChildrenRecursive();
            allChildren.push(node.getLeftChild());
            allChildren.sort((a: TreeNode<T>, b: TreeNode<T>) => this.comparator(a.getValue(), b.getValue()));
            return allChildren[allChildren.length - 1];
        }
    }

    recover(sibling: TreeNode<T>): void {
        const siblingColor = sibling.getColor();
        const siblingsLeftChild = sibling.getLeftChild();
        const siblingsRightChild = sibling.getRightChild();
        const siblingLeftChildColor = siblingsLeftChild == null ? Color.BLACK : siblingsLeftChild.getColor();
        const siblingRightChildColor = siblingsRightChild == null ? Color.BLACK : siblingsRightChild.getColor();
        const isSiblingLeftChild = sibling.getParent().isLeftChild(sibling);
        if(siblingColor === Color.BLACK) {
            if(siblingLeftChildColor === Color.RED || siblingRightChildColor === Color.RED) {
                if(sibling.getParent().isLeftChild(sibling)) {
                    if(siblingLeftChildColor === Color.RED) {
                        this.rightRotate(sibling.getParent(), sibling);
                        siblingsLeftChild.setColor(Color.BLACK);
                    } else {
                        this.leftRotate(sibling, sibling.getRightChild());
                        this.rightRotate(sibling.grandParent(), sibling.getParent());
                        sibling.setColor(Color.BLACK);
                    }
                } else {
                    if(siblingRightChildColor === Color.RED) {
                        this.leftRotate(sibling.getParent(), sibling);
                        siblingsRightChild.setColor(Color.BLACK);
                    } else {
                        this.rightRotate(sibling, sibling.getLeftChild());
                        this.leftRotate(sibling.grandParent(), sibling.getParent());
                        sibling.setColor(Color.BLACK);
                    }
                }
            } else {
                sibling.setColor(Color.RED);
                const parent = sibling.getParent();
                if(parent.getColor() === Color.BLACK && !this.tree.isRoot(parent)) {
                    this.recover(parent.sibling());
                } else {
                    parent.setColor(Color.BLACK);
                }
            }
        } else {
            const parent = sibling.getParent();
            let newSibling;
            sibling.setColor(Color.BLACK);
            parent.setColor(Color.RED);
            if(isSiblingLeftChild) {
                newSibling = sibling.getRightChild();
                this.rightRotate(sibling.getParent(), sibling);
            } else {
                newSibling = sibling.getLeftChild();
                this.leftRotate(sibling.getParent(), sibling);
            }
            this.recover(newSibling);
        }
    }

    swap(node1: TreeNode<T>, node2: TreeNode<T>): void {
        if(node1.getParent() === node2) {
            this.swapChildParent(node2, node1);
        } else if(node2.getParent() === node1) {
            this.swapChildParent(node1, node2);
        } else {
            const node1Parent = node1.getParent();
            const node1LeftChild = node1.getLeftChild();
            const node1RightChild = node1.getRightChild();
            const node2Parent = node2.getParent();
            const node2LeftChild = node2.getLeftChild();
            const node2RightChild = node2.getRightChild();
            const node1Color = node1.getColor();
            const node2Color = node2.getColor();
            node1.setLeftChild(node2LeftChild);
            node1.setRightChild(node2RightChild);
            node2.setLeftChild(node1LeftChild);
            node2.setRightChild(node1RightChild);
            node1.setColor(node2Color);
            node2.setColor(node1Color);
            if(node1Parent == null) {
                this.tree.setRoot(node2);
            } else {
                node1Parent.substituteNode(node1, node2);
            }
            if(node2Parent == null) {
                this.tree.setRoot(node1);
            } else {
                node2Parent.substituteNode(node2, node1);
            }
        }
    }

    swapChildParent(parent: TreeNode<T>, child: TreeNode<T>): void {
        const parentColor = parent.getColor();
        const childColor = child.getColor();
        const leftGrandChild = child.getLeftChild();
        const rightGrandChild = child.getRightChild();
        const grandParent = parent.getParent();
        if(grandParent == null) {
            this.tree.setRoot(child);
        } else if(grandParent.isLeftChild(parent)) {
            grandParent.setLeftChild(child);
        } else {
            grandParent.setRightChild(child);
        }
        if(parent.isLeftChild(child)) {
            const rightChild = parent.getRightChild();
            child.setLeftChild(parent);
            child.setRightChild(rightChild);
        } else {
            const leftChild = parent.getLeftChild();
            child.setRightChild(parent);
            child.setLeftChild(leftChild);
        }
        child.setColor(parentColor);
        parent.setLeftChild(leftGrandChild);
        parent.setRightChild(rightGrandChild);
        parent.setColor(childColor);
    }
}
