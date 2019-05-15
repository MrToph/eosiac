const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../index`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

const existingActivePermissions = {
    threshold: 2,
    permissions: [
        `EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x`,
        `EOS84UkWvuV4tM8s7ose5wwF8MReUVBCwtSJHUFMdUxBu2B2cTm32`,
        `dapptoken@eosio.code 1`,
        `wait@600 1`,
    ],
}

describe(`account.updateAuth`, () => {
    it(`throws when account does not exist yet`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        expect(a.updateAuth({env})).rejects.toThrow(/does not exist/i)
    })

    it(`returns no actions to run when used on same unordered permissions`, async () => {
        expect.assertions(1)
        const $accountConfig = cloneDeep(accountConfig)
        $accountConfig.auth.active.permissions = [
            `EOS84UkWvuV4tM8s7ose5wwF8MReUVBCwtSJHUFMdUxBu2B2cTm32`,
            `EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x`,
            `dapptoken@eosio.code 1`,
            `wait@600 1`,
        ]
        const a = new Account(`test`, $accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.updateAuth({env})
        expect(actions).toBeFalsy()
    })

    it(`returns updateauth action when used with new permission`, async () => {
        expect.assertions(1)
        const $accountConfig = cloneDeep(accountConfig)
        $accountConfig.auth = {
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
        }
        const a = new Account(`test`, $accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.updateAuth({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns updateauth and linkauth action when used with new permission`, async () => {
        expect.assertions(1)
        const $accountConfig = cloneDeep(accountConfig)
        $accountConfig.auth = Object.assign($accountConfig.auth, {
            xtransfer: {
                parent: `active`,
                permissions: [`test@active`],
                links: [`eosio.token@transfer`],
            },
            active: existingActivePermissions,
        })
        const a = new Account(`test`, $accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.updateAuth({env})
        expect(actions).toMatchSnapshot()
    })

    it(`skips linkauth action when already linked`, async () => {
        expect.assertions(1)
        const $accountConfig = cloneDeep(accountConfig)
        $accountConfig.auth = Object.assign($accountConfig.auth, {
            xtransfer: {
                parent: `active`,
                permissions: [`test@active`],
                links: [`eosio.token@transfer`],
            },
            active: existingActivePermissions,
        })
        const a = new Account(`test`, $accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.linkedPermissions = [
            {contract: `eosio.token`, action: `transfer`, permission_name: `xtransfer`},
        ]
        const actions = await a.updateAuth({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns unlinkauth action when linked but should not be anymore`, async () => {
        expect.assertions(1)
        const $accountConfig = cloneDeep(accountConfig)
        $accountConfig.auth = Object.assign($accountConfig.auth, {
            xtransfer: {
                parent: `active`,
                permissions: [`test@active`],
            },
            active: existingActivePermissions,
        })
        const a = new Account(`test`, $accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.linkedPermissions = [
            {contract: `eosio.token`, action: `transfer`, permission_name: `xtransfer`},
        ]
        const actions = await a.updateAuth({env})
        expect(actions).toMatchSnapshot()
    })
})
