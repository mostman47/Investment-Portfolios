import { NextResponse } from 'next/server';

export async function POST(request) {
  const { tickers } = await request.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in .env.local' }, { status: 400 });
  }

  // 1. Try Yahoo Finance
  let yahooRaw = null;
  try {
    const yRes = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(tickers.join(','))}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    );
    const text = await yRes.text();
    if (text.includes('regularMarketPrice')) yahooRaw = text;
  } catch(e) {}

  // 2. Build prompt
  const tickerList = tickers.join(', ');
  const prompt = yahooRaw
    ? `You are a financial data parser. Parse this Yahoo Finance JSON for stocks: ${tickerList}.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "symbol": "TICKER",
    "current_price": <number from regularMarketPrice>,
    "day_change_pct": <number from regularMarketChangePercent>,
    "pe_ratio": <number from trailingPE or null>,
    "risk_level": "<low|medium|high|vhigh>",
    "buy_target": <number>,
    "sell_target": <number>
  }
]

Yahoo Finance data:
${yahooRaw.slice(0, 8000)}`
    : `You are a financial analyst. Provide best estimates for these stocks: ${tickerList}.

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "symbol": "TICKER",
    "current_price": <number>,
    "day_change_pct": <number>,
    "pe_ratio": <number or null>,
    "risk_level": "<low|medium|high|vhigh>",
    "buy_target": <number>,
    "sell_target": <number>
  }
]`;

  // 3. Call Claude Haiku
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return NextResponse.json({ error: 'Anthropic API error: ' + err }, { status: 500 });
  }

  const data = await anthropicRes.json();
  const text = data.content?.[0]?.text || '';

  return NextResponse.json({
    text,
    dataSource: yahooRaw ? 'yahoo+ai' : 'ai',
    inputTokens:  data.usage?.input_tokens  || 0,
    outputTokens: data.usage?.output_tokens || 0,
  });
}
