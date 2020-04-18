/**
 * @internal
 */
export interface CFDataview {
    writeAt(position: number, bytes: number[]): CFDataview
    getSize(): number;
    getData(): number[];
    subView(start: number, end?: number): CFDataview;
    allocate(length: number): CFDataview;
    fill(filler: number[]): CFDataview;
    isEmpty(): boolean;
    readAt(position: number, length: number): number[];
}

