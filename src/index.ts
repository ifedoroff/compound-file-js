import {CompoundFile} from "./CompoundFile";
import {FixedSizeChunkedDataview} from "./dataview/FixedSizeChunkedDataview";

declare global {
    interface Window {
        compoundFile: (bytes: number[]) => CompoundFile
    }
}
window.compoundFile = (bytes: number[]) => new CompoundFile(new FixedSizeChunkedDataview(512, bytes));
