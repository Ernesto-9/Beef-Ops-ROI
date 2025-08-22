'use client';
import * as React from 'react';
type Props = { defaultValue: number[]; min: number; max: number; step?: number; onValueChange?: (value: number[]) => void; };
export function Slider({ defaultValue, min, max, step = 1, onValueChange }: Props) {
  const [val, setVal] = React.useState<number>(defaultValue?.[0] ?? min);
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={val}
      onChange={(e) => { const v = Number(e.target.value); setVal(v); onValueChange && onValueChange([v]); }}
      className="w-full accent-indigo-600"
    />
  );
}
