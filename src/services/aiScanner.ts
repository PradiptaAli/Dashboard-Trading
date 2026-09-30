import { MarketType, SizeUnit } from '../types/trade';

export interface AIScanResult {
  instrument: string;
  marketType: MarketType;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number;
  roiPercent?: number;
  positionSize?: number;
  sizeUnit?: SizeUnit;
  date?: string;
  time?: string;
  brokerOrExchange?: string;
  summary?: string;
}

export const SAMPLE_PRESET_CARDS = [
  {
    id: 'binance_btc_win',
    title: 'Binance BTCUSDT Long (+142.50 USDT)',
    url: '/src/assets/images/shared_pnl_sample_1790771631940.jpg',
    expected: 'Profit card showing +$142.50 USDT (+85.4% ROI) on BTCUSDT Perpetual',
  },
  {
    id: 'forex_gold_loss',
    title: 'MT5 XAUUSD Gold Short (-$38.50)',
    url: '/src/assets/images/forex_pnl_sample_1790771644415.jpg',
    expected: 'Loss order ticket showing -$38.50 on XAUUSD Short',
  },
];

export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function urlToBase64(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return fileToBase64(blob);
}

export async function scanTradeScreenshotWithAI(imageBase64: string): Promise<AIScanResult> {
  const response = await fetch('/api/ai/scan-trade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `AI scan request failed with status ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('AI was unable to parse trade details from this image.');
  }

  const data = result.data;

  // Normalize marketType
  let marketType: MarketType = 'Crypto';
  if (data.marketType === 'Forex') marketType = 'Forex';
  else if (data.marketType === 'CFD') marketType = 'CFD';
  else if (data.instrument?.includes('USD') && !data.instrument?.includes('USDT')) {
    marketType = 'Forex';
  }

  // Normalize sizeUnit
  let sizeUnit: SizeUnit = marketType === 'Crypto' ? 'USDT' : 'Lots';
  if (data.sizeUnit === 'Contracts') sizeUnit = 'Contracts';
  else if (data.sizeUnit === 'Units') sizeUnit = 'Units';
  else if (data.sizeUnit === 'Lots') sizeUnit = 'Lots';
  else if (data.sizeUnit === 'USDT') sizeUnit = 'USDT';

  return {
    instrument: (data.instrument || 'BTCUSDT').toUpperCase().replace(/[\/\s-]/g, ''),
    marketType,
    direction: data.direction === 'SHORT' ? 'SHORT' : 'LONG',
    entryPrice: Number(data.entryPrice) || 0,
    exitPrice: Number(data.exitPrice) || 0,
    stopLoss: Number(data.stopLoss) || 0,
    takeProfit: Number(data.takeProfit) || 0,
    pnl: Number(data.pnl) || 0,
    roiPercent: data.roiPercent !== undefined ? Number(data.roiPercent) : undefined,
    positionSize: Number(data.positionSize) || 0,
    sizeUnit,
    date: data.date || new Date().toISOString().split('T')[0],
    time: data.time || new Date().toTimeString().slice(0, 5),
    brokerOrExchange: data.brokerOrExchange || 'Exchange',
    summary: data.summary || '',
  };
}
