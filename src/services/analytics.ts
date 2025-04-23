import { JournalEntry, Report } from '../types';
import dbService from './db';
import aiService from './aiService';

export class AnalyticsService {
  // Generate pattern analysis report
  async generatePatternAnalysis(childName: string): Promise<Report> {
    try {
      // Get all journal entries for the child
      const entries = await dbService.getJournalEntries(childName);
      
      if (entries.length === 0) {
        throw new Error(`No journal entries found for ${childName}`);
      }
      
      // Generate pattern analysis using AI service
      const content = await aiService.generatePatternAnalysis(entries);
      
      // Create report object
      const report: Report = {
        id: crypto.randomUUID(),
        childName,
        type: 'pattern',
        content,
        timestamp: Date.now(),
        generatedFrom: entries.map(entry => entry.id)
      };
      
      // Save report to database
      await dbService.saveReport(report);
      
      return report;
    } catch (error) {
      console.error('Error generating pattern analysis:', error);
      throw error;
    }
  }
  
  // Generate trend insights report
  async generateTrendInsights(childName: string): Promise<Report> {
    try {
      // Get all journal entries for the child
      const entries = await dbService.getJournalEntries(childName);
      
      if (entries.length === 0) {
        throw new Error(`No journal entries found for ${childName}`);
      }
      
      // Generate trend insights using AI service
      const content = await aiService.generateTrendInsights(entries);
      
      // Create report object
      const report: Report = {
        id: crypto.randomUUID(),
        childName,
        type: 'trend',
        content,
        timestamp: Date.now(),
        generatedFrom: entries.map(entry => entry.id)
      };
      
      // Save report to database
      await dbService.saveReport(report);
      
      return report;
    } catch (error) {
      console.error('Error generating trend insights:', error);
      throw error;
    }
  }
  
  // Generate smart summary report
  async generateSmartSummary(childName: string): Promise<Report> {
    try {
      // Get all journal entries for the child
      const entries = await dbService.getJournalEntries(childName);
      
      if (entries.length === 0) {
        throw new Error(`No journal entries found for ${childName}`);
      }
      
      // Generate smart summary using AI service
      const content = await aiService.generateSmartSummary(entries);
      
      // Create report object
      const report: Report = {
        id: crypto.randomUUID(),
        childName,
        type: 'summary',
        content,
        timestamp: Date.now(),
        generatedFrom: entries.map(entry => entry.id)
      };
      
      // Save report to database
      await dbService.saveReport(report);
      
      return report;
    } catch (error) {
      console.error('Error generating smart summary:', error);
      throw error;
    }
  }
  
  // Generate recommendations report
  async generateRecommendations(childName: string): Promise<Report> {
    try {
      // Get all journal entries for the child
      const entries = await dbService.getJournalEntries(childName);
      
      if (entries.length === 0) {
        throw new Error(`No journal entries found for ${childName}`);
      }
      
      // Generate recommendations using AI service
      const content = await aiService.generateRecommendations(entries);
      
      // Create report object
      const report: Report = {
        id: crypto.randomUUID(),
        childName,
        type: 'recommendations',
        content,
        timestamp: Date.now(),
        generatedFrom: entries.map(entry => entry.id)
      };
      
      // Save report to database
      await dbService.saveReport(report);
      
      return report;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
