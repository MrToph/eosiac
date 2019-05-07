const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../account`)
const existingAccount = require(`./account.json`)

describe(`account.create`, () => {
    const env = {
        accounts_manager: `accntmngr`,
    }

    it(`returns new account action on empty current state`, async () => {
        expect.assertions(1)
        const accountConfig = {
            auth: {
                owner: {
                    permissions: [`EOS6z98haKv12d8vAJbDUkXmpK3PaKvf3Dv1NApo9MCxJ8oNWssDi`],
                },
                active: {
                    threshold: 2,
                    permissions: [
                        `EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x`,
                        `dapptoken@eosio.code 1`,
                        `wait@600 1`,
                    ],
                },
            },
        }
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        const actions = await a.create({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns no action on existing currentState`, async () => {
        expect.assertions(1)
        const desiredState = {
            auth: {
                owner: {
                    permissions: [`EOS6z98haKv12d8vAJbDUkXmpK3PaKvf3Dv1NApo9MCxJ8oNWssDi`],
                },
                active: {
                    threshold: 2,
                    permissions: [
                        `EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x`,
                        `dapptoken@eosio.code 1`,
                        `wait@600 1`,
                    ],
                },
            },
        }
        const a = new Account(`test`, desiredState)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.create({env})
        expect(actions).toBeFalsy()
    })
})

describe(`account.updateAuth`, () => {
    const env = {
        accounts_manager: `accntmngr`,
    }

    it(`throws when account does not exist yet`, async () => {
        expect.assertions(1)
        const accountConfig = {
            auth: {
                owner: {
                    permissions: [`EOS6z98haKv12d8vAJbDUkXmpK3PaKvf3Dv1NApo9MCxJ8oNWssDi`],
                },
                active: {
                    threshold: 2,
                    permissions: [
                        `EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x`,
                        `dapptoken@eosio.code 1`,
                        `wait@600 1`,
                    ],
                },
            },
        }
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        expect(a.updateAuth({env})).rejects.toThrow(/does not exist/i)
    })

    it(`returns no actions to run when used on same unordered permissions`, async () => {
        expect.assertions(1)
        const accountConfig = {
            auth: {
                owner: {
                    permissions: [`EOS6z98haKv12d8vAJbDUkXmpK3PaKvf3Dv1NApo9MCxJ8oNWssDi`],
                },
                active: {
                    threshold: 2,
                    permissions: [
                        `EOS84UkWvuV4tM8s7ose5wwF8MReUVBCwtSJHUFMdUxBu2B2cTm32`,
                        `EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x`,
                        `dapptoken@eosio.code 1`,
                        `wait@600 1`,
                    ],
                },
            },
        }
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.updateAuth({env})
        expect(actions).toBeFalsy()
    })

    it(`returns updateauth action when used with new permission`, async () => {
        expect.assertions(1)
        const accountConfig = {
            auth: {
                owner: {
                    permissions: [
                        `EOS6z98haKv12d8vAJbDUkXmpK3PaKvf3Dv1NApo9MCxJ8oNWssDi`,
                        `EOS7uSfs552n9hN1U2vidQybeP6dqx2V4qLEB5BdtEGPM3kyhGDnd`,
                    ],
                },
                active: {
                    threshold: 3,
                    permissions: [
                        `EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x`,
                        `EOS84UkWvuV4tM8s7ose5wwF8MReUVBCwtSJHUFMdUxBu2B2cTm32`,
                        `dapptoken@eosio.code 1`,
                        `wait@600 1`,
                    ],
                },
                newnewnew: {
                    threshold: 2,
                    permissions: [`test@active`, `wait@1200 1`],
                },
            },
        }
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.updateAuth({env})
        expect(actions).toMatchSnapshot()
    })
})

describe(`account.updateRam`, () => {
    const env = {
        ram_manager: `rammngr`,
    }

    const accountConfig = {
        ram: 262144,
    }

    it(`throws when account does not exist yet`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        expect(a.updateRam({env})).rejects.toThrow(/does not exist/i)
    })

    it(`returns no actions to run when enough RAM`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.ram_quota = accountConfig.ram
        const actions = await a.updateRam({env})
        expect(actions).toBeFalsy()
    })

    it(`returns updateRam action when not enough RAM`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.updateRam({env})
        expect(actions).toMatchSnapshot()
    })
})

describe(`account.updateBandwidth`, () => {
    const env = {
        funds_manager: `fundsmngr`,
    }

    const accountConfig = {
        cpu: [
            {
                delegate_to: `test`,
                amount: 100 * 1e4,
            },
        ],
        net: [
            {
                delegate_to: `test`,
                amount: 120 * 1e4,
            },
        ],
    }

    it(`throws when account does not exist yet`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        expect(a.updateBandwidth({env})).rejects.toThrow(/does not exist/i)
    })

    it(`returns no actions to run when exact same NET/CPU`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.stakes = [
            {
                from: `test`,
                to: `test`,
                cpu_weight: `100.0000 EOS`,
                net_weight: `120.0000 EOS`,
            },
        ]
        const actions = await a.updateBandwidth({env})
        expect(actions).toBeFalsy()
    })

    it(`returns single delegatebw action when having less NET/CPU`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.stakes = [
            {
                from: `test`,
                to: `test`,
                cpu_weight: `50.0000 EOS`,
                net_weight: `50.0000 EOS`,
            },
        ]
        const actions = await a.updateBandwidth({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns single undelegatebw action when having more NET/CPU`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.stakes = [
            {
                from: `test`,
                to: `test`,
                cpu_weight: `200.0000 EOS`,
                net_weight: `200.0000 EOS`,
            },
        ]
        const actions = await a.updateBandwidth({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns both delegatebw & undelegatebw action when having more NET but less CPU`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.stakes = [
            {
                from: `test`,
                to: `test`,
                cpu_weight: `10.0000 EOS`,
                net_weight: `200.0000 EOS`,
            },
        ]
        const actions = await a.updateBandwidth({env})
        expect(actions).toMatchSnapshot()
    })
})
