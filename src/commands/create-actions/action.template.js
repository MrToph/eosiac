const initEnvironment = require(`eosiac`)

const { sendTransaction, env } = initEnvironment(process.env.EOSIAC_ENV || `<%- envName %>`, { verbose: true })

const accounts = Object.keys(env.accounts)

const CONTRACT_ACCOUNT = accounts[<%- contractAccountIndex %>]

async function action() {
    try {
        await sendTransaction({
            account: <%- actionAccount %>,
            name: `<%- actionName %>`,
            authorization: [
                {
                    actor: <%- actionActor %>,
                    permission: `active`,
                },
            ],
            data: <%- payload %>,
        })
        process.exit(0)
    } catch (error) {
        // ignore
        process.exit(1)
    }
}

action()
