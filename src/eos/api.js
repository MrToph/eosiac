const {Api, JsonRpc} = require(`eosjs`)
const fetch = require(`node-fetch`) // node only; not needed in browsers
const {TextEncoder, TextDecoder} = require(`util`) // node only; native TextEncoder/Decoder

function initApi(env, signatureProvider) {
    const rpc = new JsonRpc(env.node_endpoint, {fetch})
    const api = new Api({
        rpc,
        signatureProvider,
        chainId: env.chain_id,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    })

    return api
}

module.exports = initApi
