import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Check, Upload, Calculator, ArrowRight, ShieldCheck, Sparkles, Coins, DollarSign, Loader2, Camera, Image as ImageIcon, ChevronDown, ChevronUp, Key, Eye, EyeOff, ExternalLink, RefreshCw } from 'lucide-react';
import { Trade, Direction, TradeResult, TradingSession, Timeframe, EmotionState, TradingPlan, MarketType, SizeUnit } from '../../types/trade';
import { checkPlanViolations } from '../../utils/calculations';
import {
  scanTradeScreenshotWithAI,
  fileToBase64,
  urlToBase64,
  SAMPLE_PRESET_CARDS,
  PresetCardItem,
  getStoredApiKey,
  setStoredApiKey,
  hasApiKey,
  testGeminiApiKey,
} from '../../services/aiScanner';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  initialTrade?: Trade | null;
  tradingPlan: TradingPlan;
  accountBalance: number;
}

const MARKET_SUGGESTIONS: Record<MarketType, { sym: string; name: string; defaultEntry: number; defaultStep: number }[]> = {
  Crypto: [
    { sym: 'BTCUSDT', name: 'Bitcoin', defaultEntry: 64000.0, defaultStep: 600.0 },
    { sym: 'ETHUSDT', name: 'Ethereum', defaultEntry: 2650.0, defaultStep: 35.0 },
    { sym: 'SOLUSDT', name: 'Solana', defaultEntry: 155.0, defaultStep: 3.0 },
    { sym: 'SUIUSDT', name: 'Sui', defaultEntry: 1.85, defaultStep: 0.05 },
    { sym: 'DOGEUSDT', name: 'Dogecoin', defaultEntry: 0.125, defaultStep: 0.003 },
    { sym: 'PEPEUSDT', name: 'Pepe', defaultEntry: 0.0000105, defaultStep: 0.0000004 },
  ],
  Forex: [
    { sym: 'XAUUSD', name: 'Gold Spot', defaultEntry: 2450.0, defaultStep: 10.0 },
    { sym: 'EURUSD', name: 'Euro / USD', defaultEntry: 1.0900, defaultStep: 0.0020 },
    { sym: 'GBPUSD', name: 'GBP / USD', defaultEntry: 1.3000, defaultStep: 0.0025 },
    { sym: 'USDJPY', name: 'USD / JPY', defaultEntry: 144.50, defaultStep: 0.50 },
    { sym: 'GBPJPY', name: 'GBP / JPY', defaultEntry: 188.00, defaultStep: 0.60 },
  ],
  CFD: [
    { sym: 'US100', name: 'Nasdaq 100 Futures', defaultEntry: 19800.0, defaultStep: 60.0 },
    { sym: 'US500', name: 'S&P 500 Index', defaultEntry: 5500.0, defaultStep: 20.0 },
    { sym: 'US30', name: 'Dow Jones', defaultEntry: 42000.0, defaultStep: 150.0 },
    { sym: 'WTI', name: 'Crude Oil', defaultEntry: 72.50, defaultStep: 1.2 },
    { sym: 'NVDA', name: 'Nvidia Equity CFD', defaultEntry: 125.0, defaultStep: 2.5 },
  ],
};

const PRESET_STRATEGIES = ['Liquidity Sweep', 'Breakout', 'Pullback', 'Reversal', 'Scalping', 'Trend Following'];
const PRESET_SETUPS = [
  'NY Open Liquidity Sweep',
  'London Breakout Retest',
  'Prev Day High/Low Sweep',
  'Fair Value Gap (FVG) Fill',
  'Order Block (OB) Retest',
  'Bull Flag Momentum',
  'Asia Range Liquidity Run',
  'Break of Structure (BOS)',
];
const PRESET_EMOTIONS: EmotionState[] = [
  'Calm & Focused',
  'FOMO',
  'Revenge',
  'Fear / Hesitant',
  'Greed',
  'Boredom',
  'Overconfident',
  'Anxious',
];
const PRESET_MISTAKES = [
  'None',
  'Chased entry',
  'Moved stop loss',
  'Exited prematurely',
  'Oversized position',
  'Ignored trading plan',
];

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrade,
  tradingPlan,
  accountBalance,
}) => {
  const isEditing = Boolean(initialTrade);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [marketType, setMarketType] = useState<MarketType>('Crypto');
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('USDT');
  const [instrument, setInstrument] = useState('BTCUSDT');
  const [direction, setDirection] = useState<Direction>('LONG');

  // Pricing inputs
  const [entryPrice, setEntryPrice] = useState<number>(64000.0);
  const [stopLoss, setStopLoss] = useState<number>(63400.0);
  const [takeProfit, setTakeProfit] = useState<number>(65200.0);
  const [exitPrice, setExitPrice] = useState<number>(65200.0);

  // Interactive Realized Outcome (P&L and R-Multiple)
  const [pnl, setPnl] = useState<number>(10.0);
  const [rMultiple, setRMultiple] = useState<number>(2.0);

  // Direct Manual Sizing state (default editable by user)
  const [positionSize, setPositionSize] = useState<number>(500);

  // Strategy and Context
  const [strategy, setStrategy] = useState('Liquidity Sweep');
  const [setup, setSetup] = useState('NY Open Liquidity Sweep');
  const [timeframe, setTimeframe] = useState<Timeframe>('M15');
  const [session, setSession] = useState<TradingSession>('New York');
  const [entryReason, setEntryReason] = useState('Clean sweep of prior liquidity with market structure shift.');
  const [exitReason, setExitReason] = useState('Target profit reached at opposing liquidity pool.');
  const [emotion, setEmotion] = useState<EmotionState>('Calm & Focused');
  const [confidence, setConfidence] = useState<number>(8);
  const [discipline, setDiscipline] = useState<number>(9);
  const [mistake, setMistake] = useState<string>('None');
  const [tagsInput, setTagsInput] = useState<string>('Crypto, Breakout, A+ Setup');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('/src/assets/images/chart_breakout_setup_1790744925578.jpg');
  const [notes, setNotes] = useState<string>('');
  const [holdingMinutes, setHoldingMinutes] = useState<number>(45);

  // Collapse/Expand state
  const [isStrategyExpanded, setIsStrategyExpanded] = useState(false);
  const [isPsychologyExpanded, setIsPsychologyExpanded] = useState(false);

  // AI Scanner state
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanError, setAiScanError] = useState<string | null>(null);
  const [aiScanSuccess, setAiScanSuccess] = useState<string | null>(null);
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);
  const [isAiCardExpanded, setIsAiCardExpanded] = useState(!isEditing);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Key Configuration State
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keyStatusMessage, setKeyStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [hasConfiguredKey, setHasConfiguredKey] = useState(hasApiKey());

  const handleSaveApiKey = () => {
    setStoredApiKey(apiKeyInput);
    const configured = hasApiKey();
    setHasConfiguredKey(configured);
    setKeyStatusMessage({
      text: configured ? 'API Key berhasil disimpan di browser.' : 'API Key dihapus. Menggunakan Mode Cepat / Offline.',
      isError: false,
    });
    setTimeout(() => setKeyStatusMessage(null), 3500);
  };

  const handleTestApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeyStatusMessage({ text: 'Ketik atau paste Gemini API Key terlebih dahulu.', isError: true });
      return;
    }
    setIsTestingKey(true);
    setKeyStatusMessage(null);
    const result = await testGeminiApiKey(apiKeyInput);
    setIsTestingKey(false);
    setKeyStatusMessage({
      text: result.message,
      isError: !result.success,
    });
    if (result.success) {
      setStoredApiKey(apiKeyInput);
      setHasConfiguredKey(true);
    }
  };

  // 1R = 1% dari total balance ($5.00 untuk akun $500)
  const balance = accountBalance > 0 ? accountBalance : 500;
  const riskAmount1R = Number((balance * 0.01).toFixed(2));

  const executeAiScan = async (base64: string, previewUrl?: string, presetItem?: PresetCardItem) => {
    setIsAiScanning(true);
    setAiScanError(null);
    setAiScanSuccess(null);
    if (previewUrl) {
      setAiPreviewUrl(previewUrl);
      setScreenshotUrl(previewUrl);
    }
    try {
      const data = await scanTradeScreenshotWithAI(base64, presetItem?.id);
      if (data.instrument) setInstrument(data.instrument);
      if (data.marketType) setMarketType(data.marketType);
      if (data.direction) setDirection(data.direction);
      if (data.entryPrice) setEntryPrice(data.entryPrice);
      if (data.exitPrice) setExitPrice(data.exitPrice);
      if (data.stopLoss && data.stopLoss > 0) setStopLoss(data.stopLoss);
      if (data.takeProfit && data.takeProfit > 0) setTakeProfit(data.takeProfit);
      if (data.positionSize && data.positionSize > 0) setPositionSize(data.positionSize);
      if (data.sizeUnit) setSizeUnit(data.sizeUnit);
      if (data.date) setDate(data.date);
      if (data.time) setTime(data.time);
      if (data.pnl !== undefined) {
        setPnl(data.pnl);
        const computedR = riskAmount1R > 0 ? Number((data.pnl / riskAmount1R).toFixed(2)) : 0;
        setRMultiple(computedR);
      }
      if (data.summary) {
        setNotes(prev => (prev ? `${prev}\n[AI Note]: ${data.summary}` : `[AI Note]: ${data.summary}`));
      }

      const engineName =
        data.scanEngine === 'preset-verified'
          ? 'Preset Terverifikasi'
          : data.scanEngine === 'gemini-client'
          ? 'Gemini 2.5 Flash (Direct API)'
          : data.scanEngine === 'gemini-cloud'
          ? 'Gemini 2.5 Flash (Server)'
          : 'Smart Local Scanner';

      setAiScanSuccess(
        `[${engineName}] ${data.instrument} ${data.direction} · Open: ${data.entryPrice} · Close: ${data.exitPrice} · Net P&L: ${data.pnl >= 0 ? '+' : ''}$${data.pnl.toFixed(2)}${data.roiPercent !== undefined ? ` (${data.roiPercent >= 0 ? '+' : ''}${data.roiPercent}%)` : ''} · Platform: ${data.brokerOrExchange || 'Exchange'}`
      );
    } catch (err: any) {
      console.error(err);
      setAiScanError(err.message || 'Gagal memindai screenshot dengan AI.');
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleFileUploadScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      executeAiScan(base64, base64);
    }
  };

  const handlePresetScan = async (preset: PresetCardItem) => {
    setIsAiScanning(true);
    setAiScanError(null);
    setAiPreviewUrl(preset.url);
    setScreenshotUrl(preset.url);

    // Direct verified instant data loading
    const data = preset.data;
    if (data.instrument) setInstrument(data.instrument);
    if (data.marketType) setMarketType(data.marketType);
    if (data.direction) setDirection(data.direction);
    if (data.entryPrice) setEntryPrice(data.entryPrice);
    if (data.exitPrice) setExitPrice(data.exitPrice);
    if (data.stopLoss && data.stopLoss > 0) setStopLoss(data.stopLoss);
    if (data.takeProfit && data.takeProfit > 0) setTakeProfit(data.takeProfit);
    if (data.positionSize && data.positionSize > 0) setPositionSize(data.positionSize);
    if (data.sizeUnit) setSizeUnit(data.sizeUnit);
    if (data.date) setDate(data.date);
    if (data.time) setTime(data.time);
    if (data.pnl !== undefined) {
      setPnl(data.pnl);
      const computedR = riskAmount1R > 0 ? Number((data.pnl / riskAmount1R).toFixed(2)) : 0;
      setRMultiple(computedR);
    }
    if (data.summary) {
      setNotes(prev => (prev ? `${prev}\n[Preset Note]: ${data.summary}` : `[Preset Note]: ${data.summary}`));
    }
    setAiScanSuccess(
      `[Preset Terverifikasi] ${data.instrument} ${data.direction} · Open: ${data.entryPrice} · Close: ${data.exitPrice} · Net P&L: ${data.pnl >= 0 ? '+' : ''}$${data.pnl.toFixed(2)}${data.roiPercent !== undefined ? ` (${data.roiPercent >= 0 ? '+' : ''}${data.roiPercent}%)` : ''} · Platform: ${data.brokerOrExchange}`
    );
    setIsAiScanning(false);
  };

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const base64 = await fileToBase64(file);
            executeAiScan(base64, base64);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, riskAmount1R]);

  // Compute recommended position size
  const stopDistance = Math.abs(entryPrice - stopLoss) || 1;
  const stopDistancePercent = entryPrice > 0 ? (stopDistance / entryPrice) * 100 : 1;

  let autoRecommendedSize = 0;
  if (sizeUnit === 'USDT' || marketType === 'Crypto') {
    autoRecommendedSize = stopDistancePercent > 0 ? Number(((riskAmount1R / stopDistancePercent) * 100).toFixed(2)) : 500;
  } else {
    autoRecommendedSize = stopDistance > 0 ? Number((riskAmount1R / stopDistance).toFixed(4)) : 0.5;
  }

  // Initialize or reset trade data
  useEffect(() => {
    if (initialTrade) {
      setDate(initialTrade.date);
      setTime(initialTrade.time || '10:00');
      setInstrument(initialTrade.instrument);
      const isCrypto = initialTrade.instrument.includes('USDT');
      setMarketType(initialTrade.marketType || (isCrypto ? 'Crypto' : 'Forex'));
      setSizeUnit(initialTrade.sizeUnit || (isCrypto ? 'USDT' : 'Lots'));
      setDirection(initialTrade.direction);
      setEntryPrice(initialTrade.entryPrice);
      setStopLoss(initialTrade.stopLoss);
      setTakeProfit(initialTrade.takeProfit);
      setExitPrice(initialTrade.exitPrice);
      setPositionSize(initialTrade.positionSize || (isCrypto ? 500 : 0.5));
      setPnl(initialTrade.pnl);
      setRMultiple(initialTrade.rMultiple);
      setStrategy(initialTrade.strategy);
      setSetup(initialTrade.setup);
      setTimeframe(initialTrade.timeframe);
      setSession(initialTrade.session);
      setEntryReason(initialTrade.entryReason || '');
      setExitReason(initialTrade.exitReason || '');
      setEmotion(initialTrade.emotion);
      setConfidence(initialTrade.confidence);
      setDiscipline(initialTrade.discipline);
      setMistake(initialTrade.mistake || 'None');
      setTagsInput(initialTrade.tags ? initialTrade.tags.join(', ') : '');
      setScreenshotUrl(initialTrade.screenshotBefore || initialTrade.screenshotAfter || '');
      setNotes(initialTrade.notes || '');
      setHoldingMinutes(initialTrade.holdingTimeMinutes || 30);
    } else {
      // Default clean slate for new trade
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setMarketType('Crypto');
      setSizeUnit('USDT');
      setInstrument('BTCUSDT');
      setDirection('LONG');
      setEntryPrice(64000.0);
      setStopLoss(63400.0);
      setTakeProfit(65200.0);
      setExitPrice(65200.0);
      setPositionSize(500);
      setPnl(Number((riskAmount1R * 2.0).toFixed(2))); // +2R = +$10.00
      setRMultiple(2.0);
    }
  }, [initialTrade, isOpen]);

  // -------------------------------------------------------------------------
  // REACTIVE TWO-WAY CALCULATOR: EXIT PRICE <-> PNL ($) <-> R-MULTIPLE
  // -------------------------------------------------------------------------

  // 0. When Position Size changes directly (Manual Sizing):
  const handlePositionSizeChange = (newSize: number) => {
    setPositionSize(newSize);
    if (newSize > 0 && entryPrice > 0) {
      const pDelta = direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
      let computedPnl = 0;
      if (sizeUnit === 'USDT' || marketType === 'Crypto') {
        computedPnl = Number((newSize * (pDelta / entryPrice)).toFixed(2));
      } else {
        computedPnl = Number((newSize * pDelta).toFixed(2));
      }
      const computedR = riskAmount1R > 0 ? Number((computedPnl / riskAmount1R).toFixed(2)) : 0;
      setPnl(computedPnl);
      setRMultiple(computedR);
    }
  };

  // 1. When Exit Price changes: compute PnL ($) and R-Multiple
  const handleExitPriceChange = (newExit: number) => {
    setExitPrice(newExit);
    const pDelta = direction === 'LONG' ? newExit - entryPrice : entryPrice - newExit;

    let computedPnl = 0;
    if (sizeUnit === 'USDT' || marketType === 'Crypto') {
      computedPnl = entryPrice > 0 ? Number((positionSize * (pDelta / entryPrice)).toFixed(2)) : 0;
    } else {
      computedPnl = Number((positionSize * pDelta).toFixed(2));
    }

    const computedR = riskAmount1R > 0 ? Number((computedPnl / riskAmount1R).toFixed(2)) : 0;
    setPnl(computedPnl);
    setRMultiple(computedR);
  };

  // 2. When PnL ($) changes directly (e.g. user types -8.00):
  // R-Multiple MUST strictly follow: R = PnL / 1R (e.g. -8 / 5 = -1.60R)
  const handlePnlChange = (newPnl: number) => {
    setPnl(newPnl);
    const computedR = riskAmount1R > 0 ? Number((newPnl / riskAmount1R).toFixed(2)) : 0;
    setRMultiple(computedR);

    // Calculate matching exit price
    let delta = 0;
    if (sizeUnit === 'USDT' || marketType === 'Crypto') {
      delta = positionSize > 0 && entryPrice > 0 ? (newPnl * entryPrice) / positionSize : 0;
    } else {
      delta = positionSize > 0 ? newPnl / positionSize : 0;
    }

    const calculatedExit = direction === 'LONG' ? entryPrice + delta : entryPrice - delta;
    setExitPrice(Number(calculatedExit.toFixed(entryPrice < 1 ? 6 : 2)));
  };

  // 3. When R-Multiple changes directly (e.g. user types -1.6 or 2.5):
  const handleRMultipleChange = (newR: number) => {
    setRMultiple(newR);
    const computedPnl = Number((newR * riskAmount1R).toFixed(2));
    setPnl(computedPnl);

    let delta = 0;
    if (sizeUnit === 'USDT' || marketType === 'Crypto') {
      delta = positionSize > 0 && entryPrice > 0 ? (computedPnl * entryPrice) / positionSize : 0;
    } else {
      delta = positionSize > 0 ? computedPnl / positionSize : 0;
    }

    const calculatedExit = direction === 'LONG' ? entryPrice + delta : entryPrice - delta;
    setExitPrice(Number(calculatedExit.toFixed(entryPrice < 1 ? 6 : 2)));
  };

  // 4. When Entry or Stop Loss changes: update calculations
  const handleEntryChange = (newEntry: number) => {
    setEntryPrice(newEntry);
    const pDelta = direction === 'LONG' ? exitPrice - newEntry : newEntry - exitPrice;
    let computedPnl = 0;
    if (sizeUnit === 'USDT' || marketType === 'Crypto') {
      computedPnl = newEntry > 0 ? Number((positionSize * (pDelta / newEntry)).toFixed(2)) : 0;
    } else {
      computedPnl = Number((positionSize * pDelta).toFixed(2));
    }
    const computedR = riskAmount1R > 0 ? Number((computedPnl / riskAmount1R).toFixed(2)) : 0;
    setPnl(computedPnl);
    setRMultiple(computedR);
  };

  const handleStopLossChange = (newSl: number) => {
    setStopLoss(newSl);
  };

  // 5. Direction toggle
  const handleDirectionToggle = (dir: Direction) => {
    setDirection(dir);
    const sDist = Math.abs(entryPrice - stopLoss) || 10;
    const newSl = dir === 'LONG' ? entryPrice - sDist : entryPrice + sDist;
    const newTp = dir === 'LONG' ? entryPrice + sDist * 2 : entryPrice - sDist * 2;
    setStopLoss(Number(newSl.toFixed(entryPrice < 1 ? 6 : 2)));
    setTakeProfit(Number(newTp.toFixed(entryPrice < 1 ? 6 : 2)));
    setExitPrice(Number(newTp.toFixed(entryPrice < 1 ? 6 : 2)));

    // Set +2R by default
    setPnl(Number((riskAmount1R * 2.0).toFixed(2)));
    setRMultiple(2.0);
  };

  // Quick fill helper buttons for Exit Price
  const setExitToSL = () => {
    setExitPrice(stopLoss);
    setPnl(-riskAmount1R);
    setRMultiple(-1.0);
  };

  const setExitToBE = () => {
    setExitPrice(entryPrice);
    setPnl(0.0);
    setRMultiple(0.0);
  };

  const setExitToTP = () => {
    setExitPrice(takeProfit);
    setPnl(Number((riskAmount1R * 2.0).toFixed(2)));
    setRMultiple(2.0);
  };

  // Market change
  const handleMarketTypeChange = (type: MarketType) => {
    setMarketType(type);
    if (type === 'Crypto') {
      setSizeUnit('USDT');
      if (!isEditing && (!instrument || instrument === 'XAUUSD' || instrument === 'US100')) {
        setInstrument('BTCUSDT');
        setEntryPrice(64000.0);
        setStopLoss(63400.0);
        setTakeProfit(65200.0);
        setExitPrice(65200.0);
        setPnl(Number((riskAmount1R * 2.0).toFixed(2)));
        setRMultiple(2.0);
      }
    } else if (type === 'Forex') {
      setSizeUnit('Lots');
      if (!isEditing && (!instrument || instrument === 'BTCUSDT' || instrument === 'US100')) {
        setInstrument('XAUUSD');
        setEntryPrice(2450.0);
        setStopLoss(2440.0);
        setTakeProfit(2470.0);
        setExitPrice(2470.0);
        setPnl(Number((riskAmount1R * 2.0).toFixed(2)));
        setRMultiple(2.0);
      }
    } else if (type === 'CFD') {
      setSizeUnit('Lots');
      if (!isEditing && (!instrument || instrument === 'BTCUSDT' || instrument === 'XAUUSD')) {
        setInstrument('US100');
        setEntryPrice(19800.0);
        setStopLoss(19740.0);
        setTakeProfit(19920.0);
        setExitPrice(19920.0);
        setPnl(Number((riskAmount1R * 2.0).toFixed(2)));
        setRMultiple(2.0);
      }
    }
  };

  // Quick suggestion select
  const handleSelectSuggestion = (sym: string, defEntry: number, defStep: number) => {
    setInstrument(sym);
    setEntryPrice(defEntry);
    const sl = direction === 'LONG' ? defEntry - defStep : defEntry + defStep;
    const tp = direction === 'LONG' ? defEntry + defStep * 2 : defEntry - defStep * 2;
    setStopLoss(Number(sl.toFixed(sym.includes('EUR') || sym.includes('GBP') || defEntry < 1 ? 5 : 2)));
    setTakeProfit(Number(tp.toFixed(sym.includes('EUR') || sym.includes('GBP') || defEntry < 1 ? 5 : 2)));
    setExitPrice(Number(tp.toFixed(sym.includes('EUR') || sym.includes('GBP') || defEntry < 1 ? 5 : 2)));
    setPnl(Number((riskAmount1R * 2.0).toFixed(2)));
    setRMultiple(2.0);
  };

  // Determine WIN / LOSS / BE
  let computedResult: TradeResult = 'BE';
  if (pnl >= 0.05 || rMultiple >= 0.05) computedResult = 'WIN';
  else if (pnl <= -0.05 || rMultiple <= -0.05) computedResult = 'LOSS';

  // File upload to Data URL for custom screenshots
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      if (event.target?.result) {
        setScreenshotUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Live rule violation warning preview
  const liveViolations = checkPlanViolations(
    {
      instrument,
      session,
      timeframe,
      riskPercent: 1.0,
      entryPrice,
      stopLoss,
      takeProfit,
    },
    tradingPlan
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const savedTrade: Trade = {
      id: initialTrade ? initialTrade.id : `TRD-${Date.now().toString().slice(-4)}`,
      date,
      time,
      instrument: instrument.trim().toUpperCase(),
      marketType,
      sizeUnit,
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      exitPrice,
      positionSize,
      riskPercent: 1.0,
      riskAmount: riskAmount1R,
      pnl,
      rMultiple,
      result: computedResult,
      strategy,
      setup,
      timeframe,
      session,
      entryReason,
      exitReason,
      emotion,
      confidence,
      discipline,
      mistake,
      tags,
      screenshotBefore: screenshotUrl || undefined,
      screenshotAfter: screenshotUrl || undefined,
      notes,
      holdingTimeMinutes: holdingMinutes,
      planViolations: liveViolations.length > 0 ? liveViolations : undefined,
    };

    onSave(savedTrade);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-4xl rounded-2xl border border-white/[0.09] bg-[#09090B]/95 text-[#e8ebf0] shadow-2xl backdrop-blur-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <h2 className="text-xs sm:text-sm font-bold font-mono tracking-tight uppercase text-white">
              {isEditing ? `Edit Execution — ${initialTrade?.id}` : 'Record New Execution'}
            </h2>
            <span className="text-[11px] font-mono text-slate-400 ml-2 hidden sm:inline">
              Balance: <strong className="text-emerald-400 font-bold">${balance.toFixed(2)}</strong> (1R = ${riskAmount1R.toFixed(2)})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="trade-modal-form min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-6">
          {/* Plan Violation Live Alert Warning */}
          {liveViolations.length > 0 && (
            <div className="rounded border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold font-mono uppercase tracking-wider text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>Trading Plan Guard Warning</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 pl-1 font-mono text-[11px]">
                {liveViolations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI TRADE TICKET & SHARED PNL SCANNER */}
          <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4 text-xs font-mono space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#10b981]" />
                <span className="font-semibold text-xs uppercase tracking-wider text-[#e4e7ec]">
                  AI Shared PnL & Order Ticket Scanner
                </span>
                {hasConfiguredKey ? (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Gemini 2.5 Flash Vision
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Mode Cepat & Smart Local OCR
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  className={`px-2 py-0.5 rounded text-[10.5px] border flex items-center gap-1.5 transition-colors ${
                    showKeyConfig
                      ? 'border-[#10b981]/50 bg-[#10b981]/15 text-[#10b981]'
                      : 'border-white/[0.09] bg-white/[0.04] text-[#8c92a2] hover:text-[#e4e7ec] hover:bg-white/[0.07]'
                  }`}
                  title="Atur Gemini API Key untuk pemindaian gambar AI multimodal"
                >
                  <Key className="h-3 w-3 text-amber-400" />
                  <span>{hasConfiguredKey ? 'Gemini Key (Aktif)' : 'Set Gemini Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAiCardExpanded(!isAiCardExpanded)}
                  className="text-[#696f7e] hover:text-[#e4e7ec] p-1 flex items-center gap-1 text-[11px]"
                >
                  <span>{isAiCardExpanded ? 'Tutup' : 'Buka Scanner'}</span>
                  {isAiCardExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Collapsible API Key Drawer */}
            {showKeyConfig && (
              <div className="rounded-md border border-white/[0.08] bg-white/[0.03] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#e4e7ec] font-semibold flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-amber-400" />
                    Konfigurasi Google Gemini API Key
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#10b981] hover:underline flex items-center gap-1 text-[10.5px]"
                  >
                    <span>Dapatkan Key Gratis (Google AI Studio)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeySecret ? 'text' : 'password'}
                      placeholder="Masukkan AIzaSy... (tersimpan aman di browser Anda)"
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      className="w-full h-8 rounded border border-[#2a3044] bg-[#0b0d14] px-3 pr-8 text-[#e4e7ec] text-xs focus:border-[#10b981] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      className="absolute right-2 top-2 text-[#6e7484] hover:text-[#e4e7ec]"
                    >
                      {showKeySecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTestingKey}
                      onClick={handleTestApiKey}
                      className="h-8 px-3 rounded border border-[#2f374e] bg-[#171b28] hover:bg-[#202638] text-[11px] text-[#cfd3df] hover:text-[#fff] disabled:opacity-50 flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {isTestingKey ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#10b981]" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 text-[#10b981]" />
                      )}
                      <span>Tes Koneksi</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveApiKey}
                      className="h-8 px-3.5 rounded bg-[#10b981] hover:bg-[#0ea371] text-[11px] font-semibold text-[#091510] transition-colors shrink-0"
                    >
                      Simpan
                    </button>
                  </div>
                </div>

                {keyStatusMessage && (
                  <div
                    className={`rounded p-2 text-[11px] ${
                      keyStatusMessage.isError
                        ? 'border border-red-500/30 bg-red-950/20 text-red-400'
                        : 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                    }`}
                  >
                    {keyStatusMessage.text}
                  </div>
                )}
              </div>
            )}

            {isAiCardExpanded && (
              <div className="space-y-3 pt-1">
                <p className="text-[#8c92a2] text-[11px] font-sans leading-relaxed">
                  Unggah, seret (*drag & drop*), atau tempel langsung gambar screenshot (*paste* <kbd className="px-1 py-0.5 rounded bg-[#161922] border border-[#242938] text-[10px]">Ctrl+V</kbd>) dari kartu shared PnL Binance, Bybit, OKX, atau tiket MT5. AI otomatis membaca Ticker, Arah (Long/Short), Harga Open, Harga Close, dan Realized P&L.
                </p>

                {/* Dropzone & Scanner Trigger */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const base64 = await fileToBase64(file);
                      executeAiScan(base64, base64);
                    }
                  }}
                  className={`border-2 border-dashed rounded-md p-4 text-center transition-all ${
                    isDragging
                      ? 'border-[#10b981] bg-[#10b981]/10'
                      : 'border-white/[0.07] bg-white/[0.03]/80 hover:border-[#2d3548]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUploadScan}
                    className="hidden"
                  />

                  {isAiScanning ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[#10b981]" />
                      <span className="text-xs text-[#e4e7ec] font-medium">
                        Memindai data trade dengan AI Multimodal Vision...
                      </span>
                      <span className="text-[10px] text-[#696f7e]">
                        Mengekstrak harga entry, exit, arah posisi, dan nominal profit/loss secara instan
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-left">
                        {aiPreviewUrl ? (
                          <div className="relative h-12 w-12 rounded border border-[#2a3044] overflow-hidden shrink-0 group">
                            <img
                              src={aiPreviewUrl}
                              alt="Scan preview"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[9px] text-[#fff] opacity-0 group-hover:opacity-100 transition-opacity">
                              Preview
                            </div>
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded bg-white/[0.04] border border-[#222736] flex items-center justify-center shrink-0 text-[#8c92a2]">
                            <Camera className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-[#e4e7ec] font-medium">
                            Tarik & letakkan screenshot di sini, atau tekan <kbd className="px-1 py-0.5 rounded bg-[#1c202c] border border-[#282f42] text-[10px] text-[#a0a6b5]">Ctrl+V</kbd>
                          </div>
                          <div className="text-[10.5px] text-[#696f7e] font-sans mt-0.5">
                            Mendukung JPG, PNG, WEBP dari Binance, Bybit, MT5, TradingView
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md border border-[#2a3042] bg-[#181c26] hover:bg-[#202534] px-3.5 py-1.5 text-xs text-[#e4e7ec] transition-colors shrink-0"
                      >
                        Pilih File Gambar
                      </button>
                    </div>
                  )}
                </div>

                {/* Preset Testing Cards */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10.5px] text-[#555a66]">Coba Preset Sample:</span>
                  {SAMPLE_PRESET_CARDS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isAiScanning}
                      onClick={() => handlePresetScan(preset)}
                      className="px-2.5 py-1 rounded text-[11px] border border-white/[0.07] bg-[#141720] text-[#8c92a2] hover:text-[#f4f5f7] hover:border-[#2d3548] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3 w-3 text-[#10b981]" />
                      <span>{preset.title}</span>
                    </button>
                  ))}
                </div>

                {/* Status Banners */}
                {aiScanSuccess && (
                  <div className="rounded p-2.5 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[11px] leading-relaxed flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong>Berhasil Otomatis Terisi:</strong> {aiScanSuccess}
                    </div>
                  </div>
                )}

                {aiScanError && (
                  <div className="rounded p-2.5 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[11px] leading-relaxed flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong>Info Scan:</strong> {aiScanError}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 1: Market Category & Custom Asset Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 tracking-wider">
                1. Tipe Pasar & Nama Aset (Bebas Input Sendiri)
              </h3>
            </div>

            {/* Market Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['Crypto', 'Forex', 'CFD'] as MarketType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleMarketTypeChange(type)}
                  className={`py-2 px-3 rounded-md border text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors ${
                    marketType === type
                      ? 'border-white/[0.09] bg-white/[0.04] text-[#f4f5f7]'
                      : 'border-white/[0.06] bg-white/[0.03] text-[#696f7e] hover:text-[#a0a6b5] hover:bg-[#141720]'
                  }`}
                >
                  {type === 'Crypto' && <span>Crypto (USDT)</span>}
                  {type === 'Forex' && <span>Forex (Lots)</span>}
                  {type === 'CFD' && <span>CFD / Index</span>}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-mono pt-1">
              {/* Custom Instrument Name Input */}
              <div className="sm:col-span-5">
                <label className="block text-[#a0a6b5] font-medium mb-1">
                  Asset Ticker
                </label>
                <input
                  type="text"
                  placeholder="e.g. BTCUSDT, XAUUSD, EURUSD, US100..."
                  value={instrument}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    setInstrument(val);
                    if (val.includes('USDT') && marketType !== 'Crypto') {
                      setMarketType('Crypto');
                      setSizeUnit('USDT');
                    }
                  }}
                  className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-3 text-[#e4e7ec] font-mono text-xs focus:border-white/[0.14] focus:outline-none"
                  required
                />
              </div>

              {/* Direction: Long or Short */}
              <div className="sm:col-span-3">
                <label className="block text-[#696f7e] mb-1">Side / Direction</label>
                <div className="grid grid-cols-2 gap-1 rounded bg-white/[0.03] p-0.5 border border-white/[0.06] h-8 items-center">
                  <button
                    type="button"
                    onClick={() => handleDirectionToggle('LONG')}
                    className={`h-7 text-xs font-medium rounded transition-colors ${
                      direction === 'LONG'
                        ? 'bg-[#10b981]/15 text-[#10b981] font-semibold border border-[#10b981]/30'
                        : 'text-[#696f7e] hover:text-[#a0a6b5]'
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionToggle('SHORT')}
                    className={`h-7 text-xs font-medium rounded transition-colors ${
                      direction === 'SHORT'
                        ? 'bg-[#ef4444]/15 text-[#ef4444] font-semibold border border-[#ef4444]/30'
                        : 'text-[#696f7e] hover:text-[#a0a6b5]'
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="sm:col-span-2">
                <label className="block text-[#696f7e] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#696f7e] mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-[#555a66]">Quick presets:</span>
              {MARKET_SUGGESTIONS[marketType]?.map(s => (
                <button
                  key={s.sym}
                  type="button"
                  onClick={() => handleSelectSuggestion(s.sym, s.defaultEntry, s.defaultStep)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    instrument === s.sym
                      ? 'border-[#2d3243] bg-white/[0.04] text-[#e4e7ec]'
                      : 'border-white/[0.06] bg-white/[0.03] text-[#696f7e] hover:text-[#a0a6b5]'
                  }`}
                >
                  {s.sym}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: SMART CALCULATOR */}
          <div className="rounded-lg border border-white/[0.06] bg-black/30 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#8c92a2]" />
                <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-[#9ea3b0]">
                  2. Pricing Levels & Reactive Execution Calculator
                </h3>
              </div>
              <div className="text-[11px] font-mono flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-[#8c92a2]">
                <span className="text-[#696f7e]">Benchmark 1R:</span>
                <span className="font-semibold text-[#10b981] tabular-nums">${riskAmount1R.toFixed(2)} (1.0% equity)</span>
              </div>
            </div>

            {/* Price Level Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[#696f7e] mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={e => handleEntryChange(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-3 text-[#e4e7ec] font-mono text-xs tabular-nums focus:border-white/[0.14] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#696f7e] mb-1">
                  Stop Loss (SL)
                </label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={e => handleStopLossChange(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-3 text-[#ef4444] font-medium font-mono text-xs tabular-nums focus:border-white/[0.14] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#696f7e] mb-1">
                  Take Profit (TP)
                </label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit}
                  onChange={e => setTakeProfit(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-3 text-[#10b981] font-medium font-mono text-xs tabular-nums focus:border-white/[0.14] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* SIZING — hidden, AI-filled automatically via scanner */}
            <input type="hidden" value={positionSize} readOnly />
            <input type="hidden" value={sizeUnit} readOnly />

            {/* THREE INTERCONNECTED FIELDS */}
            <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-3.5 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs">
                <span className="font-medium text-[#9ea3b0]">
                  Realized Outcome (Exit Price ↔ P&L ↔ R-Multiple)
                </span>
                <span className="text-[10px] text-[#555a66]">
                  R = P&L ÷ ${riskAmount1R.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Exit Price */}
                <div className="rounded bg-black/30 p-3 border border-white/[0.06]">
                  <label className="block text-[#696f7e] text-xs mb-1">
                    1. Exit Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={e => handleExitPriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-3 text-[#e4e7ec] font-mono text-xs tabular-nums focus:border-white/[0.14] focus:outline-none"
                    placeholder="Exit Price"
                    required
                  />
                  <div className="text-[10px] text-[#555a66] mt-1 font-sans">Market close level</div>
                </div>

                {/* 2. P&L ($) */}
                <div className="rounded bg-black/30 p-3 border border-white/[0.06]">
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-[#696f7e] text-xs">
                      2. Realized P&L ($)
                    </label>
                    <span className="text-[10px] text-[#555a66]">e.g. -8.00</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#555a66]">$</span>
                    <input
                      type="number"
                      step="any"
                      value={pnl}
                      onChange={e => handlePnlChange(parseFloat(e.target.value) || 0)}
                      className={`w-full h-8 rounded border px-3 font-mono text-xs tabular-nums focus:outline-none ${
                        pnl > 0
                          ? 'border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]'
                          : pnl < 0
                          ? 'border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]'
                          : 'border-white/[0.08] bg-white/[0.03] text-[#e4e7ec]'
                      }`}
                      placeholder="-8.00"
                      required
                    />
                  </div>
                  <div className="text-[10px] text-[#555a66] mt-1 font-sans">Dollar loss (-) or win (+)</div>
                </div>

                {/* 3. R-Multiple */}
                <div className="rounded bg-black/30 p-3 border border-white/[0.06]">
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-[#696f7e] text-xs">
                      3. R-Multiple
                    </label>
                    <span className="text-[10px] text-[#555a66]">P&L ÷ 1R</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={rMultiple}
                      onChange={e => handleRMultipleChange(parseFloat(e.target.value) || 0)}
                      className={`w-full h-8 rounded border px-3 font-mono text-xs tabular-nums focus:outline-none ${
                        rMultiple > 0
                          ? 'border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]'
                          : rMultiple < 0
                          ? 'border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]'
                          : 'border-white/[0.08] bg-white/[0.03] text-[#e4e7ec]'
                      }`}
                      placeholder="-1.60"
                      required
                    />
                    <span className="text-xs text-[#555a66]">R</span>
                  </div>
                  <div className="text-[10px] text-[#696f7e] mt-1 tabular-nums">
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} = <strong className={rMultiple >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}>{rMultiple >= 0 ? '+' : ''}{rMultiple}R</strong>
                  </div>
                </div>
              </div>

              {/* Quick Fill Buttons for Exit Price */}
              <div className="flex flex-wrap items-center gap-2 pt-2 font-mono text-[11px] border-t border-white/[0.06]">
                <span className="text-[#555a66] font-sans">Presets:</span>
                <button
                  type="button"
                  onClick={setExitToSL}
                  className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[#ef4444] hover:bg-[#201519] transition-colors"
                >
                  Hit SL (-1.00R / -${riskAmount1R.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={setExitToBE}
                  className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[#a0a6b5] hover:text-[#f4f5f7] transition-colors"
                >
                  Breakeven (0.00R / $0.00)
                </button>
                <button
                  type="button"
                  onClick={setExitToTP}
                  className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[#10b981] hover:bg-[#12221a] transition-colors"
                >
                  Hit TP (+2.00R / +${(riskAmount1R * 2).toFixed(2)})
                </button>
              </div>

            </div>
          </div>

          {/* Section 3: Strategy & Context */}
          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <button type="button" onClick={() => setIsStrategyExpanded(!isStrategyExpanded)} className="flex w-full items-center justify-between text-left group">
              <h3 className="text-xs font-mono font-medium uppercase text-[#9ea3b0] tracking-wider group-hover:text-white transition-colors">3. Strategy, Setup & Execution Thesis</h3>
              <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-slate-300">{isStrategyExpanded ? 'Collapse' : 'Expand'}{isStrategyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
            </button>
            {isStrategyExpanded && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#555a66]">Strategy:</span>
                    <input
                      list="strategies-list"
                      value={strategy}
                      onChange={e => setStrategy(e.target.value)}
                      className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none"
                    />
                    <datalist id="strategies-list">
                      {PRESET_STRATEGIES.map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#555a66]">Setup:</span>
                    <input
                      list="setups-list"
                      value={setup}
                      onChange={e => setSetup(e.target.value)}
                      className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none"
                    />
                    <datalist id="setups-list">
                      {PRESET_SETUPS.map(su => (
                        <option key={su} value={su} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#555a66]">Trading Session:</span>
                    <select
                      value={session}
                      onChange={e => setSession(e.target.value as TradingSession)}
                      className="w-full h-8 rounded border border-white/[0.08] bg-[#0b0d11] px-2.5 text-[#E2E8F0] text-xs focus:border-white/[0.14] focus:outline-none"
                    >
                      <option value="London">London</option>
                      <option value="New York">New York</option>
                      <option value="Asian">Asian</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#555a66]">Timeframe:</span>
                    <select
                      value={timeframe}
                      onChange={e => setTimeframe(e.target.value as Timeframe)}
                      className="w-full h-8 rounded border border-white/[0.08] bg-[#0b0d11] px-2.5 text-[#E2E8F0] text-xs focus:border-white/[0.14] focus:outline-none"
                    >
                      <option value="M1">M1</option>
                      <option value="M5">M5</option>
                      <option value="M15">M15</option>
                      <option value="H1">H1</option>
                      <option value="H4">H4</option>
                      <option value="D1">D1</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-3">
                  <div>
                    <label className="block text-[#696f7e] mb-1 font-mono">Entry Thesis</label>
                    <textarea
                      rows={2}
                      value={entryReason}
                      onChange={e => setEntryReason(e.target.value)}
                      className="w-full rounded border border-white/[0.08] bg-white/[0.03] p-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none resize-none font-sans placeholder-[#555a66]"
                      placeholder="Rationale behind trade entry..."
                    />
                  </div>

                  <div>
                    <label className="block text-[#696f7e] mb-1 font-mono">Exit Rationale</label>
                    <textarea
                      rows={2}
                      value={exitReason}
                      onChange={e => setExitReason(e.target.value)}
                      className="w-full rounded border border-white/[0.08] bg-white/[0.03] p-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none resize-none font-sans placeholder-[#555a66]"
                      placeholder="Rationale behind trade exit..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Psychology & Execution Discipline */}
          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <button type="button" onClick={() => setIsPsychologyExpanded(!isPsychologyExpanded)} className="flex w-full items-center justify-between text-left group">
              <h3 className="text-xs font-mono font-medium uppercase text-[#9ea3b0] tracking-wider group-hover:text-white transition-colors">4. Behavioral Psychology & Execution Quality</h3>
              <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-slate-300">{isPsychologyExpanded ? 'Collapse' : 'Expand'}{isPsychologyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
            </button>
            {isPsychologyExpanded && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#555a66]">Emotional State:</span>
                    <select
                      value={emotion}
                      onChange={e => setEmotion(e.target.value as EmotionState)}
                      className="w-full h-8 rounded border border-white/[0.08] bg-[#0b0d11] px-2.5 text-[#E2E8F0] text-xs focus:border-white/[0.14] focus:outline-none font-mono"
                    >
                      {PRESET_EMOTIONS.map(emo => (
                        <option key={emo} value={emo}>{emo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#555a66]">Mistake Flag:</span>
                    <select
                      value={mistake}
                      onChange={e => setMistake(e.target.value)}
                      className="w-full h-8 rounded border border-white/[0.08] bg-[#0b0d11] px-2.5 text-[#E2E8F0] text-xs focus:border-white/[0.14] focus:outline-none font-mono"
                    >
                      {PRESET_MISTAKES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between text-[#696f7e] mb-1 font-mono">
                    <span>Confidence:</span>
                    <span className="text-[#e4e7ec] font-semibold">{confidence}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={confidence}
                    onChange={e => setConfidence(parseInt(e.target.value))}
                    className="w-full accent-[#10b981]"
                  />

                  <div className="flex justify-between text-[#696f7e] mb-1 font-mono">
                    <span>Discipline:</span>
                    <span className="text-[#10b981] font-semibold">{discipline}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={discipline}
                    onChange={e => setDiscipline(parseInt(e.target.value))}
                    className="w-full accent-[#10b981]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3 font-mono">
                  <div>
                    <label className="block text-[#696f7e] mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      placeholder="e.g. Crypto, A+ Setup, Trailed SL"
                      className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#696f7e] mb-1">Holding Duration (minutes)</label>
                    <input
                      type="number"
                      value={holdingMinutes}
                      onChange={e => setHoldingMinutes(parseInt(e.target.value) || 0)}
                      className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#e4e7ec] text-xs focus:border-white/[0.14] focus:outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Screenshot Attachment */}
          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <h3 className="text-xs font-mono font-medium uppercase text-[#9ea3b0] tracking-wider">
              5. Execution Chart Snapshot
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 space-y-2 text-xs font-mono">
                <label className="block text-[#696f7e]">Attach image or choose preset</label>
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] px-3 py-1.5 text-[#a0a6b5] hover:text-[#f4f5f7] cursor-pointer transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl('/src/assets/images/chart_breakout_setup_1790744925578.jpg')}
                    className="rounded-md border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] px-2.5 py-1.5 text-[11px] text-[#8c92a2] hover:text-[#f4f5f7] transition-colors"
                  >
                    Preset 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl('/src/assets/images/chart_reversal_trade_1790744940943.jpg')}
                    className="rounded-md border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06] px-2.5 py-1.5 text-[11px] text-[#8c92a2] hover:text-[#f4f5f7] transition-colors"
                  >
                    Preset 2
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Or enter image URL"
                  value={screenshotUrl}
                  onChange={e => setScreenshotUrl(e.target.value)}
                  className="w-full h-8 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-[#e4e7ec] text-[11px] focus:border-white/[0.14] focus:outline-none"
                />
              </div>

              {screenshotUrl && (
                <div className="h-24 w-40 rounded-md border border-white/[0.08] overflow-hidden bg-black shrink-0 relative">
                  <img
                    src={screenshotUrl}
                    alt="Chart preview"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshotUrl('')}
                    className="absolute top-1 right-1 rounded bg-black/80 p-0.5 text-[#8c92a2] hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-5 font-mono text-xs">
            <div className="text-slate-400">
              Outcome: <strong className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({rMultiple >= 0 ? '+' : ''}{rMultiple}R · {computedResult})
              </strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full btn-accent px-5 py-2 text-xs font-semibold transition-all active:scale-[0.98]"
              >
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>{isEditing ? 'Save Changes' : 'Commit Trade to Journal'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
