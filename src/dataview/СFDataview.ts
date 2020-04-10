/**
 * @internal
 */
export interface CFDataview {
    writeAt(position: number, bytes: Uint8Array): CFDataview
    getSize(): number;
    getData(): Uint8Array;
    subView(start: number, end?: number): CFDataview;
    allocate(length: number): CFDataview;
    fill(filler: Uint8Array): CFDataview;
    isEmpty(): boolean;
    readAt(position: number, length: number): Uint8Array;
}

