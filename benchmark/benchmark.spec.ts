import {Event} from "benchmark";
import {CompoundFile, initializedWidth} from "../src";

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite("test copy performance", {
    minSamples: 10,
    maxTime: 60
});
const streamsToCreate: number[] = [];
for (let i = 0; i < 10; i++) {
    initializedWidth(4096, i);
}

// add tests
suite.add('RegExp#test', function() {
    const compoundFile = new CompoundFile();
    for (const streamBytes of streamsToCreate) {

    }
    // /o/.test('Hello World!');
})
    // add listeners
    .on('cycle', function(event: Event) {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    // run async
    .run({ 'async': true });