const Account = require(`../account`)

const path = require(`path`)

describe(`account.create`, () => {
    const env = {
        accounts_manager: `accntmngr`,
    }

    it(`returns new account action on empty current state`, async () => {
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
        a.currentState = {}
        const actions = await a.create(env)
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
        a.currentState = {
            created: new Date().toISOString(),
        }
        const actions = await a.create(env)
        expect(actions).toBeFalsy()
    })
})
