const cloneDeep = require(`lodash/cloneDeep`)
const Account = require(`../account`)
const setup = require(`./setup`)

const {env, accountConfig, existingAccount} = setup

describe(`account.updateBandwidth`, () => {
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
