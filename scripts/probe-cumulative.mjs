import {getEquityIncomeMcp} from '../src/bitget-equity-mcp.mjs';
const cases=['AAPL','MSFT'];
for(const ticker of cases){
 const response=await getEquityIncomeMcp(ticker);
 const matches=response.records.filter(x=>Number(x.fiscal_year)===2026);
 console.log(JSON.stringify({ticker,received:response.recordCount,selected:matches.slice(0,18).map(x=>({
   period_ending:x.period_ending,fiscal_year:x.fiscal_year,fiscal_period:x.fiscal_period,
   revenue:x.revenue,operating_income:x.operating_income,eps:x.total_dlt_earnings_common_ps,
   currency_code:x.currency_code
 }))},null,2));
}
