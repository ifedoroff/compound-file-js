export interface StreamReader {
    read(startingSector: number, lengthOrFromIncl: number, toExcl?: number): number[];
}