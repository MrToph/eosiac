const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../index`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

describe(`account.updateTokens`, () => {
    it(`throws when account does not exist yet`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        expect(a.updateTokens({env})).rejects.toThrow(/does not exist/i)
    })

    it(`returns no actions to run when exact same token`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.tokens = [`100.0000 EOS`]
        const actions = await a.updateTokens({env})
        expect(actions).toBeFalsy()
    })

    it(`returns positive transfer action`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.updateTokens({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns negative transfer action`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.tokens = [`200.0000 EOS`]
        const actions = await a.updateTokens({env})
        expect(actions).toMatchSnapshot()
    })
})
