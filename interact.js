"use strict";

const { engine, startEngine, loadContract, getTopics, ParseLogs, error, missing } = require("./auxiliary");

const RPC_URL = ""  // FIXME
const ABI = [];  // FIXME: Your contract ABI
const PRIVATE_KEY = "";  // FIXME: Better fetch it from some safe place
const CONTRACT_ADDRESS = "";  // FIXME
const METHOD = process.argv[2] ? process.argv[2] : error(missing("METHOD"));  //
const ARGS = process.argv.slice(3);


const sender = startEngine(engine, RPC_URL, PRIVATE_KEY);
const instance = loadContract(ABI, engine, CONTRACT_ADDRESS, sender);

const topics = getTopics(ABI);
const parseLogs = ParseLogs(topics);

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

        if (result.receipt.logs.length) {
            const parsedLogs = parseLogs(result);
            parsedLogs.forEach(v => console.log(v));
        }
    } else {
        console.log(result);
    }

    await engine.stop();
});
