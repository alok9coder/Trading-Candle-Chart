import Candle from "./Candle.jsx";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CandlesContext } from "../../Context/CandlesContext.jsx";

export default function Chart() {
    const { candles, toggleLabel } = use(CandlesContext);

    const scrollRef = useRef(null);
    const chartInnerRef = useRef(null);
    const priceAxisInnerRef = useRef(null);
    const [chartViewportWidth, setChartViewportWidth] = useState(0);

    // Measure the actual chart viewport instead of assuming the browser width.
    // This accounts for the price sidebar, scrollbars, and window resizing.
    useEffect(() => {
        const chartViewport = scrollRef.current;
        if (!chartViewport) return;

        const updateChartViewportWidth = () => {
            setChartViewportWidth(chartViewport.clientWidth);
        };

        updateChartViewportWidth();
        const resizeObserver = new ResizeObserver(updateChartViewportWidth);
        resizeObserver.observe(chartViewport);

        return () => resizeObserver.disconnect();
    }, []);

    const dragInfo = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
        hasMoved: false,
    });

    const {
        avgPrice,
        minPrice,
        highestVolume,
        chartHeight,
        priceSteps,
    } = useMemo(() => {
        if (!candles.length) {
            return {
                avgPrice: 0,
                minPrice: 0,
                highestVolume: 0,
                chartHeight: 800,
                priceSteps: [],
            };
        }

        let sum = 0;
        let min = Infinity;
        let max = -Infinity;
        let maxVol = 0;

        for (const candle of candles) {
            sum += candle.open + candle.close;

            if (candle.low < min) min = candle.low;
            if (candle.high > max) max = candle.high;
            if (candle.volume > maxVol) maxVol = candle.volume;
        }

        const averagePrice = sum / (candles.length * 2);
        const pricePer75Px = 0.001 * averagePrice;
        const pixelsPerPriceUnit = 75 / pricePer75Px;

        // Reserve space for the volume panel, time axis, and top padding.
        const CANDLE_FLOOR = 130;
        const TOP_PADDING = 80;

        const calculatedHeight = Math.max(
            Math.ceil(CANDLE_FLOOR + (max - min) * pixelsPerPriceUnit + TOP_PADDING),
            window.innerHeight,
        );

        // Price-axis labels use the same 75px grid spacing as the chart.
        const steps = [];
        const totalUnits = Math.floor(calculatedHeight / 75);

        for (let index = 0; index <= totalUnits; index++) {
            const bottomPx = index * 75;
            const priceAtLine =
                min + ((bottomPx - CANDLE_FLOOR) / 75) * pricePer75Px;

            steps.push({
                bottomPx,
                label: priceAtLine.toFixed(2),
            });
        }

        return {
            avgPrice: averagePrice,
            minPrice: min,
            highestVolume: maxVol,
            chartHeight: calculatedHeight,
            priceSteps: steps,
        };
    }, [candles]);

    // Fill the available chart viewport, while keeping enough width for all candles.
    const chartWidth = Math.max(
        candles.length * 15 + 20,
        chartViewportWidth,
    );

    // Keep the price axis vertically aligned with the scrollable chart.
    const handleScroll = () => {
        if (priceAxisInnerRef.current && scrollRef.current) {
            priceAxisInnerRef.current.style.transform =
                `translateY(-${scrollRef.current.scrollTop}px)`;
        }
    };

    const handleMouseDown = (event) => {
        if (!scrollRef.current || !chartInnerRef.current) return;

        dragInfo.current = {
            isDragging: true,
            startX: event.pageX - scrollRef.current.offsetLeft,
            startY: event.pageY - scrollRef.current.offsetTop,
            scrollLeft: scrollRef.current.scrollLeft,
            scrollTop: scrollRef.current.scrollTop,
            hasMoved: false,
        };

        chartInnerRef.current.classList.replace(
            "cursor-crosshair",
            "cursor-grabbing",
        );
    };

    const handleMouseMove = (event) => {
        if (!dragInfo.current.isDragging || !scrollRef.current) return;

        event.preventDefault();

        const x = event.pageX - scrollRef.current.offsetLeft;
        const y = event.pageY - scrollRef.current.offsetTop;
        const walkX = x - dragInfo.current.startX;
        const walkY = y - dragInfo.current.startY;

        if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
            dragInfo.current.hasMoved = true;
        }

        scrollRef.current.scrollLeft = dragInfo.current.scrollLeft - walkX;
        scrollRef.current.scrollTop = dragInfo.current.scrollTop - walkY;
    };

    const stopDragging = () => {
        if (!dragInfo.current.isDragging) return;

        dragInfo.current.isDragging = false;

        if (chartInnerRef.current) {
            chartInnerRef.current.classList.replace(
                "cursor-grabbing",
                "cursor-crosshair",
            );
        }
    };

    const handleCandleClick = useCallback(
        (candleSequence) => {
            if (dragInfo.current.hasMoved) {
                dragInfo.current.hasMoved = false;
                return;
            }

            toggleLabel(candleSequence);
        },
        [toggleLabel],
    );

    // Format an ISO timestamp as a 24-hour HH:MM time.
    const formatTime = (isoString) => {
        const date = new Date(isoString);

        if (Number.isNaN(date.getTime())) return "--:--";

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    return (
        <div
            className="fixed z-0 flex min-w-0 overflow-hidden bg-zinc-300"
            style={{
                // Let opposing edges determine the size; avoid conflicting
                // inset-0 and w-screen sizing on the fixed-position container.
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: "auto",
                height: "auto",
            }}
        >
            {/* Main scrollable chart area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                className="relative h-screen min-w-0 flex-1 overflow-auto bg-zinc-200"
            >
                {/* Candle canvas and 75px grid */}
                <div
                    ref={chartInnerRef}
                    className="relative select-none bg-zinc-200 cursor-crosshair"
                    style={{
                        width: `${chartWidth}px`,
                        height: `${chartHeight}px`,
                        backgroundImage: `
                            linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: "75px 75px",
                        backgroundPosition: "left bottom",
                    }}
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
                            label={candle.label}
                            avgPrice={avgPrice}
                            minPrice={minPrice}
                            onCandleClick={handleCandleClick}
                        />
                    ))}
                </div>

                {/* Sticky volume bars and time labels */}
                <div
                    className="pointer-events-none sticky bottom-0 left-0 z-10 h-[125px] border-t border-zinc-400/60 bg-zinc-200/90 backdrop-blur-sm"
                    style={{ width: `${chartWidth}px` }}
                >
                    <div className="relative h-[100px] w-full">
                        {candles.map((candle) => {
                            const volumeBar =
                                highestVolume > 0
                                    ? Math.round((candle.volume / highestVolume) * 100)
                                    : 0;
                            const posLeft =
                                (candle.candleSequence ?? 0) * 15 + 10;

                            return (
                                <div
                                    key={candle.candleSequence}
                                    className="group pointer-events-auto absolute bottom-0 w-[11px] bg-violet-500 hover:bg-violet-700"
                                    style={{
                                        height: `${volumeBar}px`,
                                        left: `${posLeft}px`,
                                    }}
                                >
                                    <p className="invisible absolute bottom-20 z-20 rounded-full bg-white px-1 text-xs shadow group-hover:visible">
                                        {candle.volume}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Time labels: one label for every five candles */}
                    <div className="relative h-[25px] w-full border-t border-zinc-400/60 bg-zinc-100">
                        {candles.map((candle, index) => {
                            if (index % 5 !== 0) return null;

                            const gridX = index * 15;

                            return (
                                <div
                                    key={candle.candleSequence}
                                    className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                                    style={{ left: `${gridX}px` }}
                                >
                                    <span className="h-1.5 w-px bg-zinc-500" />
                                    <span className="mt-0.5 font-mono text-[10px] leading-none text-zinc-700">
                                        {formatTime(candle.timestamp)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right-hand price axis, synchronized with vertical scrolling */}
            <div className="relative h-screen w-[90px] shrink-0 select-none overflow-hidden border-l border-zinc-400 bg-zinc-100">
                <div
                    ref={priceAxisInnerRef}
                    className="relative w-full"
                    style={{ height: `${chartHeight}px` }}
                >
                    {priceSteps.map((step) => (
                        <div
                            key={step.bottomPx}
                            className="absolute left-0 flex w-full translate-y-1/2 items-center"
                            style={{ bottom: `${step.bottomPx}px` }}
                        >
                            <span className="mr-1.5 h-px w-2 bg-zinc-500" />
                            <span className="font-mono text-[11px] text-zinc-800">
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
