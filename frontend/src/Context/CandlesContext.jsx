// CandlesContext.jsx
import { createContext, useState } from "react";
import { candles as initialCandles } from "../DevMode.js";

// 1. Create the Context with a default fallback Structure
export const CandlesContext = createContext({
    candles: [],
    toggleLabel: () => { }
});

// 2. Create the Provider Component
export function CandlesProvider({ children }) {
    const [candles, setCandles] = useState(initialCandles ?? []);

    // Functon to Change the Label of the Candle
    const toggleLabel = (candleSequence) => {
        setCandles((prevCandles) =>
            prevCandles.map((candle) =>
                candle.candleSequence === candleSequence
                    ? { ...candle, label: (candle.label === 0 ? 1 : 0) }
                    : candle
            )
        );
    };

    return (
        <CandlesContext value={{ candles, toggleLabel }}>
            {children}
        </CandlesContext>
    )
}
