import { useLayoutEffect, useRef } from "react";
import { candles as devCandles } from "../../DevMode.js";
import { formatIST } from "../../Time.js";
import Candle from "./CandleExperiment.jsx";

const CANDLES_PER_TIME_UNIT = 5;
const SLOT_WIDTH = 15;
const GRID_UNIT_SIZE = CANDLES_PER_TIME_UNIT * SLOT_WIDTH;
const PLOT_LEFT = 10;
const PLOT_RIGHT = 16;
const PRICE_TOP = 28;
const PRICE_BOTTOM_PADDING = 16;
const VOLUME_VIEW_HEIGHT = 160;
const VOLUME_TOP = 22;
const VOLUME_BOTTOM_PADDING = 8;

function getPanRange(viewportSize, canvasSize) {
    if (canvasSize <= viewportSize) {
        return { min: 0, max: 0 };
    }

    return { min: viewportSize - canvasSize, max: 0 };
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function Chart() {
    const viewportRef = useRef(null);
    const canvasRef = useRef(null);
    const volumeRef = useRef(null);
    const priceAxisRef = useRef(null);
    const timeAxisRef = useRef(null);
    const dragRef = useRef(null);
    const offsetRef = useRef({ x: 0, y: 0 });

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        const canvas = canvasRef.current;
        if (!viewport || !canvas) {
            return;
        }

        const canvasHeight = Number(canvas.getAttribute("height"));
        const yRange = getPanRange(viewport.clientHeight, canvasHeight);
        const y = (yRange.min + yRange.max) / 2;

        offsetRef.current = { x: 0, y };
        canvas.style.transform = `translate3d(0, ${y}px, 0)`;
        if (priceAxisRef.current) {
            priceAxisRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
        }
    }, []);

    const candles = devCandles;

    if (candles.length === 0) {
        throw new Error("Cannot render a chart without candle data.");
    }

    const averageClose =
        candles.reduce((sum, candle) => sum + candle.close, 0) / candles.length;
    const priceStep = averageClose * 0.001;

    if (!Number.isFinite(priceStep) || priceStep <= 0) {
        throw new Error("The average close must be positive to scale the chart.");
    }

    const lowPrice = Math.min(...candles.map((candle) => candle.low));
    const highPrice = Math.max(...candles.map((candle) => candle.high));
    const firstTick = Math.floor((lowPrice - averageClose) / priceStep) - 1;
    const lastTick = Math.ceil((highPrice - averageClose) / priceStep) + 1;
    const domainMax = averageClose + lastTick * priceStep;
    const tickCount = lastTick - firstTick;
    const priceHeight = tickCount * GRID_UNIT_SIZE;

    const priceToY = (price) =>
        PRICE_TOP + ((domainMax - price) / priceStep) * GRID_UNIT_SIZE;

    const plotWidth = candles.length * SLOT_WIDTH;
    const chartWidth = PLOT_LEFT + plotWidth + PLOT_RIGHT;
    const chartHeight = PRICE_TOP + priceHeight + PRICE_BOTTOM_PADDING;
    const maxVolume = Math.max(...candles.map((candle) => candle.volume));
    const volumeBaseline = VOLUME_VIEW_HEIGHT - VOLUME_BOTTOM_PADDING;
    const maxVolumeBarHeight = VOLUME_VIEW_HEIGHT - VOLUME_TOP - VOLUME_BOTTOM_PADDING;
    const priceTicks = Array.from({ length: tickCount + 1 }, (_, index) => {
        const tickIndex = firstTick + index;
        const price = averageClose + tickIndex * priceStep;

        return { tickIndex, price, y: priceToY(price) };
    });
    const timeGridIndices = [];

    for (let index = 0; index < candles.length; index += CANDLES_PER_TIME_UNIT) {
        timeGridIndices.push(index);
    }

    function handlePointerDown(event, allowVerticalPan = true) {
        if (event.button !== 0) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            pointerX: event.clientX,
            pointerY: event.clientY,
            offsetX: offsetRef.current.x,
            offsetY: offsetRef.current.y,
            allowVerticalPan,
        };
    }

    function handlePointerMove(event) {
        const drag = dragRef.current;
        const viewport = viewportRef.current;
        if (!drag || drag.pointerId !== event.pointerId || !viewport) {
            return;
        }

        const xRange = getPanRange(
            viewport.clientWidth,
            chartWidth
        );
        const yRange = getPanRange(
            viewport.clientHeight,
            chartHeight
        );
        const x = clamp(
            drag.offsetX + event.clientX - drag.pointerX,
            xRange.min,
            xRange.max
        );
        const y = drag.allowVerticalPan
            ? clamp(
                drag.offsetY + event.clientY - drag.pointerY,
                yRange.min,
                yRange.max
            )
            : drag.offsetY;

        offsetRef.current = { x, y };
        if (canvasRef.current) {
            canvasRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        if (volumeRef.current) {
            volumeRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
        }
        if (priceAxisRef.current) {
            priceAxisRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
        }
        if (timeAxisRef.current) {
            timeAxisRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
        }
    }

    function handlePointerUp(event) {
        if (dragRef.current?.pointerId !== event.pointerId) {
            return;
        }

        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }

    function handleLostPointerCapture(event) {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
        }
    }

    const dragHandlers = {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
        onLostPointerCapture: handleLostPointerCapture,
    };

    return (
        <main
            className="h-screen w-screen overflow-hidden bg-zinc-300"
            style={{
                display: "grid",
                gridTemplateColumns: "90vw 10vw",
                gridTemplateRows: "70vh 20vh 5vh 5vh",
            }}
        >
            <div
                ref={viewportRef}
                className="relative h-[70vh] w-[90vw] overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
                style={{ gridColumn: 1, gridRow: 1 }}
                {...dragHandlers}
            >
                <svg
                    ref={canvasRef}
                    role="img"
                    aria-label="Draggable candlestick chart with square five-minute and 0.1-percent price grid units"
                    width={chartWidth}
                    height={chartHeight}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="absolute left-0 top-0 block bg-zinc-300"
                    style={{ transform: "translate3d(0, 0, 0)" }}
                >
                    <rect
                        x={PLOT_LEFT}
                        y={PRICE_TOP}
                        width={plotWidth}
                        height={priceHeight}
                        fill="#d4d4d8"
                    />

                    {priceTicks.map(({ tickIndex, y }) => (
                        <line
                            key={`price-${tickIndex}`}
                            x1={PLOT_LEFT}
                            x2={PLOT_LEFT + plotWidth}
                            y1={y}
                            y2={y}
                            stroke="#a1a1aa"
                            strokeWidth="1"
                        />
                    ))}

                    {timeGridIndices.map((index) => {
                        const x = PLOT_LEFT + index * SLOT_WIDTH;

                        return (
                            <line
                                key={`time-${index}`}
                                x1={x}
                                x2={x}
                                y1={PRICE_TOP}
                                y2={PRICE_TOP + priceHeight}
                                stroke="#a1a1aa"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {candles.map((candle, index) => (
                        <Candle
                            key={`${candle.timestamp}-${index}`}
                            candle={candle}
                            candleSequence={index}
                            x={PLOT_LEFT + index * SLOT_WIDTH + SLOT_WIDTH / 2}
                            candleWidth={SLOT_WIDTH}
                            priceToY={priceToY}
                            formatTime={formatIST}
                        />
                    ))}
                </svg>

                <div className="pointer-events-none absolute left-3 top-2 text-xs text-zinc-700">
                    Drag to pan · {CANDLES_PER_TIME_UNIT} candles = {GRID_UNIT_SIZE}px ·
                    {" "}0.1% average close = {GRID_UNIT_SIZE}px
                </div>
            </div>

            <aside
                aria-label="Price axis"
                className="relative h-[70vh] w-[10vw] overflow-hidden border-l border-zinc-400 bg-zinc-200 text-xs text-zinc-700"
                style={{ gridColumn: 2, gridRow: 1 }}
            >
                <div
                    ref={priceAxisRef}
                    className="absolute left-0 top-0 w-full"
                    style={{
                        height: chartHeight,
                        transform: "translate3d(0, 0, 0)",
                    }}
                >
                    {priceTicks.map(({ tickIndex, price, y }) => (
                        <span
                            key={`price-label-${tickIndex}`}
                            className="absolute left-2 -translate-y-1/2 whitespace-nowrap"
                            style={{ top: y }}
                        >
                            {price.toFixed(2)}
                        </span>
                    ))}
                </div>
            </aside>

            <div
                className="relative h-[20vh] w-[90vw] overflow-hidden border-t border-zinc-400 bg-zinc-300 touch-none select-none cursor-grab active:cursor-grabbing"
                style={{ gridColumn: 1, gridRow: 2 }}
                onPointerDown={(event) => handlePointerDown(event, false)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handleLostPointerCapture}
            >
                <svg
                    ref={volumeRef}
                    aria-label="Volume bars"
                    width={chartWidth}
                    height="100%"
                    viewBox={`0 0 ${chartWidth} ${VOLUME_VIEW_HEIGHT}`}
                    preserveAspectRatio="none"
                    className="absolute left-0 top-0 block bg-zinc-300"
                    style={{ transform: "translate3d(0, 0, 0)" }}
                >
                    <rect
                        x={PLOT_LEFT}
                        y={0}
                        width={plotWidth}
                        height={VOLUME_VIEW_HEIGHT}
                        fill="#d4d4d8"
                    />

                    {timeGridIndices.map((index) => {
                        const x = PLOT_LEFT + index * SLOT_WIDTH;

                        return (
                            <line
                                key={`volume-time-${index}`}
                                x1={x}
                                x2={x}
                                y1={VOLUME_TOP}
                                y2={volumeBaseline}
                                stroke="#a1a1aa"
                                strokeWidth="1"
                            />
                        );
                    })}

                    <line
                        x1={PLOT_LEFT}
                        x2={PLOT_LEFT + plotWidth}
                        y1={volumeBaseline}
                        y2={volumeBaseline}
                        stroke="#71717a"
                        strokeWidth="1"
                    />

                    <text
                        x={PLOT_LEFT}
                        y={15}
                        fill="#52525b"
                        fontSize="11"
                    >
                        VOLUME
                    </text>

                    {candles.map((candle, index) => {
                        const barHeight = maxVolume > 0
                            ? (candle.volume / maxVolume) * maxVolumeBarHeight
                            : 0;
                        const barWidth = Math.min(10, SLOT_WIDTH * 0.68);
                        const x = PLOT_LEFT + index * SLOT_WIDTH + SLOT_WIDTH / 2;

                        return (
                            <rect
                                key={`volume-${candle.timestamp}-${index}`}
                                x={x - barWidth / 2}
                                y={volumeBaseline - barHeight}
                                width={barWidth}
                                height={barHeight}
                                fill="#8b5cf6"
                                opacity="0.7"
                            />
                        );
                    })}
                </svg>
            </div>

            <div
                aria-hidden="true"
                className="border-l border-t border-zinc-400 bg-zinc-200"
                style={{ gridColumn: 2, gridRow: 2 }}
            />

            <div
                role="group"
                aria-label="Time axis"
                className="relative h-[5vh] w-[90vw] overflow-hidden border-t border-zinc-400 bg-zinc-200 text-xs text-zinc-700"
                style={{ gridColumn: 1, gridRow: 3 }}
            >
                <div
                    ref={timeAxisRef}
                    className="absolute left-0 top-0 h-full"
                    style={{
                        width: chartWidth,
                        transform: "translate3d(0, 0, 0)",
                    }}
                >
                    {timeGridIndices.map((index) => (
                        <span
                            key={`time-label-${index}`}
                            className="absolute top-1/2 whitespace-nowrap"
                            style={{
                                left: PLOT_LEFT + index * SLOT_WIDTH + GRID_UNIT_SIZE / 2,
                                transform: "translate(-50%, -50%)",
                            }}
                        >
                            {formatIST(candles[index].timestamp)}
                        </span>
                    ))}
                </div>
            </div>

            <div
                aria-hidden="true"
                className="border-l border-t border-zinc-400 bg-zinc-300"
                style={{ gridColumn: 2, gridRow: 3 }}
            />
            <div
                aria-hidden="true"
                className="bg-zinc-300"
                style={{ gridColumn: "1 / span 2", gridRow: 4 }}
            />
        </main>
    );
}

export default Chart;
