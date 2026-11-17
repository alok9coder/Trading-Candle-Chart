import Candle from "./Candle.jsx";
import { use, useMemo, useRef } from "react";
import { CandlesContext } from "../../Context/CandlesContext.jsx";

export default function Chart() {
    const { candles, toggleLabel } = use(CandlesContext);
    const scrollRef = useRef(null);
    const chartInnerRef = useRef(null);
    const dragInfo = useRef({
        isDragging: false,
        startX: 0,
        scrollLeft: 0,
        hasMoved: false,
    });

    // Memoize chart-wide calculations so they only run when candles change
    const { avgPrice, highestVolume } = useMemo(() => {
        if (!candles.length) return { avgPrice: 0, highestVolume: 0 };
        let sum = 0;
        let maxVol = 0;
        for (const c of candles) {
            sum += c.open + c.close;
            if (c.volume > maxVol) maxVol = c.volume;
        }
        return {
            avgPrice: sum / (candles.length * 2),
            highestVolume: maxVol,
        };
    }, [candles]);

    const chartWidth = candles.length * 15 + 10 * 2;

    const handleMouseDown = (e) => {
        dragInfo.current = {
            isDragging: true,
            startX: e.pageX - scrollRef.current.offsetLeft,
            scrollLeft: scrollRef.current.scrollLeft,
            hasMoved: false,
        };
        chartInnerRef.current.classList.replace("cursor-crosshair", "cursor-grabbing");
    };

    const handleMouseMove = (e) => {
        if (!dragInfo.current.isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = x - dragInfo.current.startX;

        if (Math.abs(walk) > 5) {
            dragInfo.current.hasMoved = true;
        }
        scrollRef.current.scrollLeft = dragInfo.current.scrollLeft - walk;
    };

    const stopDragging = () => {
        if (!dragInfo.current.isDragging) return;
        dragInfo.current.isDragging = false;
        chartInnerRef.current.classList.replace("cursor-grabbing", "cursor-crosshair");
    };

    const handleCandleClick = (candleSequence) => {
        if (dragInfo.current.hasMoved) return;
        toggleLabel(candleSequence);
    };

    return (
        <div className="w-screen h-screen bg-zinc-300">
            <div
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                className="w-[90vw] h-screen overflow-auto bg-zinc-300"
            >
                <div
                    ref={chartInnerRef}
                    className="bg-zinc-200 h-[95vh] 
                                relative select-none 
                                cursor-crosshair"
                    style={{ width: `${chartWidth}px` }}
                >
                    {candles.map((candle) => (
                        <Candle
                            key={candle.candleSequence}
                            candleSequence={candle.candleSequence}
                            timestamp={candle.timestamp}
                            open={candle.open}
                            high={candle.high}
                            low={candle.low}
                            close={candle.close}
                            volume={candle.volume}
                            label={candle.label}
                            highestVolume={highestVolume}
                            avgPrice={avgPrice}
                            onClick={() => handleCandleClick(candle.candleSequence)}
                        />
                    ))}
                </div>
            </div>
            <div className="Price Tag Here!"></div>
        </div>
    );
}
