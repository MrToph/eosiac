const path = require(`path`)
const fs = require(`fs-extra`)
const chalk = require(`chalk`)
const ecc = require(`eosjs-ecc`)
const crypto = require(`crypto`)

const utils = require(`../../utils`)

async function createKeys(_regex, options) {
    console.log(_regex)
    const flagsIndex = _regex.lastIndexOf(`/`)
    // escape backslash
    const regexString = String.raw`${_regex.substring(1, flagsIndex)}`
    const flagsString = _regex.substring(flagsIndex + 1)
    console.log(regexString, flagsString)
    const regex = new RegExp(regexString, flagsString)

    let counter = 0
    while (true) {
        const randomBytes = crypto.randomBytes(32)
        const sk = ecc.PrivateKey.fromBuffer(randomBytes)
        const pk = sk.toPublic().toString()

        if (regex.test(pk)) {
            utils.log(utils.chalk.blue(`Private key: ${sk.toWif()}\nPublic key:  ${pk}\n`))
        }

        counter += 1
        if (counter % 10000 === 0) {
            utils.info(`Checked ${counter} keys`)
        }
    }
}

module.exports = createKeys
