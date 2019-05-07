const get = require(`lodash/get`)
const keyBy = require(`lodash/keyBy`)
const merge = require(`lodash/merge`)
const values = require(`lodash/values`)
const flatten = require(`lodash/flatten`)
const utils = require(`../utils`)

const getDesiredDelegationsPerAccount = ({cpu = [], net = []}) => {
    const $cpu = keyBy(cpu.map(entry => ({cpu: entry.amount, to: entry.delegate_to})), `to`)
    const $net = keyBy(net.map(entry => ({net: entry.amount, to: entry.delegate_to})), `to`)
    const merged = values(merge($cpu, $net))

    return merged
}

const createStakeActions = ({from, to, env, deltaCpu, deltaNet}) => {
    if (deltaNet === 0 && deltaCpu === 0) {
        return []
    }

    let actions = []
    if (deltaNet * deltaCpu >= 0) {
        // same signs => can do it in one action
        if (deltaNet > 0 || deltaCpu > 0) {
            actions = [
                {
                    account: `eosio`,
                    name: `delegatebw`,
                    authorization: [
                        {
                            actor: env.funds_manager,
                            permission: `active`,
                        },
                    ],
                    data: {
                        from,
                        receiver: to,
                        stake_net_quantity: utils.formatAsset({
                            amount: deltaNet,
                            symbol: `EOS`,
                            precision: 4,
                        }),
                        stake_cpu_quantity: utils.formatAsset({
                            amount: deltaCpu,
                            symbol: `EOS`,
                            precision: 4,
                        }),
                        transfer: false,
                    },
                },
            ]
        } else {
            actions = [
                {
                    account: `eosio`,
                    name: `undelegatebw`,
                    authorization: [
                        {
                            actor: env.funds_manager,
                            permission: `active`,
                        },
                    ],
                    data: {
                        from,
                        receiver: to,
                        unstake_net_quantity: utils.formatAsset({
                            amount: -deltaNet,
                            symbol: `EOS`,
                            precision: 4,
                        }),
                        unstake_cpu_quantity: utils.formatAsset({
                            amount: -deltaCpu,
                            symbol: `EOS`,
                            precision: 4,
                        }),
                    },
                },
            ]
        }
    } else {
        // different signs
        actions = [
            {
                account: `eosio`,
                name: `delegatebw`,
                authorization: [
                    {
                        actor: env.funds_manager,
                        permission: `active`,
                    },
                ],
                data: {
                    from,
                    receiver: to,
                    stake_net_quantity: utils.formatAsset({
                        amount: deltaNet > 0 ? deltaNet : 0,
                        symbol: `EOS`,
                        precision: 4,
                    }),
                    stake_cpu_quantity: utils.formatAsset({
                        amount: deltaCpu > 0 ? deltaCpu : 0,
                        symbol: `EOS`,
                        precision: 4,
                    }),
                    transfer: false,
                },
            },
            {
                account: `eosio`,
                name: `undelegatebw`,
                authorization: [
                    {
                        actor: env.funds_manager,
                        permission: `active`,
                    },
                ],
                data: {
                    from,
                    receiver: to,
                    unstake_net_quantity: utils.formatAsset({
                        amount: deltaNet < 0 ? -deltaNet : 0,
                        symbol: `EOS`,
                        precision: 4,
                    }),
                    unstake_cpu_quantity: utils.formatAsset({
                        amount: deltaCpu < 0 ? -deltaCpu : 0,
                        symbol: `EOS`,
                        precision: 4,
                    }),
                },
            },
        ]
    }

    // TODO: @MrToph: Add transfer action such that account has funds
    return actions
}

const getBandwidthActions = ({account, env}) => {
    const desiredDelegations = getDesiredDelegationsPerAccount({
        cpu: account.cpu,
        net: account.net,
    })
    const actions = desiredDelegations.map(del => {
        const currentStake = account.currentState.stakes.find(s => s.to === del.to)

        const currentNet = get(currentStake, `net_weight`, `0.0000 EOS`)
            .split(` `)[0]
            .replace(/\./, ``)
        const currentCpu = get(currentStake, `cpu_weight`, `0.0000 EOS`)
            .split(` `)[0]
            .replace(/\./, ``)

        return createStakeActions({
            from: account.name,
            to: del.to,
            env,
            deltaCpu: (del.cpu || 0) - Number.parseInt(currentCpu, 10),
            deltaNet: (del.net || 0) - Number.parseInt(currentNet, 10),
        })
    })

    return flatten(actions)
}

module.exports = getBandwidthActions
