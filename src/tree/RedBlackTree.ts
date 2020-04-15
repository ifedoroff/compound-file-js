import {Color, TreeNode} from "./Node";
import {InsertHandler} from "./InsertHandler";
import {DeleteHandler} from "./DeleteHandler";

export interface NodeFactory<N extends TreeNode<any, T>, T> {
    create(value: T, color: Color): N;
}

export class RedBlackTree<T, N extends TreeNode<N, T>> {

    private readonly insertHandler: InsertHandler<T, N>;
    private readonly deleteHandler: DeleteHandler<T, N>;
    private root: N = null;
    private readonly comparator: (o1: T, o2: T) => number;

    constructor(nodeFactory: NodeFactory<N, T>, comparator: (o1: T, o2: T) => number ) {
        this.insertHandler = new InsertHandler<T, N>(this, nodeFactory, comparator);
        this.deleteHandler = new DeleteHandler<T, N>(this, comparator);
        this.comparator = comparator;
    }

    delete(node: N): void {
        this.deleteHandler.delete(node);
    }

    insert(value: T): N {
        return this.insertHandler.insert(value);
    }

    findNode(value: T): N {
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

    getRoot(): N {
        return this.root;
    }

    hasRoot(): boolean {
        return this.root != null;
    }

    isRoot(node: N): boolean {
        return this.root === node;
    }


    setRoot(node: N): void {
        this.root = node;
        if(this.root != null) {
            this.root.setParent(null);
        }
    }
}
