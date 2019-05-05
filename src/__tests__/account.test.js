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
        a.currentState = existingAccount
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
        a.currentState = existingAccount
        const actions = await a.updateAuth({env})
        expect(actions).toMatchSnapshot()
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
        a.currentState = existingAccount
        const actions = await a.updateAuth({env})
        expect(actions).toMatchSnapshot()
    })
})
