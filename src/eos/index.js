const initSignatureProvider = require(`./signature-provider`)
const initApi = require(`./api`)

let api = null

function initEos(env) {
    const signatureProvider = initSignatureProvider(env)
    api = initApi(env, signatureProvider)

    const sendTransaction = async args => {
        const actions = Array.isArray(args) ? args : [args]

        return api.transact(
            {
                actions,
            },
            {
                blocksBehind: 3,
                expireSeconds: 10 * 60,
            },
        )
    }

    return {api, sendTransaction}
}

module.exports = {
    initEos,
}
