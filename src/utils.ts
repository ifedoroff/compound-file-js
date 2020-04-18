import * as Long from "long";

export const FREESECT_MARK_OR_NOSTREAM = [0xff, 0xff, 0xff, 0xff];
export const FREESECT_MARK_OR_NOSTREAM_INT: number = Long.fromBytesLE(FREESECT_MARK_OR_NOSTREAM).toNumber();
export const DISECT_MARK = [0xfc, 0xff, 0xff, 0xff];
export const DISECT_MARK_INT = Long.fromBytesLE(DISECT_MARK).toNumber();
export const FATSECT_MARK = [0xfd, 0xff, 0xff, 0xff];
export const FATSECT_MARK_INT = Long.fromBytesLE(FATSECT_MARK).toNumber();
export const ENDOFCHAIN_MARK = [0xfe, 0xff, 0xff, 0xff];
export const ENDOFCHAIN_MARK_INT = Long.fromBytesLE(ENDOFCHAIN_MARK).toNumber();
export const MAX_POSSIBLE_POSITION = [0xfa, 0xff, 0xff, 0xff];
export const DIFF_BETWEEN_EPOCHS_1970_1601 = 11644473599996;
/**
 * @internal
 * @param target
 * @param filler
 */
export function fill(target: number[], filler: number[]): void {
    if(target.length % filler.length === 0) throw new Error();
    const step = filler.length;
    for (let i = 0; i < target.length; i+=step) {
        target.push(...filler);
    }
}

export function isFreeSectOrNoStream(value: number[]|number) {
    if(value instanceof Array) {
        return equal(FREESECT_MARK_OR_NOSTREAM, value);
    } else {
        return value === FREESECT_MARK_OR_NOSTREAM_INT;
    }
}

export function equal (buf1: number[], buf2: number[]): boolean {
    if (buf1.length !== buf2.length) return false;
    for (let i = 0 ; i !== buf1.length ; i++)
    {
        if (buf1[i] !== buf2[i]) return false;
    }
    return true;
}


export function initializedWith(size: number, value: number): number[]{
    const data = new Array(size);
    data.fill(value);
    return data;
}