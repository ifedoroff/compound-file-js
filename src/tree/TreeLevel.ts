import {Color, TreeNode} from "./Node";
import {NodeFactory} from "./RedBlackTree";

export class TreeLevel<T, N extends TreeNode<N, T>> {
    private parent: N;
    private readonly nodeFactory: NodeFactory<N, T>;

    constructor(parent: N, nodeFactory: NodeFactory<N, T>) {
        this.parent = parent;
        this.nodeFactory = nodeFactory;
    }

    left(value: T, color: Color, levelBuilder?: (level: TreeLevel<T, any>) => void): void {
        const node = new TreeNode<N, T>(value, color) as N;
        this.parent.setLeftChild(node);
        if (levelBuilder != null) {
            levelBuilder(new TreeLevel(node, this.nodeFactory));
        }
    }

    right(value: T, color: Color, levelBuilder?: (level: TreeLevel<T, any>) => void): void {
        const node = new TreeNode(value, color) as N;
        this.parent.setRightChild(node);
        if (levelBuilder != null) {
            levelBuilder(new TreeLevel(node, this.nodeFactory));
        }
    }

}