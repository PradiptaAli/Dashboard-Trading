import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Accept up to 25mb for high-res trade screenshots
  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint for AI service
  app.get('/api/ai/health', (req, res) => {
    const hasKey = Boolean(
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') ||
      (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') ||
      process.env.GOOGLE_API_KEY
    );
    res.json({
      status: 'ok',
      hasServerKey: hasKey,
      recommendedModel: 'gemini-2.5-flash',
    });
  });

  // AI Endpoint: Multimodal Trade PnL & Order Ticket Scanner
  app.post('/api/ai/scan-trade', async (req, res) => {
    try {
      const { imageBase64, mimeType, apiKey: userKey } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image base64 data is required' });
      }

      // Strip data URI prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const detectedMime = mimeType || (imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)?.[1] ?? 'image/jpeg');

      const apiKey = (userKey || req.headers['x-api-key'] || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').toString().trim();
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(400).json({
          error: 'Gemini API Key belum dikonfigurasi. Masukkan API Key gratis di menu modal atau file .env.',
          needsApiKey: true,
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `You are a high-precision algorithmic trading journal OCR engine.
Analyze this trade screenshot (such as a Binance/Bybit/OKX/Bitget shared PnL card, MetaTrader MT4/MT5 execution ticket, TradingView order window, cTrader receipt, or broker statement).

Extract all numerical and structural trade execution data with maximum precision:
1. "instrument": Asset symbol (e.g. BTCUSDT, ETHUSDT, SOLUSDT, XAUUSD, EURUSD, US100, NAS100, US30). Normalize standard tickers without extra delimiters.
2. "marketType": Categorize into "Crypto", "Forex", or "CFD".
3. "direction": "LONG" (Buy) or "SHORT" (Sell).
4. "entryPrice": The opening / entry price level as a clean number.
5. "exitPrice": The closing / mark / exit price level as a clean number. If closing price is not explicitly printed but entry price and PnL or ROI are given, calculate or estimate the exit level.
6. "stopLoss": Stop Loss level if printed on ticket, otherwise estimate 1R distance or 0.
7. "takeProfit": Take Profit level if printed on ticket, otherwise 0.
8. "pnl": Net realized profit or loss in USD/USDT (positive number for profit, negative for loss).
9. "roiPercent": Percentage return on investment (e.g. +34.5 or -12.4).
10. "positionSize": Executed size / margin / lots / volume as a number.
11. "sizeUnit": "USDT", "Lots", "Contracts", or "Units".
12. "date": Date in YYYY-MM-DD format if visible, otherwise today's date.
13. "time": Time in HH:mm format if visible, otherwise current time.
14. "brokerOrExchange": Platform name (e.g. Binance, Bybit, MetaTrader 5, OKX, Bitget, etc.).
15. "summary": A concise factual 1-sentence recap of the trade (e.g., "Long BTCUSDT opened at 64,250 and closed at 65,800 realizing +$45.50 (+24.1% ROI)").`;

      const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastError: any = null;
      let responseText = '';

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: detectedMime,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  instrument: { type: Type.STRING },
                  marketType: { type: Type.STRING, enum: ['Crypto', 'Forex', 'CFD'] },
                  direction: { type: Type.STRING, enum: ['LONG', 'SHORT'] },
                  entryPrice: { type: Type.NUMBER },
                  exitPrice: { type: Type.NUMBER },
                  stopLoss: { type: Type.NUMBER },
                  takeProfit: { type: Type.NUMBER },
                  pnl: { type: Type.NUMBER },
                  roiPercent: { type: Type.NUMBER },
                  positionSize: { type: Type.NUMBER },
                  sizeUnit: { type: Type.STRING },
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  brokerOrExchange: { type: Type.STRING },
                  summary: { type: Type.STRING },
                },
                required: ['instrument', 'direction', 'entryPrice', 'exitPrice', 'pnl'],
              },
            },
          });

          responseText = response.text?.trim() || '';
          if (responseText) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} failed, trying next candidate:`, err.message || err);
        }
      }

      if (!responseText && lastError) {
        throw lastError;
      }

      const parsedData = JSON.parse(responseText || '{}');

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error('Gemini Trade Scanner Error:', error);
      return res.status(500).json({
        error: error.message || 'Failed to scan trade screenshot with Gemini AI',
      });
    }
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`TradeOS Terminal server running on port ${port}`);
  });
}

startServer();
