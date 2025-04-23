import React from 'react';
import { MessageSquare, CheckCircle, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { SmartSummaryData } from '../../types';

interface SmartSummaryReportViewProps {
  data: SmartSummaryData;
}

const SmartSummaryReportView: React.FC<SmartSummaryReportViewProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200"> {/* Added border */}
      {/* Overview Section */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100"> {/* Changed color, added border */}
        <div className="flex items-center gap-2 mb-2">
           <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
           <h4 className="text-md font-semibold text-blue-800">Overview</h4>
        </div>
        <p className="text-sm text-blue-700">{data.overview}</p>
      </div>

      <div className="space-y-6">
        {/* Key Points & Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Points */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" /> {/* Changed Icon */}
              Key Points
            </h4>
            <ul className="space-y-2">
              {data.keyPoints.map((point, index) => (
                <li key={`kp-${index}`} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 mt-[7px] bg-green-500 rounded-full flex-shrink-0"></span> {/* Adjusted size/margin */}
                  <span className="text-sm text-gray-600">{point}</span>
                </li>
              ))}
              {data.keyPoints.length === 0 && <li className="text-sm text-gray-500 italic">No specific key points noted.</li>}
            </ul>
          </div>

          {/* Progress */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> {/* Changed Icon */}
              Progress
            </h4>
            <ul className="space-y-2">
              {data.progress.map((item, index) => (
                <li key={`prog-${index}`} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 mt-[7px] bg-indigo-500 rounded-full flex-shrink-0"></span> {/* Adjusted size/margin */}
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
               {data.progress.length === 0 && <li className="text-sm text-gray-500 italic">No specific progress points noted.</li>}
            </ul>
          </div>
        </div>

        {/* Concerns */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" /> {/* Changed Icon */}
            Concerns
          </h4>
          <ul className="space-y-2">
            {data.concerns.map((concern, index) => (
              <li key={`con-${index}`} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 mt-[7px] bg-red-500 rounded-full flex-shrink-0"></span> {/* Adjusted size/margin */}
                <span className="text-sm text-gray-600">{concern}</span>
              </li>
            ))}
             {data.concerns.length === 0 && <li className="text-sm text-gray-500 italic">No specific concerns noted.</li>}
          </ul>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" /> {/* Changed Icon */}
            Recommendations
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li key={`rec-${index}`} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 mt-[7px] bg-yellow-500 rounded-full flex-shrink-0"></span> {/* Adjusted size/margin */}
                <span className="text-sm text-gray-600">{rec}</span>
              </li>
            ))}
             {data.recommendations.length === 0 && <li className="text-sm text-gray-500 italic">No specific recommendations provided.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SmartSummaryReportView;
