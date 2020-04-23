import {Color, TreeNode} from "./Node";
import {NodeFactory} from "./RedBlackTree";

export class TreeLevel<T> {
    private parent: TreeNode<T>;
    private readonly nodeFactory: NodeFactory<T>;

    constructor(parent: TreeNode<T>, nodeFactory: NodeFactory<T>) {
        this.parent = parent;
        this.nodeFactory = nodeFactory;
    }

    left(value: T, color: Color, levelBuilder?: (level: TreeLevel<T>) => void): void {
        const node = new TreeNode<T>(value, color);
        this.parent.setLeftChild(node);
        if (levelBuilder != null) {
            levelBuilder(new TreeLevel(node, this.nodeFactory));
        }
    }

    right(value: T, color: Color, levelBuilder?: (level: TreeLevel<T>) => void): void {
        const node = new TreeNode(value, color) as TreeNode<T>;
        this.parent.setRightChild(node);
        if (levelBuilder != null) {
            levelBuilder(new TreeLevel(node, this.nodeFactory));
        }
    }

}