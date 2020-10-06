const ScatterJS = require(`scatterjs-core`).default
const eos = require(`../../eos`)
const utils = require(`../../utils`)

const performTransaction = async ({sendTransaction, actions}) => {
    try {
        await sendTransaction(actions)
    } catch (error) {
        throw new Error(
            `Error while sending transaction:\n  ${error.stack}.\n  Payload: ${JSON.stringify(
                actions,
            ).slice(0, 1024)}`,
        )
    }
}

const getSteps = ({env}) => {
    const {api, dfuseClient, sendTransaction} = eos.initEos(env)
    const accounts = Object.keys(env.accounts).map(accountName => env.accounts[accountName])

    const fetchAccounts = async (accountsToFetch = accounts, delay) =>
        Promise.all(accountsToFetch.map(account => account.fetch({api, delay})))

    const fetchTokens = async (accountsToFetch = accounts, delay) =>
        Promise.all(accountsToFetch.map(account => account.fetchTokens({api, delay})))

    const fetchPermissionLinks = async (accountsToFetch = accounts, delay) =>
        Promise.all(
            accountsToFetch.map(account => account.fetchPermissionLinks({dfuseClient, delay})),
        )

    const createAccounts = async () => {
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

        return createdAccounts
    }

    const updateAuth = async () => {
        /* eslint-disable no-await-in-loop */
        for (const account of accounts) {
            const actions = await account.updateAuth({env})
            if (actions) {
                try {
                    await performTransaction({sendTransaction, actions})
                } catch (error) {
                    throw new Error(
                        `${
                            error.message
                        }\nNote: Updating permissions as a child of owner requires ${utils.chalk.yellow(
                            `owner`,
                        )} permissions. Make sure these are available for signatures.`,
                    )
                }
                utils.log(utils.chalk.green(`Permissions for "${account.name}" updated.`))
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    const updateRam = async () => {
        /* eslint-disable no-await-in-loop */
        for (const account of accounts) {
            const actions = await account.updateRam({env})
            if (actions) {
                await performTransaction({sendTransaction, actions})
                utils.log(utils.chalk.green(`RAM bought for "${account.name}".`))
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    const updateBandwidth = async () => {
        /* eslint-disable no-await-in-loop */
        for (const account of accounts) {
            const actions = await account.updateBandwidth({env})
            if (actions) {
                await performTransaction({sendTransaction, actions})
                utils.log(utils.chalk.green(`NET/CPU updated for "${account.name}".`))
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    const updateCode = async () => {
        /* eslint-disable no-await-in-loop */
        for (const account of accounts) {
            const actions = await account.updateCode({env})
            if (actions) {
                await performTransaction({sendTransaction, actions})
                utils.log(utils.chalk.green(`Code/ABI updated for "${account.name}".`))
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    const updateTokens = async () => {
        /* eslint-disable no-await-in-loop */
        for (const account of accounts) {
            const actions = await account.updateTokens({env})
            if (actions) {
                await performTransaction({sendTransaction, actions})
                utils.log(utils.chalk.green(`Tokens updated for "${account.name}".`))
            }
        }
        /* eslint-enable no-await-in-loop */
    }

    const cleanup = async () => {
        if (dfuseClient) {
            dfuseClient.release()
        }
        // when scatter is not initialized this throws
        if (typeof ScatterJS.disconnect === `function`) {
            // await ScatterJS.disconnect()
        }
    }

    return {
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
    }
}

module.exports = {
    getSteps,
}
