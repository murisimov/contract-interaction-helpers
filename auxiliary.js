"use strict";


const Web3 = require('web3');

const ProviderEngine = require('web3-provider-engine');
const Web3Subprovider = require('web3-provider-engine/subproviders/web3.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');

const ethereumjsWallet = require('ethereumjs-wallet');

const TruffleContract = require('truffle-contract');
const SolidityEvent = require("web3/lib/web3/event.js");

const engine = new ProviderEngine();

engine.addProvider(new FilterSubprovider());


function missing(msg) {
    return `Argument "${msg}" is missing`;
}
function error(msg) {
    console.error(msg);
    process.exit(1);
}


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
    engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(rpcUrl)));
    engine.start();
    return sender;
}

/**
 * Create TruffleContract instance based on contract abi and address,
 * make it use given provider and interact with the contract from the
 * given sender address by default.
 *
 * @param abi
 * @param provider
 * @param defaultSender
 * @param defaultGas
 */
function loadContract(abi, provider, contractAddress, defaultSender, defaultGas=4500000) {
    const contract = TruffleContract({abi: abi});
    contract.setProvider(provider);
    contract.defaults({ from: defaultSender, gas: defaultGas });
    return contract.at(contractAddress);
}


/**
 * Get all the event topics from the given contract ABI
 * @param abi
 * @returns {{}} topics
 */
function getTopics(abi) {
    let topics = {};
    const decoders = abi.filter(json => json.type === 'event');
    for (let json of decoders) {
        let decoder = new SolidityEvent(null, json, null);
        topics['0x' + decoder.signature()] = decoder;
    }
    return topics;
}

/**
 * Get event topics fetched from contract ABI, return function
 * that parses all the logs from transaction receipt.
 *
 * @param topics
 * @returns {Function} parseLogs
 */
function ParseLogs(topics) {
    return function (tx) {
        const logs = tx.receipt.logs;
        let result = [];
        for (let log of logs) {
            result.push(topics[log.topics[0]].decode(log));
        }
        return result;
    }
}


module.exports = {
    engine: engine,
    startEngine: startEngine,
    loadContract: loadContract,
    getTopics: getTopics,
    ParseLogs: ParseLogs,
    missing: missing,
    error: error
}

