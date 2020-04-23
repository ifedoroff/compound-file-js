import {TreeNode} from "./Node";
import {RedBlackTree} from "./RedBlackTree";

export class UpdateHandler<T> {

     protected readonly tree: RedBlackTree<T>;

    constructor(tree: RedBlackTree<T>) {
        this.tree = tree;
    }

    rightRotate(subTreeRoot: TreeNode<T>, pivot: TreeNode<T>): void {
        const parent = subTreeRoot.getParent();
        if(parent == null) {
            subTreeRoot.setLeftChild(pivot.getRightChild());
            pivot.setRightChild(subTreeRoot);
            this.tree.setRoot(pivot);
        } else {
            const isLeftSubTree = parent.isLeftChild(subTreeRoot);
            subTreeRoot.setLeftChild(pivot.getRightChild());
            pivot.setRightChild(subTreeRoot);
            if(isLeftSubTree) {
                parent.setLeftChild(pivot);
            } else {
                parent.setRightChild(pivot);
            }
        }
        this.swapColor(subTreeRoot, pivot);
    }

    leftRotate(subTreeRoot: TreeNode<T>, pivot: TreeNode<T>): void {
        const parent = subTreeRoot.getParent();
        if(parent == null) {
            subTreeRoot.setRightChild(pivot.getLeftChild());
            pivot.setLeftChild(subTreeRoot);
            this.tree.setRoot(pivot);
        } else {
            const isLeftSubTree = parent.isLeftChild(subTreeRoot);
            subTreeRoot.setRightChild(pivot.getLeftChild());
            pivot.setLeftChild(subTreeRoot);
            if(isLeftSubTree) {
                parent.setLeftChild(pivot);
            } else {
                parent.setRightChild(pivot);
            }
        }
        this.swapColor(subTreeRoot, pivot);
    }

    swapColor(node1: TreeNode<T>, node2: TreeNode<T>): void {
        const node1Color = node1.getColor();
        node1.setColor(node2.getColor());
        node2.setColor(node1Color);
    }
}