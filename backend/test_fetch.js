const http = require('http');
http.get('http://localhost:5000/api/stocks/AAPL', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
        let parsed = JSON.parse(data);
        console.log("Analysis historical format:");
        let hist = parsed.analysis.historical;
        console.log("Length:", hist.length);
        if(hist.length > 0) {
            console.log("First item keys:", Object.keys(hist[0]));
            console.log("First item date value:", hist[0].date);
            console.log("First item open value:", hist[0].open);
            console.log("First item RSI:", hist[0].rsi);
        }
    } catch(e) { console.log("error", e.message, "\n", data) }
  });
});
