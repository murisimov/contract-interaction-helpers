"use strict";


const fs = require('fs');
const config = require('./config');
const {
    engine,
    startEngine,
    loadContract,
    not, error, missing
} = require("./auxiliary");

const NETWORK = process.argv[2] ? process.argv[2] : error(missing("NETWORK NAME"));
const NAME = process.argv[3] ? process.argv[3] : error(missing("CONTRACT NAME"));
const ARGS = process.argv.slice(4);

const network = config[NETWORK];
const sender = startEngine(engine, network.rpcUrl, network.privKey);
console.log("Engine started");
const abstraction = loadContract(NAME, engine, sender);
console.log("Contract abstraction loaded")


let deploy;

if (ARGS.length > 0) {
    deploy = abstraction.new(...ARGS);
} else {
    deploy = abstraction.new();
}

deploy.then(async (instance) => {
    console.log("Contract deployed at " + instance.address);
    let content;
    if (not(fs.statSync('./deployed.json').isFile())) {
        content = {};
    } else {
        content = JSON.parse(fs.readFileSync('./deployed.json'));
    }
    if (not(content[NETWORK])) {
        content[NETWORK] = {};
    }
    content[NETWORK][NAME] = {
        address: instance.address,
        abi: instance.abi
    }
    fs.writeFileSync('./deployed.json', JSON.stringify(content, null, 4));
    console.log("Contracts storage updated");

    await engine.stop();
});
