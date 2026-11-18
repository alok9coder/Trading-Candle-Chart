import { memo } from "react";

function Candle({
    candleSequence, open, high, low, close,
    label, onCandleClick, avgPrice, minPrice
}) {
    const unitPrice = 75 / (0.001 * avgPrice);

    const upperWick = parseInt((high - Math.max(open, close)) * unitPrice);
    const lowerWick = parseInt((Math.min(open, close) - low) * unitPrice);
    const candleBody = parseInt((close - open) * unitPrice);

    const candleColor =
        candleBody > 0
            ? "bg-green-500 group-hover:bg-green-700"
            : candleBody < 0
                ? "bg-red-500 group-hover:bg-red-700"
                : "bg-black";

    const posLeft = (candleSequence ?? 0) * 15 + 10;
    const CANDLE_FLOOR = 130;
    const posBottom = Math.round(CANDLE_FLOOR + (low - minPrice) * unitPrice);
    return (
        <div
            onClick={() => onCandleClick(candleSequence)}
            className={`group flex flex-col items-center absolute hover:scale-120 cursor-pointer ${
                label === 1 ? "ring-2 ring-amber-400 rounded-xs" : ""
            }`}
            style={{
                bottom: `${posBottom}px`,
                left: `${posLeft}px`,
            }}
        >
            <div className={`w-[1px] ${candleColor}`} style={{ height: `${upperWick}px` }} />
            <div
                className={`w-[11px] ${candleColor}`}
                style={{ height: `${Math.max(Math.abs(candleBody), 2)}px` }}
            />
            <div className={`w-[1px] ${candleColor}`} style={{ height: `${lowerWick}px` }} />
        </div>
    );
}

export default memo(Candle);
