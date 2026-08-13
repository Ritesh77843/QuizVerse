'use client';

const PRESETS = [5, 10, 15, 20, 25, 30];

interface QuestionCountSelectorProps {
    value: number;
    onChange: (count: number) => void;
}

export default function QuestionCountSelector({ value, onChange }: QuestionCountSelectorProps) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">
                Number of Questions
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {PRESETS.map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
              ${value === n
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                            }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">Or enter custom:</span>
                <input
                    type="number"
                    min={1}
                    value={value}
                    onChange={e => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 1) onChange(v);
                    }}
                    className="w-24 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-violet-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-zinc-500">questions</span>
            </div>
        </div>
    );
}
