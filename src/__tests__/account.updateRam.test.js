const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../account`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

describe(`account.updateRam`, () => {
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
