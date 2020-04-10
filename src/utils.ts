/**
 * @internal
 * @param target
 * @param filler
 */
export function fill(target: Uint8Array, filler: Uint8Array): void {
    if(target.length % filler.length === 0) throw new Error();
    const step = filler.length;
    for (let i = 0; i < target.length; i+=step) {
        target.set(filler, i);
    }
}