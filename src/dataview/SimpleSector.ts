import {Sector} from "./Sector";
import {CFDataview} from "./СFDataview";

export class SimpleSector implements Sector {
    private readonly view: CFDataview;
    private readonly position: number;

    constructor(view: CFDataview, position: number) {
        this.view = view;
        this.position = position;
    }

    getPosition(): number {
        return this.position;
    }

    writeAt(position: number, bytes: number[]): Sector {
        this.view.writeAt(position, bytes);
        return this;
    }

    getSize(): number {
        return this.view.getSize();
    }

    getData(): number[] {
        return this.view.getData();
    }

    subView(start: number, end?: number): CFDataview {
        return this.view.subView(start, end);
    }

    allocate(length: number): CFDataview {
        return this.view.allocate(length);
    }

    fill(filler: number[]): Sector {
        this.view.fill(filler);
        return this;
    }

    readAt(position: number, length: number): number[] {
        return this.view.readAt(position, length);
    }

    static from(view: CFDataview, position: number, filler?: number[]): Sector {
        const simpleSector = new SimpleSector(view, position);
        if(filler != null) {
            simpleSector.fill(filler);
        }
        return simpleSector;
    }

    isEmpty(): boolean {
        return this.getSize() === 0;
    }
}