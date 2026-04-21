const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

async function test() {
    try {
        const result = await yahooFinance.chart('AAPL', { period1: '2023-01-01', interval: '1d' }, { validateResult: false });
        console.log("Daily first row:", JSON.stringify(result.quotes[0], null, 2));
    } catch(e) { console.error(e) }
}
test();
