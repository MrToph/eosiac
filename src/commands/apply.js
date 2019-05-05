const path = require(`path`)
const chalk = require(`chalk`)
const mapValues = require(`lodash/mapValues`)
const forEach = require(`lodash/forEach`)
const eos = require(`../eos`)
const utils = require(`../utils`)
const Account = require(`../account`)

const performTransaction = async ({sendTransaction, actions}) => {
    try {
        await sendTransaction(actions)
    } catch (error) {
        throw new Error(
            `Error while sending transaction:\n  ${error.message}.\n  Payload: ${JSON.stringify(
                actions,
            )}`,
        )
    }
}

async function apply(envName, options) {
    const {config, configPath} = utils.getConfig(options.config)

    if (!(envName in config)) {
        throw new Error(
            `Error while using config "${configPath}":\n  Environment ${envName} not found.`,
        )
    }

    const env = config[envName]
    const {api, sendTransaction} = eos.initEos(env)

    if (env.accounts) {
        env.accounts = mapValues(
            env.accounts,
            (account, accountName) => new Account(accountName, account),
        )

        const accounts = Object.keys(env.accounts).map(accountName => env.accounts[accountName])
        await Promise.all(accounts.map(account => account.fetch({api})))

        const createdAccounts = []
        /* eslint-disable no-await-in-loop */
        for (const account of accounts) {
            const actions = await account.create({env})
            if (actions) {
                await performTransaction({sendTransaction, actions})
                utils.log(utils.chalk.green(`Account "${account.name}" created.`))
                createdAccounts.push(account)
            }
        }
        /* eslint-enable no-await-in-loop */

        await Promise.all(createdAccounts.map(account => account.fetch({api, delay: 1100})))

        /* eslint-disable no-await-in-loop */
        for (const account of accounts) {
            const actions = await account.updateAuth({env})
            if (actions) {
                try {
                    await performTransaction({sendTransaction, actions})
                } catch (error) {
                    throw new Error(
                        `${error.message}\nNote: Updating permissions requires ${utils.chalk.yellow(
                            `owner`,
                        )} permissions. Make sure these are available for signatures.`,
                    )
                }
                utils.log(utils.chalk.green(`Permissions for "${account.name}" updated.`))
                createdAccounts.push(account)
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    utils.log(chalk.green`Success!`)
}

module.exports = apply
