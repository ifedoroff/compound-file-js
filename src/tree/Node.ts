export enum Color {
    RED, BLACK
}

export class TreeNode<T>{

    private readonly value: T;
    private leftChild: TreeNode<T> = null;
    private rightChild: TreeNode<T> = null;
    private parent: TreeNode<T> = null;
    private color: Color;

    constructor(value: T, color: Color) {
        this.color = color;
        if(value == null) throw new Error("Null values are not allowed");
        this.value = value;
    }

    getLeftChild(): TreeNode<T> {
        return this.leftChild;
    }

    setLeftChild(value:  TreeNode<T>): void {
        this.leftChild = value;
        if(this.leftChild != null) {
            this.leftChild.setParent(this);
        }
    }

    getValue(): T {
        return this.value;
    }

    setRightChild(value:  TreeNode<T>): void {
        this.rightChild = value;
        if(this.rightChild != null) {
            this.rightChild.setParent(this);
        }
    }

    getRightChild(): TreeNode<T> {
        return this.rightChild;
    }


    getParent(): TreeNode<T> {
        return this.parent;
    }


    setParent(parent:  TreeNode<T>): void {
        this.parent = parent;
    }

    hasChildren(): boolean {
        return this.leftChild != null || this.rightChild != null;
    }

    hasTwoChildren(): boolean {
        return this.leftChild != null && this.rightChild != null;
    }

    isLeftChild(node:  TreeNode<T>): boolean {
        return this.leftChild === node;
    }

    isRightChild(node:  TreeNode<T>): boolean {
        return this.rightChild === node;
    }

    deleteChild(node:  TreeNode<T>): void {
        if(node === this.leftChild) {
            this.leftChild = null;
        } else if(node === this.rightChild) {
            this.rightChild = null;
        }
    }

    substituteNode(node:  TreeNode<T>, substitute:  TreeNode<T>): void {
        if(node === this.rightChild) {
            this.rightChild = substitute;
            this.rightChild.setParent(this);
        } else if(node === this.leftChild) {
            this.leftChild = substitute;
            this.leftChild.setParent(this);
        }
    }

    getChildrenRecursive(): TreeNode<T>[] {
        const allChildren: TreeNode<T>[] = [];
        if(this.leftChild != null) {
            allChildren.push(...this.leftChild.getChildrenRecursive());
            allChildren.push(this.leftChild);
        }
        if(this.rightChild != null) {
            allChildren.push(...this.rightChild.getChildrenRecursive());
            allChildren.push(this.rightChild);
        }
        return allChildren;
    }

    getColor(): Color {
        return this.color;
    }

    setColor(color: Color): void {
        this.color = color;
    }

    invertColor(): void {
        this.color = this.color === Color.BLACK ? Color.RED : Color.BLACK;
    }

    uncle(): TreeNode<T> {
        const parent = this.getParent();
        const grandParent = this.getParent().getParent() as TreeNode<T>;
        if(parent != null && grandParent != null) {
            if (grandParent.isLeftChild(parent)) {
                return grandParent.getRightChild();
            } else {
                return grandParent.getLeftChild() as TreeNode<T>;
            }
        }
        return null;
    }

    grandParent(): TreeNode<T> {
        let grandParent = null;
        if(this.getParent() != null) {
            grandParent = this.getParent().getParent();
        }
        return grandParent;
    }

    sibling(): TreeNode<T> {
        if(this.getParent() == null) {
            return null;
        } else if(this.getParent().isLeftChild(this)){
            return this.getParent().getRightChild();
        } else {
            return this.getParent().getLeftChild();
        }
    }
}
