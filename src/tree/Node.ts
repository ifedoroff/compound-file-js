export enum Color {
    RED, BLACK
}

export class TreeNode<N extends TreeNode<any, T>, T>{

    private readonly value: T;
    private leftChild: N = null;
    private rightChild: N = null;
    private parent: N = null;
    private color: Color;

    constructor(value: T, color: Color) {
        this.color = color;
        if(value == null) throw new Error("Null values are not allowed");
        this.value = value;
    }

    getLeftChild(): N {
        return this.leftChild;
    }

    setLeftChild(value: N): void {
        this.leftChild = value;
        if(this.leftChild != null) {
            this.leftChild.setParent(this);
        }
    }

    getValue(): T {
        return this.value;
    }

    setRightChild(value: N): void {
        this.rightChild = value;
        if(this.rightChild != null) {
            this.rightChild.setParent(this);
        }
    }

    getRightChild(): N {
        return this.rightChild;
    }


    getParent(): N {
        return this.parent;
    }


    setParent(parent: N): void {
        this.parent = parent;
    }

    hasChildren(): boolean {
        return this.leftChild != null || this.rightChild != null;
    }

    hasTwoChildren(): boolean {
        return this.leftChild != null && this.rightChild != null;
    }

    isLeftChild(node: N): boolean {
        return this.leftChild === node;
    }

    isRightChild(node: N): boolean {
        return this.rightChild === node;
    }

    deleteChild(node: N): void {
        if(node === this.leftChild) {
            this.leftChild = null;
        } else if(node === this.rightChild) {
            this.rightChild = null;
        }
    }

    substituteNode(node: N, substitute: N): void {
        if(node === this.rightChild) {
            this.rightChild = substitute;
            this.rightChild.setParent(this);
        } else if(node === this.leftChild) {
            this.leftChild = substitute;
            this.leftChild.setParent(this);
        }
    }

    getChildrenRecursive(): N[] {
        const allChildren: N[] = [];
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

    uncle(): N {
        const parent = this.getParent();
        const grandParent = this.getParent().getParent() as N;
        if(parent != null && grandParent != null) {
            if (grandParent.isLeftChild(parent)) {
                return grandParent.getRightChild();
            } else {
                return grandParent.getLeftChild() as N;
            }
        }
        return null;
    }

    grandParent(): N {
        let grandParent = null;
        if(this.getParent() != null) {
            grandParent = this.getParent().getParent();
        }
        return grandParent;
    }

    sibling(): N {
        if(this.getParent() == null) {
            return null;
        } else if(this.getParent().isLeftChild(this)){
            return this.getParent().getRightChild();
        } else {
            return this.getParent().getLeftChild();
        }
    }
}
