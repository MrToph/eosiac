const get = require(`lodash/get`)

const {JsSignatureProvider} = require(`eosjs/dist/eosjs-jssig`)

// TODO @MrToph: Create custom one supporting both inline-keys and Scatter
function initSignatureProvider(env) {
    const privateKeys = []
    Object.keys(env.accounts || {}).forEach(accountName => {
        if (get(env, `accounts.${accountName}.signature.type`) === `key`) {
            const privateKey = get(env, `accounts.${accountName}.signature.private_key`)
            if (privateKey) {
                privateKeys.push(privateKey)
            }
        }
    })
    const signatureProvider = new JsSignatureProvider(privateKeys)

    return signatureProvider
}

module.exports = initSignatureProvider
