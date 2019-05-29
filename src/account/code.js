const fs = require(`fs`)
const path = require(`path`)
const crypto = require(`crypto`)
const {Serialize, Api} = require(`eosjs`)
const {TextEncoder, TextDecoder} = require(`util`) // node only; native TextEncoder/Decoder

const utils = require(`../utils`)

const loadFileContents = file => {
    if (!fs.existsSync(file)) {
        throw new Error(`Could not retrieve code file "${path.resolve(file)}".`)
    }

    // no encoding => read as Buffer
    return fs.readFileSync(file)
}

const createHash = contents => {
    const hash = crypto.createHash(`sha256`)
    hash.update(contents)
    const digest = hash.digest(`hex`)

    return digest
}

const jsonToRawAbi = json => {
    const tmpApi = new Api({
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    })
    const buffer = new Serialize.SerialBuffer({
        textEncoder: tmpApi.textEncoder,
        textDecoder: tmpApi.textDecoder,
    })

    const abiDefinition = tmpApi.abiTypes.get(`abi_def`)
    // need to make sure abi has every field in abiDefinition.fields
    // otherwise serialize throws
    const jsonExtended = abiDefinition.fields.reduce(
        (acc, {name: fieldName}) => Object.assign(acc, {[fieldName]: acc[fieldName] || []}),
        json,
    )
    abiDefinition.serialize(buffer, jsonExtended)

    if (!Serialize.supportedAbiVersion(buffer.getString())) {
        throw new Error(`Unsupported abi version`)
    }
    buffer.restartRead()

    // convert to node buffer
    return Buffer.from(buffer.asUint8Array())
}

function getCodeAction({account}) {
    if (!account.code) {
        utils.silent(`No code file specified for account "${account.name}".`)

        return null
    }

    const contents = loadFileContents(account.code)
    const codeHash = createHash(contents)

    if (codeHash === account.currentState.code_hash) {
        utils.silent(`Code for account "${account.name}" is up-to-date.`)

        return null
    }

    const wasm = contents.toString(`hex`)

    return {
        account: `eosio`,
        name: `setcode`,
        authorization: [
            {
                actor: account.name,
                permission: `active`,
            },
        ],
        data: {
            account: account.name,
            vmtype: 0,
            vmversion: 0,
            code: wasm,
        },
    }
}

function getAbiAction({account, env}) {
    if (!account.abi) {
        utils.silent(`No abi file specified for account "${account.name}".`)

        return null
    }

    const contents = loadFileContents(account.abi)

    let abi
    try {
        abi = JSON.parse(contents.toString(`utf8`))
    } catch (error) {
        throw new Error(
            `Cannot parse contents of ABI file ${path.resolve(account.abi)}:\n\t${error.message}`,
        )
    }
    const serializedAbi = jsonToRawAbi(abi)

    const abiHash = createHash(serializedAbi)

    if (abiHash === account.currentState.abi_hash) {
        utils.silent(`ABI for account "${account.name}" is up-to-date.`)

        return null
    }

    return {
        account: `eosio`,
        name: `setabi`,
        authorization: [
            {
                actor: account.name,
                permission: `active`,
            },
        ],
        data: {
            account: account.name,
            abi: serializedAbi.toString(`hex`),
        },
    }
}

const getBandwidthActions = ({account, env}) => {
    const codeAction = getCodeAction({account, env})
    const abiAction = getAbiAction({account, env})

    return [codeAction, abiAction].filter(Boolean)
}

module.exports = getBandwidthActions
