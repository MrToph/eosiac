#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
using namespace eosio;

CONTRACT hello : public eosio::contract
{
public:
  using contract::contract;

  ACTION hi( time_point_sec tps, time_point tp, uint32_t ts ) {
    print_f( "Hello % from hello", tps.sec_since_epoch() );
    print_f( "Hello % from hello", tp.sec_since_epoch() );
    print_f( "Hello % from hello", ts );
  }
};
