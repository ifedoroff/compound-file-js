import {Color, TreeNode} from "./Node";
import {NodeFactory, RedBlackTree} from "./RedBlackTree";
import {TreeLevel} from "./TreeLevel";

export class TreeBuilder<T> {

    private readonly nodeFactory: NodeFactory<T>;
    private readonly tree: RedBlackTree<T>;

    constructor(nodeFactory: NodeFactory<T>, comparator: (o1: T, o2: T) => number) {
        this.tree = new RedBlackTree<T>(nodeFactory, comparator);
        this.nodeFactory = nodeFactory;
    }

    static empty<T>(nodeFactory: NodeFactory<T>, comparator: (o1: T, o2: T) => number): TreeBuilder<T> {
        return new TreeBuilder(nodeFactory, comparator);
    }

    setRootNode(value: T, levelBuilder?: (level: TreeLevel<T>) => void): TreeBuilder<T> {
        const node = new TreeNode<T>(value, Color.BLACK);
        this.tree.setRoot(node);
        if(levelBuilder != null) {
            levelBuilder(new TreeLevel(node, this.nodeFactory));
        }
        return this;
    }

    build(): RedBlackTree<T> {
        return this.tree;
    }
}