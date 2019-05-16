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
            fetchPermissionLinks,
            createAccounts,
            updateAuth,
            updateRam,
            updateBandwidth,
            updateCode,
            updateTokens,
            cleanup,
        } = steps.getSteps({env})

        await fetchAccounts()
        const createdAccounts = await createAccounts()
        await fetchAccounts(createdAccounts, 1100)
        await updateBandwidth()

        await fetchPermissionLinks()
        await updateAuth()

        await updateRam()
        await updateCode()

        await fetchTokens()
        await updateTokens()

        try {
            await cleanup()
        } catch (err) {
            utils.warning(err.message)
            // no catch
        }
    }

    utils.log(chalk.green`Success!`)
}

module.exports = apply
