
function Candle() {
    let upperWick = Math.floor(Math.random() * 100);
    let lowerWick = Math.floor(Math.random() * 100);
    let candleBody = Math.floor(Math.random() * 200 - 100);
    let candleColor =
        candleBody > 0
            ? "bg-green-500"
            : (candleBody < 0
                ? "bg-red-500"
                : "bg-black"
            );

    let upperWickStyle = `w-[1px] ${candleColor}`;
    let lowerWickStyle = `w-[1px] ${candleColor}`;
    let candleBodyStyle = `w-[11px] ${candleColor}`;

    return (
        <>
            <div className="flex flex-col items-center">
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
        </>
    );
}

export default Candle;
