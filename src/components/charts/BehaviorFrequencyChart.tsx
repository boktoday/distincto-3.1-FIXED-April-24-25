import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BehaviorDataPoint {
  name: string; // e.g., Date or Behavior Type
  frequency: number;
}

interface BehaviorFrequencyChartProps {
  data: BehaviorDataPoint[];
  title?: string;
}

// Get the raspberry color from Tailwind config (or define it here if needed)
// Note: Accessing Tailwind theme directly in JS/TS requires specific setup.
// For simplicity, we'll hardcode the value defined in tailwind.config.js
const raspberryColor = '#C3245D'; // From tailwind.config.js theme.extend.colors.raspberry

const BehaviorFrequencyChart: React.FC<BehaviorFrequencyChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 italic my-4">No data available for chart.</p>;
  }

  return (
    <div className="my-6">
      {title && <h4 className="text-md font-semibold mb-4 text-center">{title}</h4>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* Updated fill color to match website theme */}
          <Bar dataKey="frequency" fill={raspberryColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BehaviorFrequencyChart;
