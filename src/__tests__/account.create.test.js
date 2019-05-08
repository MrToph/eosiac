const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../account`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

describe(`account.create`, () => {
    it(`returns new account action on empty current state`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = {}
        const actions = await a.create({env})
        expect(actions).toMatchSnapshot()
    })

    it(`returns no action on existing currentState`, async () => {
        expect.assertions(1)
        const a = new Account(`test`, accountConfig)
        a.currentState = cloneDeep(existingAccount)
        const actions = await a.create({env})
        expect(actions).toBeFalsy()
    })
})
