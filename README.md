> ⚠️ `eosiac` is currently under active development and a **beta** release. It is not yet recommended for production use. If you want to get involved, see the [Contributing guidelines](#contributing).

# eosiac


`eosiac` (**EOS** **I**nfrastructure-**a**s-**c**ode) is an [Infrastructure-as-code](https://en.wikipedia.org/wiki/Infrastructure_as_code) tool to manage EOS accounts for complex dapps.
Dapps involve many accounts that require non-trivial setup (permissions, code, tokens, RAM, CPU, NET) often in multiple environments (mainnet, testnet, dev).
`eosiac` automates the whole process by defining these environments in a **declarative way** through [**human-readable files**](#configuration-example) that are easy to understand even for non-developers.

## Features

* configured through simple-to-read configuration files
* support for several environments
* create accounts
* create/update permissions including _keys_, _accounts_, and _weights_
* stake CPU/NET
* buy RAM
* link permissions (only on EOS Mainnet, Jungle, and Kylin environmnets)
* upload code / abi
* distribute any token
* sign with hard-coded private keys or [Scatter](https://get-scatter.com)
* use ONLY_BILL_FIRST_AUTHORIZER to pay for transactions (see cpu_payer object)
* fully idempotent: only runs actions that are necessary to bring the environment to the specified setup - making it safe to script abortions, re-runs, running in CI

Additional features:
* scaffold contract actions through the `create-actions` command
* create vanity EOS public keys (`eosiac create-keys --help`)
* get public key for a private key (`eosiac key-to-public --help`)

## Configuration Example

Configurations are stored in an `eosiac.yml` [YAML](https://learnxinyminutes.com/docs/yaml/)-file and define environments and accounts in a **declarative way** by specifying the desired state of the accounts.

```yaml
---
dev:
  chain_id: cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f
  node_endpoint: http://localhost:7777
  accounts_manager: eosio # account signing the new_account actions (needed when creating the accounts for the first time)
  funds_manager: eosio # account distributing tokens to accounts (liquid ones but also for staking)
  ram_manager: eosio # account buying RAM for accounts

  accounts:
    eosio:
      signature:
        type: key
        private_keys:
          - 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3
    account123:
      signature:
        type: key
        private_keys:
          - 5JxfmGBJkKqHhcfmbGnwuhjrzxg3bd7D46hEpT8V634L2G7ptLr # active
          - 5K5stUB6Do1XKvNCKv4Qh7JtPWzGd6sm12bBnRSD5gaA76a8TFE # owner, for _updateauth_
      auth:
        owner:
          permissions:
            - EOS8ktnmUMpc5GLFwBa5bp3n2djwBUuV7BcZR3fS1dxQ7RFzQLf6v
        active:
          # parent: owner # implicit for active
          threshold: 2
          permissions:
            - EOS7RTtzjKfoTBt4WR6ZMVgCfuM51fj4AbyzexhCqFWUk8BbK2EG7 2
            - dapptoken@eosio.code 1
            - wait@600 1
        ops:
          parent: owner
          threshold: 1
          permissions:
            - EOS62mKPAN7T48aPdi8ZYRcPFWURgw9JMjz52yxijDAwRV8GwCzmY
      tokens:
        - account: eosio.token
          amount: 1.0000 EOS
      code: examples/contracts/hello/hello.wasm
      abi: examples/contracts/hello/hello.abi

kylin:
  chain_id: 5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191
  node_endpoint: https://api-kylin.eoslaomao.com
  accounts_manager: eosiactester # account signing the new_account actions (needed when creating the accounts for the first time)
  funds_manager: eosiactester # account distributing tokens to accounts (liquid ones but also for staking)
  ram_manager: eosiactester # account buying RAM for accounts

  # if you want to use the OBFA feature to pay for CPU/NET
  cpu_payer:
    account: cmichelkylin
    permission: payforcpu
    key: 5KMMoB5yStEbHsWNTaCie55rN2ZswnxqDiWuta2nG88AfEPo3X4
    action: cmichelkylin@payforcpu # the noop action to insert as first action of the tx

  accounts:
    eosiactester:
      signature:
        type: scatter
      cpu:
        - delegate_to: eosiactester
          amount: 100000
        - delegate_to: eosiactestxx
          amount: 100000
      net:
        - delegate_to: eosiactester
          amount: 10000
        - delegate_to: eosiactestxx
          amount: 10000
      auth:
        owner:
          permissions:
            - EOS7dbJSQxad9BwYVBSugD4J9fBWEkZXYLuVjhQTPUTRqmmpQDzqq
        active:
          permissions:
            - EOS7dbJSQxad9BwYVBSugD4J9fBWEkZXYLuVjhQTPUTRqmmpQDzqq

    eosiactestxx:
      signature:
        type: scatter
      auth:
        owner:
          permissions:
            - EOS7hf99wqEqmibs9VC5Tvmv94ym6JaRgbjGVLGFkffdZZYxLrweR
        active:
          permissions:
            - EOS7hf99wqEqmibs9VC5Tvmv94ym6JaRgbjGVLGFkffdZZYxLrweR
        xtransfer:
          parent: active
          permissions:
            - EOS6TJmDVcHe94P4i3rtRMRS8rveE4oG7Zqxz2s1zj9sL5ekvLtkH
          links:
            - eosio.token@transfer
            - eosio.token@issue
      ram: 100000
      tokens:
        - account: eosio.token
          amount: 0.1337 EOS
      code: examples/contracts/hello/hello.wasm
      abi: examples/contracts/hello/hello.abi


jungle:
  chain_id: e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473
  node_endpoint: https://jungle2.cryptolions.io:443
  accounts_manager: someaccnt
  funds_manager: someaccnt
  ram_manager: someaccnt

wax:
  chain_id: 1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4
  node_endpoint: https://chain.wax.io:443
  accounts_manager: someaccnt
  funds_manager: someaccnt
  ram_manager: someaccnt

mainnet:
  chain_id: aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906
  node_endpoint: https://public.eosinfra.io
  accounts_manager: someaccnt
  funds_manager: someaccnt
  ram_manager: someaccnt
```


## Usage

```bash
eosiac apply <environment> [--config path]

eosiac apply dev # will look for an `eosiac.yml` file in current directory
eosiac apply mainnet --config 'configs/eos_config.yml'
```

Upon running the tool on a configuration, it will determine the actions that need to be run to bring the accounts to the desired state.
To sign the transactions, _signatures_ need to be configured on the `*_manager` accounts.

Currently supported signature providers are:

1. directly _providing the private-keys_ (recommened for `dev` environments only) 
2. [Scatter](https://get-scatter.com)

> The tool's execution is _idempotent_ - meaning if the blockchain is already in the desired state, it will do nothing.

### Scaffolding actions

```bash
eosiac create-actions <environment> <account>
```

## Contributing

To get involved please join or create a discussion in the GitHub issues.

# Sponsors

[![Learn EOS Development](./.README/learneos.png)](https://learneos.dev)
