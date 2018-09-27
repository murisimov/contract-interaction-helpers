"use strict";


const fs = require('fs');
const util = require('util');
const Promise = require('bluebird');
const Web3 = require('web3');

const ProviderEngine = require('web3-provider-engine');
const Web3Subprovider = require('web3-provider-engine/subproviders/provider.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');

const ethereumjsWallet = require('ethereumjs-wallet');

const TruffleContract = require('truffle-contract');
//const SolidityEvent = require("web3/lib/web3/event.js");


const engine = new ProviderEngine();

engine.addProvider(new FilterSubprovider());


function not(statement) {
    return !statement;
}

function missing(msg) {
    return `Argument "${msg}" is missing`;
}

function error(msg) {
    console.error(msg);
    process.exit(1);
}

const pretty_print = (data, {showHidden = false, depth = null, colors = true} = {}) => {
    return console.log(util.inspect(data, {showHidden, depth, colors}));
};


/**
 * Setup and start web3-provider-engine instance, return default sender address.
 *
 * @param engine
 * @param rpcUrl
 * @param privateKey
 * @returns {string}
 */
function startEngine(engine, rpcUrl, privateKey) {
    const wallet = ethereumjsWallet.fromPrivateKey(new Buffer(privateKey, 'hex'));
    const sender = '0x' + wallet.getAddress().toString('hex');
    engine.addProvider(new WalletSubprovider(wallet, {}));
    const subProvider = new Web3.providers.HttpProvider(rpcUrl);
    if (typeof subProvider.sendAsync !== "function") {
        subProvider.sendAsync = function() {
            return subProvider.send.apply(
            subProvider, arguments
            );
        };
    }
    const providerSubprovider = new Web3Subprovider(subProvider);
    Promise.promisifyAll(providerSubprovider);
    engine.addProvider(providerSubprovider);
    engine.start();
    return sender;
}

/**
 * Create TruffleContract instance based on contract abi and address,
 * make it use given provider and interact with the contract from the
 * given sender address by default.
 *
 * @param name
 * @param provider
 * @param defaultSender
 * @param network
 * @param gas
 */
function loadContract(name, provider, defaultSender, network=null, gas=3900000) {
    let contract;
    try {
        const built = JSON.parse(fs.readFileSync(`./build/contracts/${name}.json`));
        contract = TruffleContract(built);
    } catch (e) {
        if (not(network)) {
            throw new Error("No network specified");
        }
        if (not(fs.statSync('./deployed.json').isFile())) {
            throw new Error("No deployed contracts");
        }
        const deployed = JSON.parse(fs.readFileSync('./deployed.json'));
        if (not(deployed[network])) {
            throw new Error("No contracts for the specified network");
        }
        if (not(deployed[network][name])) {
            throw new Error("No such contract for the specified network");
        }
        if (not(deployed[network][name].abi)) {
            throw new Error("Missing ABI for the specified contract");
        }
        contract = TruffleContract({ abi: deployed[network][name].abi });
    }
    contract.setProvider(provider);
    contract.defaults({ from: defaultSender, gas });

    return contract;
}


// /**
//  * Get all the event topics from the given contract ABI
//  * @param abi
//  * @returns {{}} topics
//  */
// function getTopics(abi) {
//     let topics = {};
//     const decoders = abi.filter(json => json.type === 'event');
//     for (let json of decoders) {
//         let decoder = new SolidityEvent(null, json, null);
//         topics['0x' + decoder.signature()] = decoder;
//     }
//     return topics;
// }
//
// /**
//  * Get event topics fetched from contract ABI, return function
//  * that parses all the logs from transaction receipt.
//  *
//  * @param topics
//  * @returns {Function} parseLogs
//  */
// function ParseLogs(topics) {
//     return function (tx) {
//         const logs = tx.receipt.logs;
//         let result = [];
//         for (let log of logs) {
//             result.push(topics[log.topics[0]].decode(log));
//         }
//         return result;
//     }
// }


module.exports = {
    engine,
    startEngine,
    loadContract,
    getTopics: null,
    ParseLogs: null,
    pretty_print,
    not,
    missing,
    error
}

