// for the CLI entry-point, see cli.js
// this file is the entry-point when requiring eosiac as a package
const {RpcError} = require(`eosjs`)
const utils = require(`./utils`)
const eos = require(`./eos`)

const extendSendTransaction = sendTransaction => async args => {
    try {
        const actions = Array.isArray(args) ? args : [args]
        const transaction = await sendTransaction(actions)
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
                            `${trace.console}${trace.inline_traces &&
                                trace.inline_traces.filter(Boolean).map(t => `\t${t.console}\n`)}`,
                    )
                    .join(`\n`),
            )
        }
    } catch (error) {
        let {message} = error
        if (error instanceof RpcError) {
            const {name, what, details} = error.json.error
            message =
                details.length > 0
                    ? details.map(d => d.message.slice(0, 300)).join(`\n`)
                    : `[${name}] ${what}`
            utils.info(JSON.stringify(error))
        }

        utils.error(`Transaction Error: ${message}\n${JSON.stringify(args, null, 2)}`)
        throw error
    }
}

// used when requiring eosiac from javascript
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

        const {api, dfuseClient, sendTransaction} = eos.initEos(env)

        return {
            api,
            dfuseClient,
            sendTransaction: extendSendTransaction(sendTransaction),
            env,
        }
    } catch (error) {
        utils.error(error.stack)
        throw error
    }
}

module.exports = main
