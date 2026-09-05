import Candle from "./Candle.jsx";

export default function Chart() {

    let candles = [];
    for (let i = 0; i < 375; i++) {
        candles.push(<Candle key={i} candleSequence={i} />);
    }

    const chartWidth = candles.length * 15 + 10 * 2;
    
    return (
        <div
        className="w-screen h-screen bg-zinc-300"
        >
            <div
                className="w-[90vw] h-screen overflow-x-auto overflow-y-hidden bg-zinc-300"
            >
                <div
                className="bg-zinc-200 h-[95vh] relative cursor-crosshair"
                style={{
                    width: `${chartWidth}px`
                }}
                >
                    {candles}
                </div>
            </div>
            <div
                className="Price Tag Here!"
            >
            </div>
        </div>
    )
}
