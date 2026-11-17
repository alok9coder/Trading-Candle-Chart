function Candle({
    candle,
    candleSequence,
    x,
    candleWidth,
    priceToY,
    formatTime,
}) {
    const yHigh = priceToY(candle.high);
    const yLow = priceToY(candle.low);
    const yOpen = priceToY(candle.open);
    const yClose = priceToY(candle.close);
    const rawBodyHeight = Math.abs(yOpen - yClose);
    const bodyHeight = Math.max(rawBodyHeight, 2);
    const bodyY = Math.min(yOpen, yClose) - (bodyHeight - rawBodyHeight) / 2;
    const isUp = candle.close >= candle.open;
    const color = isUp ? "#22c55e" : "#ef4444";
    const barWidth = Math.min(10, candleWidth * 0.68);

    return (
        <g>
            <title>
                {`${formatTime(candle.timestamp)} | O ${candle.open.toFixed(2)} | H ${candle.high.toFixed(2)} | L ${candle.low.toFixed(2)} | C ${candle.close.toFixed(2)} | V ${candle.volume}`}
            </title>
            <line
                x1={x}
                x2={x}
                y1={yHigh}
                y2={yLow}
                stroke={color}
                strokeWidth="1.5"
            />
            <rect
                x={x - barWidth / 2}
                y={bodyY}
                width={barWidth}
                height={bodyHeight}
                fill={color}
            />
            <desc>{`Candle ${candleSequence + 1}`}</desc>
        </g>
    );
}

export default Candle;
