"use strict";


const config = require('./config');
const deployed = require('./deployed');
const {
    engine,
    startEngine,
    loadContract,
    // getTopics, ParseLogs,
    pretty_print,
    error, missing
} = require("./auxiliary");


const NETWORK = process.argv[2] ? process.argv[2] : error(missing("NETWORK ID"));
const NAME = process.argv[3] ? process.argv[3] : error(missing("CONTRACT NAME"));
const METHOD = process.argv[4] ? process.argv[4] : error(missing("CONTRACT METHOD"));  //
const ARGS = process.argv.slice(5);

const network = config[NETWORK];
const sender = startEngine(engine, network.rpcUrl, network.privKey);
const abstraction = loadContract(NAME, engine, sender, NETWORK);
const instance = abstraction.at(deployed[NETWORK][NAME].address);


// const topics = getTopics(deployed[NAME].ABI);
// const parseLogs = ParseLogs(topics);

let tx;
if (ARGS.length) {
    tx = instance[METHOD](...ARGS);
} else {
    tx = instance[METHOD]();
}

tx.then(async (result) => {
    if (result.tx) {
        console.log(`TX HASH: ${result.tx}`);
        console.log(`GAS USED: ${result.receipt.gasUsed}`);
        console.log(`CUMULATIVE GAS USED: ${result.receipt.cumulativeGasUsed}`);
        console.log(`STATUS: ${result.receipt.status}`);

        pretty_print(result);
        // if (result.receipt.logs.length) {
        //     const parsedLogs = parseLogs(result);
        //     parsedLogs.forEach(v => console.log(v));
        // }
    } else {
        pretty_print(result);
    }

    await engine.stop();
});
