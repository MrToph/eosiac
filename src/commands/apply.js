const path = require(`path`)
const fs = require(`fs`)
const yaml = require(`js-yaml`)

const utils = require(`../utils`)
const schema = require(`../schema`)
const Joi = require(`@hapi/joi`)

async function apply(env, options) {
    let configPath = options.config
    if (!configPath) {
        // handle special .yaml extension
        configPath = `eosiac.yaml`
        if (!fs.existsSync(configPath)) {
            configPath = `eosiac.yml`
        }
    }

    if (!fs.existsSync(configPath)) {
        throw new Error(`Config file "${path.resolve(configPath)}" does not exist.`)
    }

    let configContent = ``
    try {
        configContent = fs.readFileSync(configPath, {encoding: `utf8`})
    } catch (error) {
        throw new Error(`Cannot read config "${path.resolve(configPath)}":\n  ${error.message}`)
    }

    let config = null
    try {
        config = yaml.safeLoad(configContent, {
            onWarning(error) {
                utils.warning(`Warning: ${error}`)
            },
        })
    } catch (error) {
        throw new Error(
            `Error while parsing config "${path.resolve(configPath)}":\n  ${error.message}`,
        )
    }

    const result = Joi.validate(config, schema)
    if (result.error) {
        throw new Error(
            `Error while validating config "${path.resolve(configPath)}":\n  ${result.error}`,
        )
    }

    utils.log(JSON.stringify({config, result}, null, 2))
}

module.exports = apply
