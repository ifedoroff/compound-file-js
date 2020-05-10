import * as Long from "long";
import "./Long"
import {fromCodePoint, codePointAt} from 'utf16-char-codes';

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
        if(target.length % filler.length !== 0) throw new Error();
        const step = filler.length;
        for (let i = 0; i < target.length; i+=step) {
            target.splice(i, 4, ...filler);
        }
    }

    export function isFreeSectOrNoStream(value: number[]|number) {
        if(value instanceof Array) {
            return equal(FREESECT_MARK_OR_NOSTREAM, value);
        } else {
            return value === FREESECT_MARK_OR_NOSTREAM_INT;
        }
    }

    export function isEndOfChain(value: number[]|number) {
        if(value instanceof Array) {
            return equal(ENDOFCHAIN_MARK, value);
        } else {
            return value === ENDOFCHAIN_MARK_INT;
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


    export function initializedWidth(size: number, value: number|number[]): number[]{
        const data: number[] = new Array(size);
        if(value instanceof Array) {
            for (let i = 0; i < size; i+=value.length) {
                data.splice(i, value.length, ...value);
            }
        } else {
            data.fill(value);
        }
        return data;
    }

    export function toUTF16String(bytes: number[]): string  {
        const result = [];
        for (let i = 0; i < bytes.length; i+=2) {
            result.push(fromCodePoint(Long.fromBytesLE([bytes[i], bytes[i + 1]]).toNumber()));
        }
        return result.join("");
    }

    export function toUTF16Bytes(str: string): number[] {
        const bytes: number[] = [];
        for (let i = 0; i < str.length; i++) {
            const charBytes = Long.fromValue(codePointAt(str, i)).to2BytesLE();
            if(charBytes.length !== 2) {
                throw new Error("Each character in UTF-16 encoding should be presented with 2 bytes");
            }
            bytes.push(...charBytes);
        }
        return bytes;
    }

    export function addTrailingZeros(original: number[], maximumLength: number): number[] {
        const result: number[] = original.slice(0, original.length);
        for (let i = original.length; i < maximumLength; i++) {
            result[i] = 0;
        }
        return result;
    }

    export function toUTF16WithNoTrailingZeros(bytes: number[]): string {
        return toUTF16String(removeTrailingZeros(bytes));
    }

    export function removeTrailingZeros(bytes: number[]): number[] {
        let resultingLength = bytes.length;
        for (let i = bytes.length - 1; i > 0; i-=2) {
            if(bytes[i] === 0 && bytes[i-1] === 0) {
                resultingLength = i-1;
            } else {
                break;
            }
        }
        return bytes.slice(0, resultingLength);
    }