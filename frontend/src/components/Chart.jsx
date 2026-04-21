import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, AreaSeries, LineSeries } from 'lightweight-charts';

const ChartLayout = ({ data, predictionData }) => {
  const chartContainerRef = useRef();
  const chartInstanceRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const bbUpperSeriesRef = useRef(null);
  const bbLowerSeriesRef = useRef(null);
  const predSeriesRef = useRef(null);
  const lastStartRef = useRef(null);
  
  
  // Helper to format raw data using Unix Timestamp (supports both daily and intraday!)
  const formatData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    
    // Use the actual epoch timestamp (in seconds) so lightweight-charts plots intraday correctly
    const uniqueMap = new Map();
    rawData.forEach(d => {
      try {
        if (!Number.isFinite(d.open) || !Number.isFinite(d.close) || !Number.isFinite(d.high) || !Number.isFinite(d.low)) return;
        
        let rawTime = d.date || d.time || d.timestamp;
        if (!rawTime) return;
        
        const timeVal = Math.floor(new Date(rawTime).getTime() / 1000);
        if (Number.isFinite(timeVal) && !isNaN(timeVal)) {
            uniqueMap.set(timeVal, { time: timeVal, open: d.open, high: d.high, low: d.low, close: d.close });
        }
      } catch (e) {}
    });
    return Array.from(uniqueMap.values()).sort((a, b) => a.time - b.time);
  };

  const [chartType, setChartType] = useState('candlestick');
  const chartTypeRef = useRef(chartType);
  useEffect(() => { chartTypeRef.current = chartType; }, [chartType]);

  // Setup/Teardown Chart Instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#8b949e' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      timeScale: { 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });
    chartInstanceRef.current = chart;

    const legend = document.createElement('div');
    legend.style = `position: absolute; left: 12px; top: 50px; z-index: 10; font-family: Outfit; font-size: 14px; font-weight: 600; color: var(--text-primary); pointer-events: none; text-shadow: 0 1px 3px rgba(0,0,0,0.5);`;
    legend.innerHTML = 'Hover over chart';
    chartContainerRef.current.appendChild(legend);

    const handleResize = () => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.point || param.point.x < 0 || param.point.y < 0) {
        legend.innerHTML = 'Hover over chart';
      } else {
        const timeStr = new Date(param.time * 1000).toLocaleString();
        let priceStr = '';
        if (mainSeriesRef.current) {
          const data = param.seriesData.get(mainSeriesRef.current);
          if (data) priceStr = chartTypeRef.current === 'candlestick' ? `Price: ${data.close.toFixed(2)}` : `Price: ${data.value.toFixed(2)}`;
        }
        legend.innerHTML = `<div style="font-size: 1.2rem">${priceStr}</div><div style="font-size: 0.85rem; color: var(--text-secondary)">Time: ${timeStr}</div>`;
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      if (legend && legend.parentNode) legend.parentNode.removeChild(legend);
      chartInstanceRef.current = null;
    };
  }, []);

  // Sync Series when chartType or data changes
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    const chart = chartInstanceRef.current;

    const formattedData = formatData(data);
    if (formattedData.length === 0) return;

    const isNewType = mainSeriesRef.current && mainSeriesRef.current.chartType !== chartType;
    if (isNewType) {
      if (mainSeriesRef.current) {
        try { chart.removeSeries(mainSeriesRef.current); } catch (e) {}
        mainSeriesRef.current = null;
      }
    }

    if (!mainSeriesRef.current) {
      if (chartType === 'candlestick') {
        const series = chart.addSeries(CandlestickSeries, { upColor: '#2ea043', downColor: '#da3633', borderDownColor: '#da3633', borderUpColor: '#2ea043', wickDownColor: '#da3633', wickUpColor: '#2ea043' });
        series.chartType = chartType;
        mainSeriesRef.current = series;
      } else {
        const series = chart.addSeries(AreaSeries, { lineColor: '#58a6ff', topColor: 'rgba(88, 166, 255, 0.4)', bottomColor: 'rgba(88, 166, 255, 0.0)', lineWidth: 2 });
        series.chartType = chartType;
        mainSeriesRef.current = series;
      }
    }

    if (!bbUpperSeriesRef.current) {
      bbUpperSeriesRef.current = chart.addSeries(LineSeries, { color: 'rgba(88, 166, 255, 0.4)', lineWidth: 1, crosshairMarkerVisible: false });
    }
    if (!bbLowerSeriesRef.current) {
      bbLowerSeriesRef.current = chart.addSeries(LineSeries, { color: 'rgba(88, 166, 255, 0.4)', lineWidth: 1, crosshairMarkerVisible: false });
    }
    if (!predSeriesRef.current && predictionData && predictionData.length > 0) {
      predSeriesRef.current = chart.addSeries(AreaSeries, { lineColor: '#ff9800', topColor: 'rgba(255, 152, 0, 0.5)', bottomColor: 'rgba(255, 152, 0, 0.05)', lineWidth: 3, lineStyle: 0 });
    }

    if (chartType === 'candlestick') {
      mainSeriesRef.current.setData(formattedData);
    } else {
      mainSeriesRef.current.setData(formattedData.map(d => ({ time: d.time, value: d.close })));
    }

    const getTimestamp = (d) => {
        if (!d || (!d.date && !d.time && !d.timestamp)) return NaN;
        return Math.floor(new Date(d.date || d.time || d.timestamp).getTime() / 1000);
    };

    const bbUpperData = data.filter(d => Number.isFinite(d.bbUpper)).map(d => ({ time: getTimestamp(d), value: d.bbUpper })).filter(d => Number.isFinite(d.time) && Number.isFinite(d.value)).sort((a,b)=>a.time - b.time);
    const bbLowerData = data.filter(d => Number.isFinite(d.bbLower)).map(d => ({ time: getTimestamp(d), value: d.bbLower })).filter(d => Number.isFinite(d.time) && Number.isFinite(d.value)).sort((a,b)=>a.time - b.time);
    const uniqueBBUpper = Array.from(new Map(bbUpperData.map(item => [item.time, item])).values()).sort((a,b)=>a.time - b.time);
    const uniqueBBLower = Array.from(new Map(bbLowerData.map(item => [item.time, item])).values()).sort((a,b)=>a.time - b.time);

    if (uniqueBBUpper.length > 0) bbUpperSeriesRef.current.setData(uniqueBBUpper);
    if (uniqueBBLower.length > 0) bbLowerSeriesRef.current.setData(uniqueBBLower);

    if (predictionData && predictionData.length > 0 && formattedData.length >= 2) {
      const lastTime = formattedData[formattedData.length - 1].time;
      const prevTime = formattedData[formattedData.length - 2].time;
      let avgGap = lastTime - prevTime;
      if (avgGap <= 0 || !Number.isFinite(avgGap)) avgGap = 86400;
      
      let currentTime = lastTime;
      const futureData = predictionData.map((val) => {
        if (avgGap >= 86400) {
            do { currentTime += 86400; } while (new Date(currentTime * 1000).getUTCDay() === 0 || new Date(currentTime * 1000).getUTCDay() === 6);
        } else {
            currentTime += avgGap;
        }
        const parsedVal = Number(val);
        return { time: currentTime, value: Number.isFinite(parsedVal) ? parsedVal : formattedData[formattedData.length - 1].close };
      }).filter(d => Number.isFinite(d.time) && Number.isFinite(d.value)).sort((a,b) => a.time - b.time);

      if (futureData.length > 0 && predSeriesRef.current) predSeriesRef.current.setData([{ time: lastTime, value: formattedData[formattedData.length - 1].close }, ...futureData]);
    }

    // Only fitContent when chart loads the first time or data bounds significantly change (e.g. timeframe change)
    if (lastStartRef.current !== formattedData[0].time) {
      chart.timeScale().fitContent();
      lastStartRef.current = formattedData[0].time;
    }

  }, [data, predictionData, chartType]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: '8px' }}>
        <button onClick={() => setChartType('candlestick')} style={{ padding: '6px 12px', background: chartType === 'candlestick' ? 'var(--accent-blue)' : 'var(--panel-bg)', color: chartType === 'candlestick' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--panel-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>
          Candlestick
        </button>
        <button onClick={() => setChartType('line')} style={{ padding: '6px 12px', background: chartType === 'line' ? 'var(--accent-blue)' : 'var(--panel-bg)', color: chartType === 'line' ? '#fff' : 'var(--text-primary)', border: '1px solid var(--panel-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s' }}>
          Line Graph
        </button>
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', height: '400px', position: 'relative' }} className="tv-lightweight-charts" />
    </div>
  );
};

export default class Chart extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, errorInfo: error.message }; }
  render() {
    if (this.state.hasError) return <div style={{ color: 'red', padding: 20 }}>Chart Error: {this.state.errorInfo}</div>;
    return <ChartLayout data={this.props.data} predictionData={this.props.predictionData} />;
  }
}
