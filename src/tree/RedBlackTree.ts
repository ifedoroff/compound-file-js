import {Color, TreeNode} from "./Node";
import {InsertHandler} from "./InsertHandler";
import {DeleteHandler} from "./DeleteHandler";

export interface NodeFactory<T> {
    create(value: T, color: Color): TreeNode<T>;
}

export class RedBlackTree<T> {

    private readonly insertHandler: InsertHandler<T>;
    private readonly deleteHandler: DeleteHandler<T>;
    private root: TreeNode<T> = null;
    private readonly comparator: (o1: T, o2: T) => number;

    constructor(nodeFactory: NodeFactory<T>, comparator: (o1: T, o2: T) => number ) {
        this.insertHandler = new InsertHandler<T>(this, nodeFactory, comparator);
        this.deleteHandler = new DeleteHandler<T>(this, comparator);
        this.comparator = comparator;
    }

    delete(node: TreeNode<T>): void {
        this.deleteHandler.delete(node);
    }

    insert(value: T): TreeNode<T> {
        return this.insertHandler.insert(value);
    }

    findNode(value: T): TreeNode<T> {
        if(this.root == null) {
            return null;
        } else {
            let nextNode = this.root;
            while(nextNode != null) {
                if(this.comparator(nextNode.getValue(), value) === 0) {
                    return nextNode;
                } else {
                    if(this.comparator(value,nextNode.getValue()) > 0) {
                        nextNode = nextNode.getRightChild();
                    } else {
                        nextNode = nextNode.getLeftChild();
                    }
                }
            }
            return null;
        }
    }

    getRoot(): TreeNode<T> {
        return this.root;
    }

    hasRoot(): boolean {
        return this.root != null;
    }

    isRoot(node: TreeNode<T>): boolean {
        return this.root === node;
    }


    setRoot(node: TreeNode<T>): void {
        this.root = node;
        if(this.root != null) {
            this.root.setParent(null);
        }
    }
}
