/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
const get = require(`lodash/get`)
const utils = require(`../utils`)
const getBandwidthActions = require(`./bandwidth`)
const getCodeActions = require(`./code`)
const getTokenActions = require(`./token`)
const authHelpers = require(`./auth`)

const isLocalBlockchain = ({env}) => {
    const accountsManager = get(env, `accounts.${env.accounts_manager}`)
    if (!accountsManager) {
        throw new Error(
            `Accounts manager account "${env.accounts_manager}" not configured in accounts.`,
        )
    }

    const accountsManagerRam = accountsManager.currentState.ram_quota

    return accountsManagerRam === -1 || !Number.isFinite(accountsManagerRam)
}

class Account {
    constructor(name, desiredState) {
        this.name = name
        Object.assign(this, desiredState)
        this.currentState = {}
    }

    _getAuthFromConfig() {
        if (!this.auth) {
            return {}
        }

        return Object.keys(this.auth).reduce((acc, permName) => {
            const permission = this.auth[permName]

            const defaultParent = permName === `owner` ? `` : `owner`

            acc[permName] = {
                threshold: permission.threshold || 1,
                parent: permission.parent || defaultParent,
                keys: [],
                accounts: [],
                waits: [],
                links: permission.links || null,
            }

            permission.permissions.forEach(p => {
                const {spec, weight} = authHelpers.parsePermission(p)

                if (spec.startsWith(`wait@`)) {
                    const seconds = Number.parseInt(spec.replace(`wait@`, ``), 10)
                    acc[permName].waits.push({
                        wait_sec: seconds,
                        weight,
                    })
                } else if (spec.includes(`@`)) {
                    const [actor, specPermission] = spec.split(`@`)
                    acc[permName].accounts.push({
                        permission: {
                            actor,
                            permission: specPermission,
                        },
                        weight,
                    })
                } else {
                    acc[permName].keys.push({
                        key: spec,
                        weight,
                    })
                }
            })

            return acc
        }, {})
    }

    _isCreated() {
        return Boolean(this.currentState.created)
    }

    _assertCreated() {
        if (!this._isCreated()) {
            throw new Error(
                `Account "${
                    this.name
                }" does not exist, but it should at this stage. Try running again.`,
            )
        }
    }

    async fetch({api, delay = 0}) {
        try {
            await utils.sleep(delay)
            this.currentState = await api.rpc.get_account(this.name)
            // get_raw_abi not supported yet by eosjs
            // https://github.com/EOSIO/eosjs/blob/master/src/eosjs-jsonrpc.ts#L121
            const codeInfo = await api.rpc.fetch(`/v1/chain/get_raw_abi`, {
                account_name: this.name,
            })
            this.currentState.code_hash = codeInfo.code_hash
            this.currentState.abi_hash = codeInfo.abi_hash
            // no error => account already exists
            utils.silent(`Account "${this.name}" exists.`)
        } catch (error) {
            // unknown key error => account does not exist yet
            if (/unknown key/i.test(error.message)) {
                utils.info(`Account "${this.name}" does not exist yet.`)

                return
            }
            throw error
        }

        try {
            this.currentState.stakes = (await api.rpc.get_table_rows({
                json: true,
                code: `eosio`,
                scope: this.name,
                table: `delband`,
                lower_bound: 0,
                upper_bound: -1,
                limit: 9999,
            })).rows
        } catch (error) {
            if (/is not specified in the ABI/i.test(error.message)) {
                // running a local network where eosio is not deployed
            } else {
                throw error
            }
        }
    }

    async fetchPermissionLinks({dfuseClient, delay = 0}) {
        if (!dfuseClient) {
            return
        }

        try {
            await utils.sleep(delay)
            const response = await dfuseClient.statePermissionLinks(this.name)
            this.currentState.linkedPermissions = response.linked_permissions
            utils.silent(`Link Permissions for account "${this.name}" fetched.`)
        } catch (error) {
            throw error
        }
    }

    async fetchTokens({api, delay = 0}) {
        if (!this.tokens || this.tokens.length === 0) {
            this.currentState.tokens = []

            return
        }

        try {
            await utils.sleep(delay)
            const accountTablePromises = this.tokens.map(extendedAsset =>
                api.rpc.get_table_rows({
                    json: true,
                    code: extendedAsset.account,
                    scope: this.name,
                    table: `accounts`,
                    lower_bound: 0,
                    upper_bound: -1,
                    limit: 9999,
                }),
            )
            const accountTableResults = (await Promise.all(accountTablePromises)).map(
                result => result.rows,
            )
            const tokenAmounts = this.tokens.map((extendedAsset, index) => {
                const expectedSymbol = utils.decomposeAsset(extendedAsset.amount).symbol
                const tokensOnContract = accountTableResults[index]

                const foundToken = tokensOnContract.find(row => {
                    const {
                        symbol: {symbol, precision},
                    } = utils.decomposeAsset(row.balance)

                    return (
                        expectedSymbol.symbol === symbol && expectedSymbol.precision === precision
                    )
                })

                return foundToken
                    ? foundToken.balance
                    : utils.formatAsset({amount: 0, symbol: expectedSymbol})
            })
            this.currentState.tokens = tokenAmounts
            utils.silent(`Token balances for account "${this.name}" fetched.`)
        } catch (error) {
            throw error
        }
    }

    async create({env}) {
        // account already created
        if (this._isCreated()) {
            return null
        }

        const auth = this._getAuthFromConfig()
        if (!auth.owner || !auth.active) {
            throw new Error(`Missing active and owner permissions to create account "${this.name}"`)
        }

        const actions = [
            {
                account: `eosio`,
                name: `newaccount`,
                authorization: [
                    {
                        actor: env.accounts_manager,
                        permission: `active`,
                    },
                ],
                data: {
                    creator: env.accounts_manager,
                    name: this.name,
                    owner: auth.owner,
                    active: auth.active,
                },
            },
        ]

        if (!isLocalBlockchain({env})) {
            // need to buy ram in same transaction, otherwise newaccount fails
            actions.push({
                account: `eosio`,
                name: `buyrambytes`,
                authorization: [
                    {
                        actor: env.ram_manager,
                        permission: `active`,
                    },
                ],
                data: {
                    payer: env.ram_manager,
                    receiver: this.name,
                    bytes: 3072,
                },
            })
        }

        return actions
    }

    async updateAuth({env}) {
        this._assertCreated()

        const actions = authHelpers.getAuthActions({account: this, env})

        return !Array.isArray(actions) || actions.length === 0 ? null : actions
    }

    async updateRam({env}) {
        this._assertCreated()

        const desiredRam = Number.parseInt(this.ram, 10)
        if (!desiredRam) {
            utils.silent(`No RAM value configured for ${this.name}.`)

            return null
        }

        const currentRam = this.currentState.ram_quota
        if (currentRam === -1 || !Number.isFinite(currentRam)) {
            utils.log(
                `No on-chain RAM value found for ${
                    this.name
                }. Probably running a local network. Skipping RAM purchase.`,
            )

            return null
        }

        const bytesToPurchase = desiredRam - currentRam
        if (!Number.isFinite(bytesToPurchase)) {
            throw new Error(
                `Unexpected RAM bytes value to purchase for account ${
                    this.name
                }: ${bytesToPurchase} (${desiredRam}, ${currentRam})`,
            )
        }

        const RAM_FEE_THRESHOLD = 64
        // buyrambytes is not exact as it converts the bytes to EOS, subtracts fee, and converts back
        if (bytesToPurchase <= RAM_FEE_THRESHOLD) {
            utils.silent(`Account "${this.name}"'s RAM is sufficient (${currentRam / 1024} kB).`)

            return null
        }

        return {
            account: `eosio`,
            name: `buyrambytes`,
            authorization: [
                {
                    actor: env.ram_manager,
                    permission: `active`,
                },
            ],
            data: {
                payer: env.ram_manager,
                receiver: this.name,
                // 0.5% ram fee
                bytes: Math.ceil((bytesToPurchase * 200) / 199),
            },
        }
    }

    async updateBandwidth({env}) {
        this._assertCreated()

        if (!this.cpu && !this.net) {
            utils.silent(`No CPU/NET stakes configured for ${this.name}.`)

            return null
        }

        if (!this.currentState.stakes) {
            utils.log(
                `No on-chain CPU/NET stakes found from ${
                    this.name
                }. Probably running a local network. Skipping CPU/NET purchase.`,
            )

            return null
        }

        const actions = getBandwidthActions({account: this, env})

        return !Array.isArray(actions) || actions.length === 0 ? null : actions
    }

    async updateCode({env}) {
        this._assertCreated()

        if (!this.code && !this.abi) {
            utils.silent(`No Code/ABI configured for ${this.name}.`)

            return null
        }

        if (!this.currentState.code_hash || !this.currentState.abi_hash) {
            throw new Error(
                `Account "${
                    this.name
                }" does not have any valid code_hash or abi_hash fields. Something is wrong.`,
            )
        }

        const actions = getCodeActions({account: this, env})

        return !Array.isArray(actions) || actions.length === 0 ? null : actions
    }

    async updateTokens({env}) {
        this._assertCreated()

        if (!this.tokens || this.tokens.length === 0) {
            utils.silent(`No tokens configured for ${this.name}.`)

            return null
        }

        if (!this.currentState.tokens) {
            throw new Error(
                `Account "${
                    this.name
                }" does not have any valid token balances. Something is wrong.`,
            )
        }

        const actions = getTokenActions({account: this, env})

        return !Array.isArray(actions) || actions.length === 0 ? null : actions
    }
}

module.exports = Account
