import 'globals';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const dummyEl = {
    clientWidth: 100,
    clientHeight: 100,
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    appendChild: () => {},
    style: {}
};

try {
    const chart = createChart(dummyEl, { width: 100, height: 100 });
    console.log("chart methods:", Object.keys(chart));
} catch (e) {
    console.error("Error:", e);
}
