const {Api, JsonRpc} = require(`eosjs`)
const fetch = require(`node-fetch`) // node only; not needed in browsers
const {TextEncoder, TextDecoder} = require(`util`) // node only; native TextEncoder/Decoder
const AuthorityProvider = require(`./authority-provider`)

function initApi(env, signatureProvider) {
    const rpc = new JsonRpc(env.node_endpoint, {fetch})
    const authorityProvider = new AuthorityProvider(rpc)
    const api = new Api({
        rpc,
        signatureProvider,
        authorityProvider,
        chainId: env.chain_id,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    })

    return api
}

module.exports = initApi
