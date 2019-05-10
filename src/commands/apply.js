const chalk = require(`chalk`)
const mapValues = require(`lodash/mapValues`)
const utils = require(`../utils`)
const Account = require(`../account`)
const steps = require(`./steps`)

async function apply(envName, options) {
    const {config, configPath} = utils.getConfig(options.config)

    if (!(envName in config)) {
        throw new Error(
            `Error while using config "${configPath}":\n  Environment ${envName} not found.`,
        )
    }

    const env = config[envName]

    if (env.accounts) {
        env.accounts = mapValues(
            env.accounts,
            (account, accountName) => new Account(accountName, account),
        )

        const {
            fetchAccounts,
            fetchTokens,
            createAccounts,
            updateAuth,
            updateRam,
            updateBandwidth,
            updateCode,
            updateTokens,
        } = steps.getSteps({env})

        await fetchAccounts()
        const createdAccounts = await createAccounts()
        await fetchAccounts(createdAccounts, 1100)
        await updateAuth()
        await updateRam()
        await updateBandwidth()
        await updateCode()

        await fetchTokens()
        await updateTokens()
    }

    utils.log(chalk.green`Success!`)
}

module.exports = apply
