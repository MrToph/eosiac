const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../index`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

describe.only(`account.updateCode`, () => {
    it(`throws when account does not exist yet`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        expect(a.updateCode({env})).rejects.toThrow(/does not exist/i)
    })

    it(`returns no actions to run when same code and ABI deployed`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.ram_quota = accountConfig.ram
        const actions = await a.updateCode({env})
        expect(actions).toBeFalsy()
    })
})
