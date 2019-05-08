#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
using namespace eosio;

CONTRACT hello : public eosio::contract
{
public:
  using contract::contract;

  ACTION hi( name user ) {
    print_f( "Hello % from hello", user );
  }
};
