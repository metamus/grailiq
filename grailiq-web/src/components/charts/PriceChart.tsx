import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/utils';
import type { PricePoint, TimeRange } from '@/types';

interface PriceChartProps {
  data: PricePoint[];
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
}

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

/** Price trend chart — premium gradient area chart */
export function PriceChart({ data, timeRange = '30d', onTimeRangeChange }: PriceChartProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>(timeRange);

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: new Date(point.recordedAt).getTime(),
        price: parseFloat(point.price),
        marketPrice: point.marketPrice ? parseFloat(point.marketPrice) : null,
      })),
    [data],
  );

  // Compute price change for color
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    return chartData[chartData.length - 1].price - chartData[0].price;
  }, [chartData]);

  const lineColor = priceChange >= 0 ? '#22C55E' : '#EF4444';
  const gradientId = priceChange >= 0 ? 'greenGradient' : 'redGradient';

  const handleRangeChange = (range: TimeRange) => {
    setActiveRange(range);
    onTimeRangeChange?.(range);
  };

  return (
    <div>
      {/* Time range pills */}
      <div className="flex gap-1 mb-4">
        {timeRanges.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleRangeChange(value)}
            className={`px-3.5 py-1.5 text-xs rounded-lg font-semibold transition-all ${
              activeRange === value
                ? 'bg-grailiq-purple text-white shadow-sm shadow-grailiq-purple/30'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(ts) => format(new Date(ts), 'MMM d')}
            stroke="#D1D5DB"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            stroke="#D1D5DB"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip
            formatter={(value: number) => [formatPrice(value), 'Price']}
            labelFormatter={(ts) => format(new Date(ts as number), 'MMM d, yyyy')}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              padding: '10px 14px',
              fontSize: '13px',
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 5,
              fill: lineColor,
              stroke: '#fff',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
