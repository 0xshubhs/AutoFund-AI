# AutoFund AI 

AutoFund AI is an execution-heavy concept: a one-person hedge fund agent that consumes SoSoValue data and executes rebalancing actions through SoDEX.

## Theme

- Black background
- Square boxes
- Green accents
- White text

## Core Idea

1. Pull trend and sector signal from SoSoValue.
2. Score risk and generate target portfolio weights.
3. Rebalance portfolio automatically on a fixed cadence.
4. Execute orders on SoDEX.
5. Show a "why this trade" explanation for every action.

## Required Docs

- [SoDEX API Overview](https://sodex.com/documentation/api/api)
- [SoSoValue API Docs](https://sosovalue-1.gitbook.io/sosovalue-api-doc)
- [Common APIs Notion](https://www.notion.so/Common-APIs-167b57bd102a4c03b8f2421108fc66eb)

## Run

```bash
npm install
npm run dev
```

## Backend API Scaffold

- `POST /api/autofund/rebalance`
  - Fetches:
    - `/currency/market-snapshot`
    - `/index/market-snapshot`
    - `/currency/sector-spotlight`
  - Computes default allocation and returns execution payload.

## Environment

```bash
SOSO_API_KEY=your_key_here
SOSO_BASE_URL=https://openapi.sosovalue.com/openapi/v1
```
