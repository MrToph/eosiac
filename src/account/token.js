const utils = require(`../utils`)

const createTokenAction = ({from, to, deltaAmount, tokenContract, tokenSymbol}) => {
    if (deltaAmount === 0) {
        utils.silent(`Token "${tokenSymbol.symbol}" for account "${to}" is up-to-date.`)

        return null
    }

    const isRefund = deltaAmount < 0

    return {
        account: tokenContract,
        name: `transfer`,
        authorization: [
            {
                actor: isRefund ? to : from,
                permission: `active`,
            },
        ],
        data: {
            from: isRefund ? to : from,
            to: isRefund ? from : to,
            quantity: utils.formatAsset({amount: Math.abs(deltaAmount), symbol: tokenSymbol}),
            memo: `transfer`,
        },
    }
}

const getTokenActions = ({account, env}) => {
    if (account.name === env.funds_manager) {
        return null
    }

    const actions = account.tokens.map((extendedAsset, index) => {
        const desiredAsset = utils.decomposeAsset(extendedAsset.amount)
        const currentAsset = utils.decomposeAsset(account.currentState.tokens[index])

        const deltaAmount = desiredAsset.amount - currentAsset.amount

        return createTokenAction({
            from: env.funds_manager,
            to: account.name,
            deltaAmount,
            tokenContract: extendedAsset.account,
            tokenSymbol: desiredAsset.symbol,
        })
    })

    return actions.filter(Boolean)
}

module.exports = getTokenActions
