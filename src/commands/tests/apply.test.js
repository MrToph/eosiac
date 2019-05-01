const path = require(`path`)

const apply = require(`../apply`)
const resolve = fileRelativePath => path.resolve(__dirname, fileRelativePath)

describe(`eosiac`, () => {
    test(`apply throws on non-existant config file`, () =>
        expect(apply(`dev`, {config: resolve(`./configs/no-exist.yml`)})).rejects.toThrow(
            /Config file .* does not exist/i,
        ))

    test(`apply throws on malformed config file`, () =>
        expect(apply(`dev`, {config: resolve(`./configs/malformed.yml`)})).rejects.toThrow())

    test(`apply throws on wrong schema`, () =>
        expect(apply(`dev`, {config: resolve(`./configs/wrong-schema.yml`)})).rejects.toThrow(
            /THIS IS WRONG.* fails to match/i,
        ))

    test(`apply throws on non-existant environment`, () =>
        expect(apply(`ethereum`, {config: resolve(`./configs/default.yml`)})).rejects.toThrow(
            /Environment ethereum not found/i,
        ))

    test(`apply should create one account`, async () => {
        expect.assertions(1)
        const result = await apply(`dev`, {config: resolve(`./configs/default.yml`)})
        expect(result).toBeUndefined()
    })
})
