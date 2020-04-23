import {expect} from "chai";
import {NodeFactory, RedBlackTree} from "../src/tree/RedBlackTree";
import {Color, TreeNode} from "../src/tree/Node";
import {TreeBuilder} from "../src/tree/TreeBuilder";
import "../src/Long"

const nodeFactory: NodeFactory<number> = {
    create: (value: number, color: Color) => new TreeNode<number>(value, color)
};

const comparator = (o1: number, o2: number) => o1 - o2;

describe('insert nodes in red black tree', () => {
    it('insert root', () => {
        const tree = new RedBlackTree<number>(nodeFactory, comparator);
        tree.insert(1);
        expect(tree.getRoot().getColor()).eq(Color.BLACK);
    });

    it('insert mostly left', () => {
        const tree = new RedBlackTree<number>(nodeFactory, comparator);
        tree.insert(10);
        expect(tree.getRoot().getColor()).eq(Color.BLACK);

        tree.insert(20);
        expect(tree.getRoot().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getRightChild().getValue()).eq(20);

        tree.insert(30);
        expect(tree.getRoot().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getValue()).eq(20);
        expect(tree.getRoot().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getRightChild().getValue()).eq(30);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getValue()).eq(10);

        tree.insert(15);
        expect(tree.getRoot().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getValue()).eq(20);
        expect(tree.getRoot().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getValue()).eq(30);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getValue()).eq(10);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(15);

        tree.insert(18);
        expect(tree.getRoot().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getValue()).eq(20);
        expect(tree.getRoot().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getValue()).eq(30);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getValue()).eq(15);
        expect(tree.getRoot().getLeftChild().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getLeftChild().getValue()).eq(10);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(18);

        tree.insert(9);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getValue()).eq(15);
        expect(tree.getRoot().getLeftChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getLeftChild().getValue()).eq(10);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(18);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getValue()).eq(9);

        tree.insert(8);
        expect(tree.getRoot().getLeftChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getLeftChild().getValue()).eq(9);
        expect(tree.getRoot().getLeftChild().getLeftChild().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getLeftChild().getRightChild().getValue()).eq(10);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getValue()).eq(8);

        tree.insert(7);

        expect(tree.getRoot().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getValue()).eq(15);
        expect(tree.getRoot().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getRightChild().getValue()).eq(20);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getValue()).eq(9);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(10);
        expect(tree.getRoot().getLeftChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getLeftChild().getValue()).eq(8);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getValue()).eq(7);
        expect(tree.getRoot().getRightChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getRightChild().getValue()).eq(30);
        expect(tree.getRoot().getRightChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getLeftChild().getValue()).eq(18);

        tree.insert(6);
        tree.insert(5);
        tree.insert(4);
        tree.insert(3);

        expect(tree.getRoot().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getValue()).eq(15);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getValue()).eq(7);
        expect(tree.getRoot().getLeftChild().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getLeftChild().getValue()).eq(5);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(9);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getValue()).eq(4);
        expect(tree.getRoot().getLeftChild().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getLeftChild().getRightChild().getValue()).eq(6);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getLeftChild().getLeftChild().getLeftChild().getValue()).eq(3);
        expect(tree.getRoot().getLeftChild().getRightChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getRightChild().getLeftChild().getValue()).eq(8);
        expect(tree.getRoot().getLeftChild().getRightChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getRightChild().getRightChild().getValue()).eq(10);

    });

    it('insert mostly right', () => {
        const tree = new RedBlackTree<number>(nodeFactory, comparator);
        tree.insert(1);
        tree.insert(2);
        tree.insert(3);
        tree.insert(4);
        tree.insert(5);
        tree.insert(6);
        tree.insert(7);
        tree.insert(8);
        tree.insert(9);
        tree.insert(10);

        expect(tree.getRoot().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getValue()).eq(4);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getValue()).eq(2);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(3);
        expect(tree.getRoot().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getValue()).eq(6);
        expect(tree.getRoot().getRightChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getLeftChild().getValue()).eq(5);
        expect(tree.getRoot().getRightChild().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getRightChild().getRightChild().getValue()).eq(8);
        expect(tree.getRoot().getRightChild().getRightChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getRightChild().getLeftChild().getValue()).eq(7);
        expect(tree.getRoot().getRightChild().getRightChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getRightChild().getRightChild().getValue()).eq(9);
        expect(tree.getRoot().getRightChild().getRightChild().getRightChild().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getRightChild().getRightChild().getRightChild().getRightChild().getValue()).eq(10);
    });

    it('insert chaotic', () => {
        const tree = new RedBlackTree<number>(nodeFactory, comparator);
        tree.insert(1);
        expect(
            TreeBuilder.empty(nodeFactory, comparator).setRootNode(1).build()
        ).to.deep.eq(tree);
        tree.insert(10);
        tree.insert(2);
        expect(tree).to.deep.eq(TreeBuilder.empty(nodeFactory, comparator).setRootNode(2, (treeLevel) => {
            treeLevel.left(1, Color.RED);
            treeLevel.right(10, Color.RED);
        }).build());
        tree.insert(9);
        tree.insert(3);
        expect(tree).to.deep.eq(TreeBuilder.empty(nodeFactory, comparator).setRootNode(2, treeLevel => {
            treeLevel.left(1, Color.BLACK);
            treeLevel.right(9, Color.BLACK, treeLevel1 => {
                treeLevel1.left(3, Color.RED);
                treeLevel1.right(10, Color.RED);
            });
        }).build());

        tree.insert(8);
        tree.insert(4);
        tree.insert(7);

        expect(tree).to.deep.eq(TreeBuilder.empty(nodeFactory, comparator).setRootNode(4, treeLevel => {
            treeLevel.left(2, Color.RED, treeLevel1 => {
                treeLevel1.left(1, Color.BLACK);
                treeLevel1.right(3, Color.BLACK);
            });
            treeLevel.right(9, Color.RED, treeLevel1 => {
                treeLevel1.left(8, Color.BLACK, levelBuilder => {
                    levelBuilder.left(7, Color.RED);
                });
                treeLevel1.right(10, Color.BLACK);
            });
        }).build());

        tree.insert(5);
        tree.insert(6);

    });

});

describe('delete nodes of red black tree', () => {
    it('simple delete', () => {
        const tree = new RedBlackTree<number>(nodeFactory, comparator);
        for (let i = 1; i < 9; i++) {
            tree.insert(i);
        }
        tree.delete(tree.findNode(8));
        expect(tree.getRoot().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getValue()).eq(4);
        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getValue()).eq(2);
        expect(tree.getRoot().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getRightChild().getValue()).eq(6);
        expect(tree.getRoot().getRightChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getLeftChild().getValue()).eq(5);
        expect(tree.getRoot().getRightChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getRightChild().getValue()).eq(7);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getLeftChild().getValue()).eq(1);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(3);

        tree.delete(tree.findNode(7));

        expect(tree.getRoot().getRightChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getRightChild().getValue()).eq(6);
        expect(tree.getRoot().getRightChild().getLeftChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getRightChild().getLeftChild().getValue()).eq(5);

        tree.delete(tree.findNode(2));

        expect(tree.getRoot().getLeftChild().getColor()).eq(Color.BLACK);
        expect(tree.getRoot().getLeftChild().getValue()).eq(1);
        expect(tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.RED);
        expect(tree.getRoot().getLeftChild().getRightChild().getValue()).eq(3);
    });

    it('chaotic delete', () => {
        const tree = new RedBlackTree<number>(nodeFactory, comparator);
        tree.insert(1);
        tree.insert(10);
        tree.insert(2);
        tree.insert(9);
        tree.insert(3);
        tree.insert(8);
        tree.insert(4);
        tree.insert(7);
        tree.insert(5);
        tree.insert(6);

        tree.delete(tree.findNode(9));

        expect( tree.getRoot().getRightChild().getColor()).eq(Color.BLACK);
        expect( tree.getRoot().getRightChild().getValue()).eq(8);
        expect( tree.getRoot().getLeftChild().getColor()).eq(Color.BLACK);
        expect( tree.getRoot().getLeftChild().getValue()).eq(2);
        expect( tree.getRoot().getLeftChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect( tree.getRoot().getLeftChild().getLeftChild().getValue()).eq(1);
        expect( tree.getRoot().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect( tree.getRoot().getLeftChild().getRightChild().getValue()).eq(3);
        expect( tree.getRoot().getRightChild().getLeftChild().getColor()).eq(Color.RED);
        expect( tree.getRoot().getRightChild().getLeftChild().getValue()).eq(6);
        expect( tree.getRoot().getRightChild().getRightChild().getColor()).eq(Color.BLACK);
        expect( tree.getRoot().getRightChild().getRightChild().getValue()).eq(10);
        expect( tree.getRoot().getRightChild().getLeftChild().getLeftChild().getColor()).eq(Color.BLACK);
        expect( tree.getRoot().getRightChild().getLeftChild().getLeftChild().getValue()).eq(5);
        expect( tree.getRoot().getRightChild().getLeftChild().getRightChild().getColor()).eq(Color.BLACK);
        expect( tree.getRoot().getRightChild().getLeftChild().getRightChild().getValue()).eq(7);

        tree.delete(tree.findNode(2));

        let sample = TreeBuilder.empty(nodeFactory, comparator).setRootNode(6, levelBuilder => {
            levelBuilder.left(4, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(1, Color.BLACK, levelBuilder2 => {
                    levelBuilder2.right(3, Color.RED);
                });
                levelBuilder1.right(5, Color.BLACK);
            });
            levelBuilder.right(8, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(7, Color.BLACK);
                levelBuilder1.right(10, Color.BLACK);
            });
        }).build();
        expect(tree).to.deep.eq(sample);

        tree.delete(tree.findNode(5));

        sample = TreeBuilder.empty(nodeFactory, comparator).setRootNode(6, levelBuilder => {
            levelBuilder.left(3, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(1, Color.BLACK);
                levelBuilder1.right(4, Color.BLACK);
            });
            levelBuilder.right(8, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(7, Color.BLACK);
                levelBuilder1.right(10, Color.BLACK);
            });
        }).build();
        expect( tree).to.deep.eq(sample);

        tree.delete(tree.findNode(6));

        sample = TreeBuilder.empty(nodeFactory, comparator).setRootNode(4, levelBuilder => {
            levelBuilder.left(3, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(1, Color.RED);
            });
            levelBuilder.right(8, Color.RED, levelBuilder1 => {
                levelBuilder1.left(7, Color.BLACK);
                levelBuilder1.right(10, Color.BLACK);
            });
        }).build();
        expect( tree).to.deep.eq(sample);

        tree.delete(tree.findNode(10));

        sample = TreeBuilder.empty(nodeFactory, comparator).setRootNode(4, levelBuilder => {
            levelBuilder.left(3, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(1, Color.RED);
            });
            levelBuilder.right(8, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(7, Color.RED);
            });
        }).build();
        expect( tree).to.deep.eq(sample);

        tree.delete(tree.findNode(4));

        sample = TreeBuilder.empty(nodeFactory, comparator).setRootNode(3, levelBuilder => {
            levelBuilder.left(1, Color.BLACK);
            levelBuilder.right(8, Color.BLACK, levelBuilder1 => {
                levelBuilder1.left(7, Color.RED);
            });
        }).build();
        expect( tree).to.deep.eq(sample);


        tree.delete(tree.findNode(8));
        tree.delete(tree.findNode(3));
        tree.delete(tree.findNode(1));

        sample = TreeBuilder.empty(nodeFactory, comparator).setRootNode(7).build();
        expect( tree).to.deep.eq(sample);

        tree.delete(tree.findNode(7));
        sample = TreeBuilder.empty(nodeFactory, comparator).build();
        expect( tree).to.deep.eq(sample);
    })
});