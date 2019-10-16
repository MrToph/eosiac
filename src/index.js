// for the CLI entry-point, see cli.js
// this file is the entry-point when requiring eosiac as a package
const {RpcError} = require(`eosjs`)
const utils = require(`./utils`)
const eos = require(`./eos`)

const sendTransactionFactory = api => async args => {
    try {
        const actions = Array.isArray(args) ? args : [args]
        const transaction = await api.transact({actions}, {blocksBehind: 3, expireSeconds: 30})
        const trxId = transaction.transaction_id
        for (const action of actions) {
            utils.silent(
                utils.chalk.green(
                    `${action.account}::${action.name} [${JSON.stringify(
                        action.data,
                    )}] => ${trxId}`,
                ),
            )
            utils.silent(
                transaction.processed.action_traces
                    .map(
                        trace =>
                            `${trace.console}${trace.inline_traces
                                .filter(Boolean)
                                .map(t => `\t${t.console}\n`)}`,
                    )
                    .join(`\n`),
            )
        }
    } catch (error) {
        let {message} = error
        if (error instanceof RpcError) {
            const {name, what, details} = error.json.error
            message = details[0] ? details[0].message : `[${name}] ${what}`
            const pendingConsoleDetail = details.find(d =>
                d.message.includes(`pending console output:`),
            )
            if (pendingConsoleDetail) {
                message += `\n${pendingConsoleDetail.message
                    .replace(`pending console output:`, ``)
                    .slice(0, 500)}`
            }
        }
        utils.error(`Transaction Error: ${message}\n${JSON.stringify(args, null, 2)}`)
        throw error
    }
}

function main(envName, options = {}) {
    try {
        utils.setVerbose(options.verbose)
        const {config, configPath} = utils.getConfig(options.config)

        if (!(envName in config)) {
            throw new Error(
                `Error while using config "${configPath}":\n  Environment ${envName} not found.`,
            )
        }

        const env = config[envName]

        const {api, dfuseClient} = eos.initEos(env)

        return {
            api,
            dfuseClient,
            sendTransaction: sendTransactionFactory(api),
            env,
        }
    } catch (error) {
        utils.error(error.message)
        throw error
    }
}

module.exports = main
