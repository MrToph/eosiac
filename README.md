> ⚠️ `eosiac` is currently under active development and not yet released. If you want to get involved, see the [Contributing guidelines](#contributing).

# eosiac


`eosiac` (**EOS** **I**nfrastructure-**a**s-**c**ode) is an [Infrastructure-as-code](https://en.wikipedia.org/wiki/Infrastructure_as_code) tool to manage EOS accounts for complex dapps.
Dapps involve many accounts that require non-trivial setup (permissions, code, tokens, RAM, CPU, NET) often in multiple environments (mainnet, testnet, dev).
`eosiac` automates the whole process by defining these environments in a **declarative way** through [**human-readable files**](#configuration-example) that are easy to understand even for non-developers.

## Configuration Example

Configurations are stored in an `eosiac.yml` [YAML](https://learnxinyminutes.com/docs/yaml/)-file and define environments and accounts in a **declarative way** by specifying the desired state of the accounts.

```yaml
---
dev:
  chain_id: cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f
  node_endpoint: http://localhost:8080
  accounts_manager: eosio # account signing the new_account actions (needed when creating the accounts for the first time)
  funds_manager: eosio # account distributing tokens to accounts (liquid ones but also for staking)
  ram_manager: eosio # account buying RAM for accounts

  accounts:
    eosio:
      signature:
        type: key
        private_keys:
          - 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3
    dapptoken:
      auth:
        owner:
          permissions:
            - EOS6z98haKv12d8vAJbDUkXmpK3PaKvf3Dv1NApo9MCxJ8oNWssDi
        active:
          # parent: owner # implicit for active
          threshold: 2
          permissions:
            - EOS5nYs7LDcFcVtFmnYrhYQv9Z8DPDd1r4MJ8na2MvcPPJkXwzM3x 2
            - dapptoken@eosio.code 1
            - wait@600 1
      ram: 262144 # 256KB of RAM
      # stake resources to self
      cpu:
        - delegate_to: dapptoken
          amount: 10000 # 1 EOS
      net:
        - delegate_to: dapptoken
          amount: 1e4 # 1 EOS
      tokens:
        - account: eosio.token
          symbol: EOS
          amount: 10000 # 1 EOS (unstaked)
      code: contracts/dapptoken/dapptoken.wasm
      abi: contracts/dapptoken/dapptoken.abi


jungle:
  chain_id: e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473
  node_endpoint: https://jungle2.cryptolions.io:443

mainnet:
  chain_id: aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906
  node_endpoint: https://public.eosinfra.io

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

## Contributing

To get involved please join or create a discussion in the GitHub issues.

# Sponsors

[![Learn EOS Development](./.README/learneos.png)](https://learneos.dev)
