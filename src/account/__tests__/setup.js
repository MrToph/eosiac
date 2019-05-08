const fs = require(`fs`)
const path = require(`path`)
const yaml = require(`js-yaml`)
const existingAccount = require(`./account.json`)

const resolve = fileRelativePath => path.resolve(__dirname, fileRelativePath)

const config = yaml.safeLoad(fs.readFileSync(resolve(`./config.test.yml`)), {
    onWarning(error) {
        console.warn(`Warning: ${error}`)
    },
})

const env = config.test
const accountConfig = env.accounts.test

module.exports = {
    env,
    accountConfig,
    existingAccount,
}
