/* eslint-disable no-underscore-dangle */
const get = require(`lodash/get`)
const flattenDeep = require(`lodash/flattenDeep`)
const difference = require(`lodash/difference`)
const intersection = require(`lodash/intersection`)
const cloneDeep = require(`lodash/cloneDeep`)
const {Api} = require(`eosjs`)
const {JsSignatureProvider} = require(`eosjs/dist/eosjs-jssig`)
const ScatterJS = require(`scatterjs-core`).default
const ScatterEOS = require(`scatterjs-plugin-eosjs2`).default
const {TextEncoder, TextDecoder} = require(`util`) // node only; native TextEncoder/Decoder
const utils = require(`../utils`)

ScatterJS.plugins(new ScatterEOS())

const getNetwork = ({env}) => {
    const matches = /^(https?):\/\/(.*):?(\d*)\D*$/.exec(env.node_endpoint)
    if (!matches) {
        throw new Error(
            `Could not parse EOS HTTP endpoint in env var node_endpoint: "${env.node_endpoint}"`,
        )
    }

    const [, httpProtocol, host, port] = matches

    return {
        blockchain: `eos`,
        chainId: env.chain_id,
        protocol: httpProtocol,
        host,
        port,
    }
}

const tmpApi = new Api({
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
})

class CombinedSignatureProvider {
    constructor(env) {
        this.env = env

        const plainPrivateKeys = []
        Object.keys(env.accounts || {}).forEach(accountName => {
            if (get(env, `accounts.${accountName}.signature.type`) === `key`) {
                const privateKeys = get(env, `accounts.${accountName}.signature.private_keys`)
                if (privateKeys) {
                    plainPrivateKeys.push(...privateKeys)
                }
            }
        })
        this.keySignatureProvider = new JsSignatureProvider(plainPrivateKeys)

        const network = getNetwork({env})
        this.scatter = ScatterJS.scatter
        this.scatterSignatureProvider = this.scatter.eosHook(network, null, true)
        this.scatterConnected = false
    }

    async _connectScatter() {
        if (this.scatterConnected) {
            return
        }

        const network = getNetwork({env: this.env})
        this.scatterConnected = await this.scatter.connect(
            `eosiac`,
            {network, initTimeout: 5000},
        )
    }

    async _loginScatter() {
        await this._connectScatter()

        if (this.scatterConnected) {
            const network = getNetwork({env: this.env})
            await this.scatter.forgetIdentity()
            this.scatterId = await this.scatter.getIdentity({
                accounts: [network],
            })
        }
    }

    _getScatterConfiguredAccountNames() {
        const accounts = []
        Object.keys(this.env.accounts || {}).forEach(accountName => {
            if (get(this.env, `accounts.${accountName}.signature.type`) === `scatter`) {
                accounts.push(accountName)
            }
        })

        return accounts
    }

    _getScatterConfiguredKeys() {
        const keys = this._getScatterConfiguredAccountNames().map(scatterAccountName => {
            const auth = get(this.env, `accounts.${scatterAccountName}.auth`, [])

            return Object.keys(auth).map(permName => get(auth, `${permName}.permissions`))
        })

        return flattenDeep(keys)
            .filter(permission => permission.startsWith(`EOS`) || permission.startsWith(`PUB_`))
            .map(keyWithPossibleWeight => keyWithPossibleWeight.split(` `)[0])
    }

    async getAvailableKeys() {
        let keys = await this.keySignatureProvider.getAvailableKeys()

        // need to optimistically return all keys, otherwise eosjs throws immediately with
        // transaction declares authority '...', but does not have signatures for it..
        keys = keys.concat(this._getScatterConfiguredKeys())

        return keys
    }

    async sign(signArgs) {
        const {requiredKeys, serializedTransaction} = signArgs
        const trx = tmpApi.deserializeTransaction(serializedTransaction)
        const currentKeys = await this.getAvailableKeys()
        const missingKeys = difference(requiredKeys, currentKeys)

        let returnValue = {
            signatures: [],
        }

        if (missingKeys.length > 0) {
            const scatterConfiguredAccounts = this._getScatterConfiguredAccountNames()
            const trxAuths = flattenDeep(trx.actions.map(action => action.authorization))

            const foundAuth = trxAuths.find(auth =>
                scatterConfiguredAccounts.some(a => a === auth.actor),
            )

            if (foundAuth) {
                while (
                    !this.scatterId ||
                    !this.scatterId.accounts
                        .map(acc => acc.name)
                        .some(accName => accName === foundAuth.actor)
                ) {
                    utils.info(
                        `Please select the ${foundAuth.actor}@${
                            foundAuth.permission
                        } account in Scatter (Missing keys: ${missingKeys.join(`, `)})`,
                    )
                    // eslint-disable-next-line no-await-in-loop
                    await this._loginScatter()
                }

                try {
                    // need to make sure abi is passed as part of signArgs
                    // also clone signArgs as scatter-eos modifies signArgs.serializedTransaction
                    returnValue = await this.scatterSignatureProvider.sign(cloneDeep(signArgs))
                } catch (error) {
                    console.error(`Error while signing with Scatter: ${error.message}`)
                }
            }
        }

        try {
            // just try signing with keyProvider all the time and merge signatures
            // JSSignatureProvider throws errors when encountering a key that it doesn't have a private key for
            // https://github.com/EOSIO/eosjs/blob/849c03992e6ce3cb4b6a11bf18ab17b62136e5c9/src/eosjs-jssig.ts#L38
            const requiredKeysNoScatter = intersection(
                signArgs.requiredKeys,
                await this.keySignatureProvider.getAvailableKeys(),
            )
            const keyReturnValue = await this.keySignatureProvider.sign(
                Object.assign({}, signArgs, {requiredKeys: requiredKeysNoScatter}),
            )

            returnValue = Object.assign(returnValue, keyReturnValue, {
                signatures: returnValue.signatures.concat(keyReturnValue.signatures),
            })
        } catch (error) {
            // do nothing
        }

        return returnValue
    }
}

function initSignatureProvider(env) {
    const signatureProvider = new CombinedSignatureProvider(env)

    return signatureProvider
}

module.exports = initSignatureProvider
