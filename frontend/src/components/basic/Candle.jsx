
function Candle({ candleSequence, timestamp, open, high, low, close, volume, label }) {
    let upperWick, lowerWick, candleBody, volumeBar;
    
    if (high && low && open && close && volume) {
        upperWick = (high - Math.max(open, close));
        lowerWick = (Math.min(open, close) - low);
        candleBody = close - open;
        volumeBar = volume;
    } else {
        upperWick = Math.floor(Math.random() * 100);
        lowerWick = Math.floor(Math.random() * 100);
        candleBody = Math.floor(Math.random() * 200 - 100);
        volumeBar = Math.floor(Math.random() * 100);
    }

    
    const candleColor =
        candleBody > 0
            ? "bg-green-500 group-hover:bg-green-700"
            : (candleBody < 0
                ? "bg-red-500 group-hover:bg-red-700"
                : "bg-black"
            );

    const upperWickStyle = `w-[1px] ${candleColor}`;
    const lowerWickStyle = `w-[1px] ${candleColor}`;
    const candleBodyStyle = `w-[11px] ${candleColor}`;
    const volumeBarStyle = `w-[11px] bg-violet-500 group-hover:bg-violet-700`;

    const posLeft = (candleSequence ?? 0) * 15 + 10;
    const posBottom = (low ?? 0) + 110;

    return (
        <div className="group">
            <div
                className="flex flex-col items-center absolute 
                            group-hover:scale-120 cursor-pointer "
                style={{
                    bottom: `${posBottom}px`,
                    left: `${posLeft}px`
                }}
            >
                <div
                    className={upperWickStyle}
                    style={{ height: `${upperWick}px` }}
                />

                <div
                    className={candleBodyStyle}
                    style={{ height: `${Math.max(Math.abs(candleBody), 2)}px` }}
                />

                <div
                    className={lowerWickStyle}
                    style={{ height: `${lowerWick}px` }}
                />
            </div>
        
            <div
                className={volumeBarStyle + " absolute"}
                style={{
                    height: `${volumeBar}px`,
                    bottom: `0px`,
                    left: `${posLeft}px`
                }}
            >
                <p
                    className="group-hover:visible invisible px-1 z-1
                                absolute bottom-20 bg-white rounded-full"
                >
                    {volumeBar}
                </p>
            </div>
        </div>
    );
}

export default Candle;
