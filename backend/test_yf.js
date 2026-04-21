const yf = require('yahoo-finance2');
const { YahooFinance } = require('yahoo-finance2');

try {
  const instance = new YahooFinance();
  instance.quote('AAPL').then(res => console.log('Instance success')).catch(console.error);
} catch (e) {
  console.log('Failed instance instantiation', e.message);
}
