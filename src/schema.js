const Joi = require(`@hapi/joi`)

const nameSchema = Joi.string().regex(/^[a-z1-5.]{0,12}[a-j1-5]{0,1}$/)
const privateKeySchema = Joi.string().regex(/^5/)

const stakedResourceSchema = Joi.object({
    delegate_to: nameSchema.required(),
    amount: Joi.number()
        .integer()
        .positive()
        .required(),
})

const extendedAssetSchema = Joi.object({
    account: nameSchema.required(),
    amount: Joi.string()
        .regex(/^[\d]+\.[\d]* [A-Z]{3,7}$/)
        .required(),
})

const permissionSchema = Joi.string()
    .regex(/^(([a-z1-5.]{0,12}[a-j1-5]{0,1}@[a-z1-5.]+)|(EOS[\w]{50})|(wait@[\d]+))\s*(\d*)?$/)
    .required()
const linkPermissionSchema = Joi.string().regex(/^[a-z1-5.]{0,12}[a-j1-5]{0,1}@[a-z1-5.]{0,100}$/)
const authSchema = Joi.object({
    parent: Joi.string(),
    threshold: Joi.number()
        .integer()
        .positive(),
    permissions: Joi.array()
        .items(permissionSchema)
        .required(),
    links: Joi.array().items(linkPermissionSchema),
})

const accountSchema = Joi.object({
    signature: Joi.object({
        type: Joi.string()
            .valid(`key`, `scatter`)
            .required(),
        private_keys: Joi.array().items(privateKeySchema),
    }),
    auth: Joi.object().pattern(/^/, authSchema),
    ram: Joi.number()
        .integer()
        .positive(),
    cpu: Joi.array().items(stakedResourceSchema),
    net: Joi.array().items(stakedResourceSchema),
    tokens: Joi.array().items(extendedAssetSchema),
    code: Joi.string(),
    abi: Joi.string(),
})

const obfaSchema = Joi.object({
    account: nameSchema.required(),
    permission: nameSchema.required(),
    key: privateKeySchema.required(),
    action: Joi.string()
        .regex(/^[a-z1-5.]{0,12}[a-j1-5]{0,1}@[a-z1-5.]{0,12}[a-j1-5]{0,1}$/)
        .required(),
})

const environmentSchema = Joi.object({
    chain_id: Joi.string()
        .regex(/^[0-9a-f]{64}$/)
        .required(),
    node_endpoint: Joi.string()
        .uri()
        .required(),
    system_contract: nameSchema,
    system_symbol: Joi.string(),
    accounts_manager: nameSchema.required(),
    funds_manager: nameSchema.required(),
    ram_manager: nameSchema.required(),
    cpu_payer: obfaSchema,
    accounts: Joi.object().pattern(/^/, accountSchema),
})

const schema = Joi.object().pattern(/^/, environmentSchema)

module.exports = schema
