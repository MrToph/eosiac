// require(`./scatter-storage-provider`)
const initSignatureProvider = require(`./signature-provider`)
const initApi = require(`./api`)
const initDfuse = require(`./dfuse`)
const utils = require(`../utils`)

const initEos = env => {
    let api = null
    let dfuseClient = null
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

        console.log(JSON.stringify(actions).slice(0, 500))
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
        // console.log(JSON.stringify(pushTransactionPayload))

        return api.pushSignedTransaction(pushTransactionArgs)
    }

    return {api, dfuseClient, sendTransaction}
}

module.exports = {
    initEos,
}
