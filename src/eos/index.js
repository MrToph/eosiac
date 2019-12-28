// require(`./scatter-storage-provider`)
const initSignatureProvider = require(`./signature-provider`)
const initApi = require(`./api`)
const initDfuse = require(`./dfuse`)

let api = null
let dfuseClient = null

function initEos(env) {
    const signatureProvider = initSignatureProvider(env)
    api = initApi(env, signatureProvider)
    dfuseClient = initDfuse(env)

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

    return {api, dfuseClient, sendTransaction}
}

module.exports = {
    initEos,
}
