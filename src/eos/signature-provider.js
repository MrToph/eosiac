const get = require(`lodash/get`)

const {JsSignatureProvider} = require(`eosjs/dist/eosjs-jssig`)

// TODO @MrToph: Create custom one supporting both inline-keys and Scatter
function initSignatureProvider(env) {
    const allPrivateKeys = []
    Object.keys(env.accounts || {}).forEach(accountName => {
        if (get(env, `accounts.${accountName}.signature.type`) === `key`) {
            const privateKeys = get(env, `accounts.${accountName}.signature.private_keys`)
            if (privateKeys) {
                allPrivateKeys.push(...privateKeys)
            }
        }
    })
    const signatureProvider = new JsSignatureProvider(allPrivateKeys)

    return signatureProvider
}

module.exports = initSignatureProvider
