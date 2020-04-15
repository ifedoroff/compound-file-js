import {Color, TreeNode} from "./Node";
import {NodeFactory, RedBlackTree} from "./RedBlackTree";
import {TreeLevel} from "./TreeLevel";

export class TreeBuilder<T, N extends TreeNode<N, T>> {

    private readonly nodeFactory: NodeFactory<N, T>;
    private readonly tree: RedBlackTree<T, N>;

    constructor(nodeFactory: NodeFactory<N, T>, comparator: (o1: T, o2: T) => number) {
        this.tree = new RedBlackTree<T, N>(nodeFactory, comparator);
        this.nodeFactory = nodeFactory;
    }

    static empty<T, N extends TreeNode<N, T>>(nodeFactory: NodeFactory<N, T>, comparator: (o1: T, o2: T) => number): TreeBuilder<T, N> {
        return new TreeBuilder(nodeFactory, comparator);
    }

    setRootNode(value: T, levelBuilder?: (level: TreeLevel<T, any>) => void): TreeBuilder<T, N> {
        const node = new TreeNode<N, T>(value, Color.BLACK) as N;
        this.tree.setRoot(node);
        if(levelBuilder != null) {
            levelBuilder(new TreeLevel(node, this.nodeFactory));
        }
        return this;
    }

    build(): RedBlackTree<T, N> {
        return this.tree;
    }
}



