/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */
const get = require(`lodash/get`)
const isEqual = require(`lodash/isEqual`)
const sortBy = require(`lodash/sortBy`)
const utils = require(`./utils`)

const parsePermission = p => {
    const match = p.match(
        /^(([a-z1-5.]{0,12}[a-j1-5]{0,1}@[a-z1-5.]+)|([\w]*)|(wait@[\d]+))\s*(\d*)?$/,
    )

    if (!match) {
        throw new Error(`Unknown permission specification "${p}" for account "${this.name}".`)
    }
    const [, spec, _, __, ___, weight] = match

    return {
        spec,
        weight: Number.parseInt(weight || 1, 10),
    }
}

const objComparer = obj => JSON.stringify(obj)
const arraysAreEqual = (arr1, arr2) => isEqual(sortBy(arr1, objComparer), sortBy(arr2, objComparer))
const permissionNeedsToBeUpdated = (desired, current) => {
    if (!current) {
        return true
    }

    const {required_auth: currentAuth} = current
    if (desired.parent !== current.parent || desired.threshold !== currentAuth.threshold) {
        return true
    }

    if (
        !arraysAreEqual(desired.keys, currentAuth.keys) ||
        !arraysAreEqual(desired.accounts, currentAuth.accounts) ||
        !arraysAreEqual(desired.waits, currentAuth.waits)
    ) {
        return true
    }

    return false
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
            }

            permission.permissions.forEach(p => {
                const {spec, weight} = parsePermission(p)

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
            utils.silent(`Checking account "${this.name}" ...`)
            this.currentState = await api.rpc.get_account(this.name)
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

        return {
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
        }
    }

    async updateAuth({env}) {
        this._assertCreated()

        const auth = this._getAuthFromConfig()

        const permNamesToUpdate = Object.keys(auth)
            .map(permName => {
                if (
                    permissionNeedsToBeUpdated(
                        auth[permName],
                        this.currentState.permissions.find(p => p.perm_name === permName),
                    )
                ) {
                    return permName
                }

                return null
            })
            .filter(Boolean)

        const requiresUpdate = permNamesToUpdate.length > 0
        if (!requiresUpdate) {
            utils.silent(`Account "${this.name}"'s permissions are up-to-date.`)
        } else {
            utils.silent(
                `Account "${this.name}"'s permissions (${permNamesToUpdate.join(
                    ` `,
                )}) need to be updated.`,
            )
        }

        const actions = permNamesToUpdate.map(permName => ({
            account: `eosio`,
            name: `updateauth`,
            authorization: [
                {
                    actor: this.name,
                    permission: `owner`,
                },
            ],
            data: {
                account: this.name,
                permission: permName,
                parent: auth[permName].parent,
                auth: auth[permName],
            },
        }))

        return requiresUpdate ? actions : null
    }
}

module.exports = Account
