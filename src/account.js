const get = require(`lodash/get`)
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

class Account {
    constructor(name, desiredState) {
        this.name = name
        Object.assign(this, desiredState)
        this.currentState = {}
    }

    async fetch(api) {
        try {
            utils.silent(`Checking account "${this.name}" ...`)
            this.currentState = await api.rpc.get_account(this.name)
            utils.silent(`Account "${this.name}" exists.`)
            // no error => account already exists
        } catch (error) {
            // unknown key error => account does not exist yet
            if (/unknown key/i.test(error.message)) {
                utils.info(`Account "${this.name}" does not exist yet.`)

                return
            }
            throw error
        }
    }

    getAuth() {
        if (!this.auth) {
            return {}
        }

        return Object.keys(this.auth).reduce((acc, permName) => {
            const permission = this.auth[permName]
            acc[permName] = {
                threshold: permission.threshold || 1,
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

    async create(env) {
        // account already created
        if (this.currentState.created) {
            return null
        }

        const auth = this.getAuth()
        if (!auth.owner || !auth.active) {
            throw new Error(`Missing active and owner permissions to create account "${this.name}"`)
        }

        return {
            account: env.accounts_manager,
            name: `newaccount`,
            authorization: [
                {
                    actor: env.accounts_manager,
                    permission: `active`,
                },
            ],
            data: {
                creator: `eosio`,
                name: this.name,
                owner: auth.owner,
                active: auth.active,
            },
        }
    }
}

module.exports = Account
