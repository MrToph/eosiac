const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../index`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

describe(`account.create`, () => {
    let newEnv
    beforeEach(() => {
        newEnv = cloneDeep(env)
        newEnv.accounts.accntmngr = new Account(`accntmngr`, newEnv.accounts.accntmngr)
        newEnv.accounts.accntmngr.currentState = {
            ram_quota: 100,
        }
    })
    it(`returns new account action on empty current state`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        const actions = await a.create({env: newEnv})
        expect(actions).toMatchSnapshot()
    })

    it(`returns no action on existing currentState`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.create({env: newEnv})
        expect(actions).toBeFalsy()
    })
})
