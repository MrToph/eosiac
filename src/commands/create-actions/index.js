const path = require(`path`)
const fs = require(`fs-extra`)
const chalk = require(`chalk`)
const ejs = require(`ejs`)
const prettier = require(`prettier`)

const utils = require(`../../utils`)

const actionsDir = `./actions`
const prettierConfigPath = path.resolve(__dirname, `../../../.prettierrc.js`)

const isNumberType = type => type.includes(`int`)

function createPayload(struct) {
    const obj = struct.fields.reduce(
        (acc, field) =>
            Object.assign(acc, {
                [field.name]: isNumberType(field.type)
                    ? Math.floor(Math.random() * 1000)
                    : `${field.name}`,
            }),
        {},
    )

    return JSON.stringify(obj, null, 4)
}

async function create({abi, contractAccount, envName, env}) {
    const outputPath = path.resolve(actionsDir)
    const actionTemplate = fs.readFileSync(path.join(__dirname, `action.template.js`), `utf8`)
    const compile = ejs.compile(actionTemplate)

    await fs.ensureDirSync(outputPath)
    const contractAccountIndex = Object.keys(env.accounts).findIndex(
        name => name === contractAccount,
    )

    const writeTemplateAction = (action, templateData) => {
        const actionPath = path.join(outputPath, `${action.name}.js`)

        if (fs.existsSync(actionPath)) {
            utils.silent(`Action ${action.name} already exists. Skipping ...`)
        } else {
            const content = prettier.format(compile(templateData), {
                config: prettierConfigPath,
                parser: `babel`,
            })
            fs.writeFileSync(actionPath, content)
            utils.log(`Action ${action.name} created.`)
        }
    }

    abi.actions.forEach(action => {
        const templateData = {
            envName,
            actionAccount: `CONTRACT_ACCOUNT`,
            actionName: action.name,
            actionActor: `CONTRACT_ACCOUNT`,
            contractAccountIndex,
            payload: createPayload(abi.structs.find(({name}) => name === action.type)),
        }
        writeTemplateAction(action, templateData)
    })

    writeTemplateAction(
        {name: `transfer`},
        {
            envName,
            actionAccount: `\`eosio.token\``,
            actionName: `transfer`,
            actionActor: `accounts[${contractAccountIndex + 1}]`,
            contractAccountIndex,
            payload: `{
                from: accounts[${contractAccountIndex + 1}],
                to: CONTRACT_ACCOUNT,
                quantity: \`0.1000 EOS\`,
                memo: \`hello\`,
            }`,
        },
    )
}

async function createActions(envName, accountName, options) {
    const {config, configPath} = utils.getConfig(options.config)

    if (!(envName in config)) {
        throw new Error(
            `Error while using config "${configPath}":\n  Environment "${envName}" not found.`,
        )
    }

    const env = config[envName]

    if (!(accountName in env.accounts)) {
        throw new Error(
            `Error while using config "${configPath}":\n  Account "${accountName}" not found in environment "${envName}".`,
        )
    }

    const contractAccount = env.accounts[accountName]
    if (!contractAccount.abi) {
        throw new Error(
            `Error while using config "${configPath}":\n  No abi specified for account "${accountName}" in environment "${envName}".`,
        )
    }

    const {abi} = contractAccount
    const abiPath = path.resolve(abi)
    if (!fs.existsSync(abiPath)) {
        throw new Error(`ABI file "${abiPath}" does not exist.`)
    }

    let abiContent = ``
    try {
        abiContent = fs.readFileSync(abiPath, {encoding: `utf8`})
    } catch (error) {
        throw new Error(`Cannot read config "${abiPath}":\n  ${error.message}`)
    }

    try {
        abiContent = JSON.parse(abiContent)
    } catch (error) {
        throw new Error(`Cannot parse JSON ABI "${abiPath}":\n  ${error.message}`)
    }

    await create({abi: abiContent, contractAccount: accountName, envName, env})
    utils.log(chalk.green`Success!`)
}

module.exports = createActions
