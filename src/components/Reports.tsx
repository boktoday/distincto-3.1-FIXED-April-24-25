import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileText, Calendar, BarChart2 } from 'lucide-react';
import dbService from '../services/db';
import aiService from '../services/aiService';
import { Report, JournalEntry, FoodItem, SmartSummaryData, ReportType } from '../types';
import BehaviorFrequencyChart from './charts/BehaviorFrequencyChart';
import SmartSummaryReportView from './reports/SmartSummaryReportView';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

// Helper function to generate sample chart data
const generateSampleChartData = (entries: JournalEntry[], foodItems: FoodItem[], selectedChild: string): { name: string; frequency: number }[] => {
  if ((!entries || entries.length === 0) && (!foodItems || foodItems.length === 0)) return [];

  // Filter data for the selected child *before* counting categories
  const childEntries = entries.filter(e => e.childName === selectedChild);
  const childFoodItems = foodItems.filter(f => f.childName === selectedChild);

  if (childEntries.length === 0 && childFoodItems.length === 0) return [];

  // Show counts per category for the selected child
  const categoryCounts: { [key: string]: number } = {
      'Behavioral': childEntries.filter(e => e.behavioralNotes?.trim()).length,
      'Food/Nutrition': childEntries.filter(e => e.foodNutritionNotes?.trim()).length + childFoodItems.length,
      'Social': childEntries.filter(e => e.socialEngagementNotes?.trim()).length,
      'Sensory': childEntries.filter(e => e.sensoryProfileNotes?.trim()).length,
      'Education': childEntries.filter(e => e.educationNotes?.trim()).length,
      'Medication': childEntries.filter(e => e.medicationNotes?.trim()).length,
      'Sleep': childEntries.filter(e => e.sleepNotes?.trim()).length, // Add Sleep category
  };

  return Object.entries(categoryCounts)
      .filter(([, frequency]) => frequency > 0) // Only show categories with data
      .map(([name, frequency]) => ({ name, frequency }));
};


const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ReportType>('summary');
  const [selectedChild, setSelectedChild] = useState<string>(''); // Initialize as empty, will be set in useEffect
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [children, setChildren] = useState<string[]>([]);
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [allFoodItems, setAllFoodItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Reload reports only if a child is selected
    if (selectedChild) {
      loadReports();
    } else {
      // If no child is selected (e.g., initial load or no children exist), clear reports
      setReports([]);
    }
  }, [selectedChild, dateRange]); // Reload whenchild or date range changes

  const loadInitialData = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Fetch children first to set the default selection
      const loadedChildren = await loadChildren();
      // Set the first child as selected if available
      if (loadedChildren.length > 0 && !selectedChild) {
        setSelectedChild(loadedChildren[0]);
      } else if (loadedChildren.length === 0) {
        setSelectedChild(''); // Ensure no child is selected if list is empty
      }

      // Fetch other data
      await Promise.all([
        loadAllEntries(),
        loadAllFoodItems()
      ]);

      // Load reports based on the potentially updated selectedChild
      // This check prevents loading reports if no child could be selected
      if (selectedChild || (loadedChildren.length > 0 && !selectedChild)) {
         await loadReports(loadedChildren.length > 0 ? loadedChildren[0] : selectedChild);
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load initial data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (): Promise<string[]> => {
    try {
      const entries = await dbService.getAllJournalEntries();
      const foodItems = await dbService.getFoodItems();
      const uniqueChildren = [...new Set([...entries.map(entry => entry.childName), ...foodItems.map(item => item.childName)])].sort(); // Sort alphabetically
      setChildren(uniqueChildren);

      // If the currently selected child is no longer in the list, update selection
      if (selectedChild && !uniqueChildren.includes(selectedChild)) {
        setSelectedChild(uniqueChildren.length > 0 ? uniqueChildren[0] : '');
      }
      // If no child was selected, and children are now available, select the first one
      else if (!selectedChild && uniqueChildren.length > 0) {
         setSelectedChild(uniqueChildren[0]);
      }
       // If no children exist, ensure selectedChild is empty
      else if (uniqueChildren.length === 0) {
          setSelectedChild('');
      }

      return uniqueChildren; // Return the loaded children list
    } catch (err) {
      console.error('Error loading children:', err);
      setError('Failed to load child list.');
      setChildren([]); // Reset children on error
      setSelectedChild('');
      return []; // Return empty array on error
    }
  };


  const loadAllEntries = async () => {
    try {
      const entries = await dbService.getAllJournalEntries();
      setAllEntries(entries);
    } catch (err) {
      console.error('Error loading all journal entries:', err);
      setError('Failed to load journal entries.');
      setAllEntries([]); // Reset on error
    }
  };

  const loadAllFoodItems = async () => {
    try {
      const items = await dbService.getFoodItems();
      setAllFoodItems(items);
    } catch (err) {
      console.error('Error loading all food items:', err);
      setError('Failed to load food items.');
      setAllFoodItems([]); // Reset on error
    }
  };


  const getDateRangeFilter = () => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    switch (dateRange) {
      case 'week':
        return now - (7 * msPerDay);
      case 'month':
        return now - (30 * msPerDay);
      case 'quarter':
        return now - (90 * msPerDay);
      default:
        return 0;
    }
  };

  // Modified loadReports to accept an optional child name override
  const loadReports = async (childNameToLoad?: string) => {
     const targetChild = childNameToLoad ?? selectedChild; // Use override if provided, else use state

     // Only proceed if a child is actually selected
     if (!targetChild) {
       setReports([]); // Clear reports if no child is selected
       return;
     }

    try {
      setError(null); // Clear previous report loading errors
      const allReports = await dbService.getReports();

      // Filter reports specifically for the selected child
      // No longer need to check for 'all'
      let filteredReports = allReports.filter(report => report.childName === targetChild);

      // Filter reports based on generation timestamp within the date range
      const dateFilter = getDateRangeFilter();
      filteredReports = filteredReports.filter(report => report.timestamp >= dateFilter);

      filteredReports.sort((a, b) => b.timestamp - a.timestamp);
      setReports(filteredReports);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports for the selected child.');
      setReports([]); // Clear reports on error
    }
  };

  const generateReport = async () => {
    // Ensure a child is selected before generating
    if (!selectedChild) {
      setError("Please select a child to generate a report.");
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      // Filter entries and food items for the *selected child*
      const childFilteredEntries = allEntries.filter(entry => entry.childName === selectedChild);
      const childFilteredFoodItems = allFoodItems.filter(item => item.childName === selectedChild);

      // Filter by date range
      const dateFilter = getDateRangeFilter();
      const timeFilteredEntries = childFilteredEntries.filter(entry => entry.timestamp >= dateFilter);
      const timeFilteredFoodItems = childFilteredFoodItems.filter(item => item.timestamp >= dateFilter);

      // Check if there's enough data
      if (timeFilteredEntries.length === 0 && timeFilteredFoodItems.length === 0) {
         setError(`No journal entries or food items found for ${selectedChild} in the selected date range (${dateRange}). Cannot generate report.`);
         setGenerating(false);
         return;
      }

      // Generate content using AI service
      const reportContentResult = await aiService.generateReportContent(selectedType, timeFilteredEntries, timeFilteredFoodItems);

      // Determine which IDs were used
      const generatedFromIds = [
          ...timeFilteredEntries.map(entry => entry.id),
          // Include food item IDs only if the report type is 'pattern'
          ...(selectedType === 'pattern' ? timeFilteredFoodItems.map(item => item.id) : [])
      ];

      const newReport: Report = {
        id: crypto.randomUUID(),
        type: selectedType,
        content: typeof reportContentResult === 'string' ? reportContentResult : `Smart Summary generated for ${selectedChild}.`,
        structuredContent: typeof reportContentResult !== 'string' ? reportContentResult : undefined,
        timestamp: Date.now(),
        childName: selectedChild, // Use the selected child's name
        generatedFrom: generatedFromIds
      };

      await dbService.saveReport(newReport);
      await loadReports(); // Reload reports for the current child

    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err instanceof Error ? err.message : 'Unknown error'}. Please check AI settings or try again.`);
    } finally {
      setGenerating(false);
    }
  };

  // Helper to get data relevant to a specific report
  const getDataForReport = (report: Report): { entries: JournalEntry[], foodItems: FoodItem[] } => {
    // Filter all entries/items based on IDs stored in the report
    const entries = allEntries.filter(entry => report.generatedFrom.includes(entry.id));
    // Filter food items only if the report type is 'pattern' or if needed for other types in the future
    // Currently, only 'pattern' explicitly uses foodItems in generation logic shown
    const foodItems = (report.type === 'pattern' || report.generatedFrom.some(id => allFoodItems.find(item => item.id === id)))
      ? allFoodItems.filter(item => report.generatedFrom.includes(item.id))
      : [];
    return { entries, foodItems };
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-raspberry" />
      </div>
    );
  }

  // Handle case where no children exist
  if (children.length === 0 && !loading) {
     return (
       <div className="container mx-auto px-4 py-12 mt-8 text-center">
         <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
         <h1 className="text-2xl font-bold mb-4">No Children Found</h1>
         <p className="text-gray-600">
           Please add a child in the Journal or Food Journey section before generating reports.
         </p>
       </div>
     );
   }

  return (
    <div className="container mx-auto px-4 py-12 mt-8">
      {/* Generation Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6">Generate New Report</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Child Selector - Removed "All Children" option */}
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry focus:border-raspberry"
            disabled={children.length === 0} // Disable if no children
          >
            {/* <option value="" disabled>Select a Child</option> */} {/* Optional: Add placeholder */}
            {children.map(child => (
              <option key={child} value={child}>{child}</option>
            ))}
          </select>
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry focus:border-raspberry"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
          {/* Report Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ReportType)}
            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-raspberry focus:border-raspberry"
            disabled={generating}
          >
            <option value="summary">Smart Summary</option>
            <option value="pattern">Pattern Analysis</option>
            <option value="trend">Trend Report</option> {/* Trend option exists */}
            <option value="recommendations">Recommendations</option>
          </select>
          {/* Generate Button */}
          <button
            onClick={generateReport}
            disabled={generating || !selectedChild} // Disable if generating or no child selected
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-raspberry hover:bg-raspberry-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <><Loader2 size={18} className="mr-2 animate-spin" />Generating...</> : <><FileText size={18} className="mr-2" />Generate Report</>}
          </button>
        </div>
         {error && (
          <div className="flex items-center bg-red-50 p-3 rounded-md mt-4 border border-red-200">
            <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={20} />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Display Reports */}
      <h2 className="text-xl font-bold mb-6">
        Generated Reports for <span className="text-raspberry">{selectedChild || '...'}</span>
      </h2>
      {/* Show message if a child is selected but no reports match filters */}
      {selectedChild && reports.length === 0 && !loading && !error && (
         <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No reports found for <span className="font-medium">{selectedChild}</span> matching the current filters.</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting the date range or generating a new report.</p>
        </div>
      )}
      {/* Render reports if they exist */}
      {reports.length > 0 && (
        <div className="space-y-8">
          {reports.map((report) => {
            // Get data associated with the report
            const { entries: reportEntries, foodItems: reportFoodItems } = getDataForReport(report);
            // Generate chart data specifically for the child the report is for
            const chartData = generateSampleChartData(reportEntries, reportFoodItems, report.childName);
            const totalDataPoints = reportEntries.length + reportFoodItems.length;

            return (
              <div key={report.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                {/* Report Header */}
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 bg-gray-50">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {/* Display report type correctly */}
                      {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      For: <span className="font-medium">{report.childName}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center flex-shrink-0 bg-white px-2 py-1 rounded border border-gray-200 mt-2 sm:mt-0">
                    <Calendar size={13} className="mr-1.5" />
                    Generated: {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {/* Report Content Area */}
                <div className="p-6">
                  {/* Render Smart Summary view or ReactMarkdown */}
                  {report.type === 'summary' && report.structuredContent ? (
                    <SmartSummaryReportView data={report.structuredContent} />
                  ) : (
                    <div className="prose prose-sm max-w-none"> {/* Apply prose styles */}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {report.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                 {/* Chart Section */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                   <h4 className="text-md font-semibold mb-2 flex items-center text-gray-700">
                     <BarChart2 size={18} className="mr-2 text-raspberry" />
                     Associated Data Visualization
                   </h4>
                   {chartData.length > 0 ? (
                     <BehaviorFrequencyChart
                       data={chartData}
                       title={`Data Overview (${totalDataPoints} items)`} // Simplified title
                     />
                   ) : (
                     <p className="text-sm text-gray-500 text-center py-4">No chart data available for this report's content.</p>
                   )}
                   <p className="text-xs text-gray-500 italic mt-2 text-center">
                     {/* Clarify chart data source */}
                     Chart based on {reportEntries.length} journal entries and {reportFoodItems.length} food items used for this report generation. (Chart shows category frequency for {report.childName}).
                   </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reports;
