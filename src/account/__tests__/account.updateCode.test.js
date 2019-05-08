const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../index`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

describe(`account.updateCode`, () => {
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

    it(`returns setcode action on different code hash`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.code_hash = `0123456789abcdef`
        const actions = await a.updateCode({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns setabi action on different abi hash`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        a.currentState.abi_hash = `0123456789abcdef`
        const actions = await a.updateCode({env})
        expect(actions).toMatchSnapshot()
    })
})
