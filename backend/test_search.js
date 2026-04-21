const yahooFinance = require('yahoo-finance2').default;

async function test() {
  const res = await yahooFinance.search('bdl');
  console.log(JSON.stringify(res.quotes.map(q => ({ symbol: q.symbol, shortname: q.shortname, quoteType: q.quoteType, exchange: q.exchDisp })), null, 2));
}
test();
