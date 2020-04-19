export interface StreamWriter {
    write(data: number[]): number;
    writeAt(startingSector: number, position: number, data: number[]): void;
    append(startingSector: number, currentSize: number, data: number[]): number;
}