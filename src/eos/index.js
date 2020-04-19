// require(`./scatter-storage-provider`)
const initSignatureProvider = require(`./signature-provider`)
const initApi = require(`./api`)
const initDfuse = require(`./dfuse`)
const utils = require(`../utils`)

let api = null
let dfuseClient = null

function initEos(env) {
    const signatureProvider = initSignatureProvider(env)
    api = initApi(env, signatureProvider)
    try {
        dfuseClient = initDfuse(env)
    } catch (error) {
        console.error(error.message)
    }

    const sendTransaction = async args => {
        const actions = Array.isArray(args) ? args : [args]
        if (actions.length === 0) {
            throw new Error(`Transaction does not contain any actions`)
        }

        const cpuPayer = env.cpu_payer
        if (cpuPayer) {
            const [noopAccount, noopAction] = cpuPayer.action.split(`@`)
            actions.unshift({
                account: noopAccount,
                name: noopAction,
                authorization: [
                    {
                        actor: cpuPayer.account,
                        permission: cpuPayer.permission,
                    },
                ],
                data: {},
            })
        }

        // const availableKeys = await api.signatureProvider.getAvailableKeys()
        // console.log(`Available keys: `, availableKeys)
        // console.log(actions[0].authorization)
        // const requiredKeys = await api.authorityProvider.getRequiredKeys({
        //     transaction: {actions},
        //     availableKeys,
        // })
        // console.log(`Required keys: `, requiredKeys)

        const pushTransactionArgs = await api.transact(
            {
                actions,
            },
            {
                blocksBehind: 3,
                expireSeconds: 10 * 60,
                sign: true,
                broadcast: false,
            },
        )

        const pushTransactionPayload = {
            signatures: pushTransactionArgs.signatures,
            compression: 0,
            packed_context_free_data: ``,
            packed_trx: utils.arrayToHex(pushTransactionArgs.serializedTransaction),
        }
        console.log(JSON.stringify(pushTransactionPayload))

        return api.pushSignedTransaction(pushTransactionArgs)
    }

    return {api, dfuseClient, sendTransaction}
}

module.exports = {
    initEos,
}
