import {Color, TreeNode} from "./Node";
import {NodeFactory, RedBlackTree} from "./RedBlackTree";
import {UpdateHandler} from "./UpdateHandler";

export class InsertHandler<T> extends UpdateHandler<T> {
    private readonly nodeFactory: NodeFactory<T>;
    private readonly comparator: (o1: T, o2: T) => number;

    constructor(tree: RedBlackTree<T>, nodeFactory: NodeFactory<T>, comparator: (o1: T, o2: T) => number) {
        super(tree);
        this.nodeFactory = nodeFactory;
        this.comparator = comparator;
    }

    insert(value: T): TreeNode<T> {
        const node = this.simpleInsert(value);
        if(!this.tree.isRoot(node) && !this.tree.isRoot(node.getParent())) {
            this.recolorAndRotateIfNeeded(node);
        }
        return node;
    }

    simpleInsert(value: T): TreeNode<T> {
        if(!this.tree.hasRoot()) {
            const node = this.nodeFactory.create(value, Color.BLACK);
            this.tree.setRoot(node);
            return node;
        } else {
            let currentNode = this.tree.getRoot();
            while(currentNode != null) {
                if(this.comparator(currentNode.getValue(),value) === 0) {
                    throw new Error("Equal values are not supported: " + value);
                } else {
                    if(this.comparator(value, currentNode.getValue()) < 0) {
                        if(currentNode.getLeftChild() == null) {
                            const node = this.nodeFactory.create(value, Color.RED);
                            currentNode.setLeftChild(node);
                            return node;
                        } else {
                            currentNode = currentNode.getLeftChild();
                        }
                    } else {
                        if(currentNode.getRightChild() == null) {
                            const node = this.nodeFactory.create(value, Color.RED);
                            currentNode.setRightChild(node);
                            return node;
                        } else {
                            currentNode = currentNode.getRightChild();
                        }
                    }
                }
            }
            throw new Error("Unexpected behaviour -- cannot find node location in the tree");
        }
    }

    recolorAndRotateIfNeeded(node: TreeNode<T> ): void {
        let grandChild = node;
        let parent = null;
        while(grandChild != null &&
            grandChild.getColor() === Color.RED &&
            grandChild.getParent() != null &&
            grandChild.getParent().getColor() === Color.RED) {
            parent = grandChild.getParent();
            const uncle = grandChild.uncle();
            const uncleColor = uncle == null ? Color.BLACK : uncle.getColor();
            switch (uncleColor) {
                case Color.BLACK:
                    this.rotateAndRecolorIfBlackScenario(grandChild);
                    break;
                case Color.RED:
                    this.recolorIfRedScenario(grandChild);
                    break;
                default:
                    throw new Error("Should not pass here");
            }
            grandChild = grandChild.grandParent();
        }
    }

    rotateSubtree(grandParent: TreeNode<T>, parent: TreeNode<T>, grandChild: TreeNode<T> ): void {
        if(grandParent.isLeftChild(parent) && parent.isLeftChild(grandChild)) {
            this.rightRotate(grandParent, parent);
        } else if(grandParent.isLeftChild(parent) && parent.isRightChild(grandChild)) {
            this.leftRotate(parent, grandChild);
            this.rightRotate(grandParent, grandChild);
            grandChild.setColor(Color.BLACK);
            grandParent.setColor(Color.RED);
        } else if(grandParent.isRightChild(parent) && parent.isRightChild(grandChild)) {
            this.leftRotate(grandParent, parent);
        } else {
            this.rightRotate(parent, grandChild);
            this.leftRotate(grandParent, grandChild);
            grandChild.setColor(Color.BLACK);
            grandParent.setColor(Color.RED);
        }
    }

    recolorAfterRotate(pivot: TreeNode<T> ): void {
        pivot.setColor(Color.BLACK);
        const leftChild = pivot.getLeftChild();
        if(leftChild != null) {
            leftChild.setColor(Color.RED);
        }
        const rightChild = pivot.getRightChild();
        if(rightChild != null) {
            rightChild.setColor(Color.RED);
        }
    }

    recolorIfRedScenario(grandChild: TreeNode<T> ): void {
        const uncle = grandChild.uncle();
        if(uncle != null) {
            uncle.setColor(Color.BLACK);
        }
        const parent = grandChild.getParent();
        if(parent != null) {
            parent.setColor(Color.BLACK);
        }
        const grandParent = grandChild.grandParent();
        if(grandParent != null) {
            if(this.tree.isRoot(grandParent)) {
                grandParent.setColor(Color.BLACK);
            } else {
                grandParent.setColor(Color.RED);
            }
        }
    }

    rotateAndRecolorIfBlackScenario(grandChild: TreeNode<T> ): void {
        const parent = grandChild.getParent();
        const grandParent = grandChild.grandParent();
        this.rotateSubtree(grandParent, parent, grandChild);
    }
}
