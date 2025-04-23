import { JournalEntry, FoodItem, Report, SmartSummaryData } from './types';

// Mock child names
export const mockChildNames = ['Emma', 'Noah', 'Olivia', 'Liam'];

// Mock journal entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: '1',
    childName: 'Emma',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    medicationNotes: 'Took allergy medication in the morning. No side effects observed.',
    educationNotes: 'Started recognizing letters A through E. Very excited about learning to write her name.',
    socialEngagementNotes: 'Played well with other children at the park. Shared toys without prompting.',
    sensoryProfileNotes: 'Still sensitive to loud noises. Covered ears during the thunderstorm.',
    foodNutritionNotes: 'Tried broccoli for the first time! Mixed reaction but ate a few pieces when mixed with cheese.',
    behavioralNotes: 'Had a meltdown when it was time to leave the park. Calmed down after 5 minutes of quiet time.',
    sleepNotes: 'Slept through the night, 10 hours.', // Added sleep note
    magicMoments: 'Said "I love you" unprompted for the first time today!',
    synced: true
  },
  {
    id: '2',
    childName: 'Emma',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    medicationNotes: 'No medication today.',
    educationNotes: 'Practiced writing the letter E. Getting better at holding the pencil correctly.',
    socialEngagementNotes: 'Had a playdate with Sarah. They played pretend kitchen for almost an hour.',
    sensoryProfileNotes: 'Enjoyed the sensory bin with rice and small toys. Spent 30 minutes exploring textures.',
    foodNutritionNotes: 'Good appetite today. Ate all her vegetables at dinner without complaint.',
    behavioralNotes: 'Followed bedtime routine perfectly. No resistance to brushing teeth tonight.',
    sleepNotes: 'Woke up once around 2 AM, but went back to sleep quickly. Total 9.5 hours.', // Added sleep note
    magicMoments: 'Built a tower with blocks that was taller than her previous record!',
    synced: true
  },
  {
    id: '3',
    childName: 'Noah',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    medicationNotes: 'Took prescribed medication for ear infection. Seems to be helping.',
    educationNotes: 'Counting to 20 consistently now. Starting to understand basic addition with fingers.',
    socialEngagementNotes: 'Shy at the beginning of daycare but warmed up after an hour.',
    sensoryProfileNotes: 'Refused to wear the new sweater - said it was "too scratchy".',
    foodNutritionNotes: 'Picky with food today. Only wanted pasta and refused vegetables.',
    behavioralNotes: 'Had difficulty transitioning between activities. Using a timer seems to help.',
    sleepNotes: 'Difficult settling down, took an hour to fall asleep. Slept 8 hours.', // Added sleep note
    magicMoments: 'Helped his little sister when she fell down without being asked.',
    synced: false
  },
  {
    id: '4',
    childName: 'Olivia',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
    medicationNotes: 'No medication needed.',
    educationNotes: 'Reading simple three-letter words. Very interested in books about animals.',
    socialEngagementNotes: 'Made a new friend at swimming class. They played together the whole time.',
    sensoryProfileNotes: 'Loves deep pressure. Asked for tight hugs several times today.',
    foodNutritionNotes: 'Tried salmon for the first time and liked it! Asked for seconds.',
    behavioralNotes: 'Used words to express frustration instead of crying. Big improvement!',
    sleepNotes: 'Solid 11 hours of sleep.', // Added sleep note
    magicMoments: 'Drew a family portrait with amazing detail for her age.',
    synced: true
  },
  {
    id: '5',
    childName: 'Liam',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
    medicationNotes: 'Started new vitamin supplement as recommended by pediatrician.',
    educationNotes: 'Very interested in dinosaurs. Learning all their names and when they lived.',
    socialEngagementNotes: 'Played alongside other children but not yet interacting directly.',
    sensoryProfileNotes: 'Seeking vestibular input - spinning in circles and jumping from furniture.',
    foodNutritionNotes: 'Good day for trying new foods. Tasted bell peppers and cucumber.',
    behavioralNotes: 'Tantrum when iPad time was over. Need to work on transitions.',
    sleepNotes: 'Resisted nap time. Night sleep was restless, woke up crying twice. Total 8.5 hours.', // Added sleep note
    magicMoments: 'Said his first full sentence: "I want more milk please."',
    synced: true
  }
];

// Mock food items
export const mockFoodItems: FoodItem[] = [
  {
    id: '1',
    childName: 'Emma',
    name: 'Broccoli',
    category: 'new',
    notes: 'First tried on May 15. Mixed with cheese to make it more appealing.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
    synced: true
  },
  {
    id: '2',
    childName: 'Emma',
    name: 'Apples',
    category: 'safe',
    notes: 'Favorite fruit. Prefers sliced with skin removed.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30,
    synced: true
  },
  {
    id: '3',
    childName: 'Emma',
    name: 'Yogurt',
    category: 'safe',
    notes: 'Likes plain Greek yogurt with honey. Good protein source.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 60,
    synced: true
  },
  {
    id: '4',
    childName: 'Emma',
    name: 'Bell Peppers',
    category: 'sometimes',
    notes: 'Will eat red ones but not green. Prefers them raw with hummus.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 15,
    synced: true
  },
  {
    id: '5',
    childName: 'Emma',
    name: 'Mushrooms',
    category: 'notYet',
    notes: 'Refuses to try. Strong aversion to the texture.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 10,
    synced: false
  },
  {
    id: '6',
    childName: 'Noah',
    name: 'Pasta',
    category: 'safe',
    notes: 'Favorite food. Would eat it every day if allowed.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 90,
    synced: true
  },
  {
    id: '7',
    childName: 'Noah',
    name: 'Carrots',
    category: 'sometimes',
    notes: 'Will eat when cooked soft. Refuses raw carrots.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 45,
    synced: true
  },
  {
    id: '8',
    childName: 'Noah',
    name: 'Spinach',
    category: 'new',
    notes: 'Just introduced. Mixed into smoothies so far.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
    synced: false
  },
  {
    id: '9',
    childName: 'Olivia',
    name: 'Salmon',
    category: 'new',
    notes: 'Tried for the first time this week. Liked it!',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5,
    synced: true
  },
  {
    id: '10',
    childName: 'Olivia',
    name: 'Bananas',
    category: 'safe',
    notes: 'Eats one almost every day. Good for on-the-go snacks.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 120,
    synced: true
  },
  {
    id: '11',
    childName: 'Olivia',
    name: 'Eggs',
    category: 'sometimes',
    notes: 'Will eat scrambled but not other preparations.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30,
    synced: true
  },
  {
    id: '12',
    childName: 'Liam',
    name: 'Cucumber',
    category: 'new',
    notes: 'Just tried slices with ranch dip. Seemed interested.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7,
    synced: true
  },
  {
    id: '13',
    childName: 'Liam',
    name: 'Chicken',
    category: 'safe',
    notes: 'Prefers it grilled or baked. Good protein source.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 60,
    synced: true
  },
  {
    id: '14',
    childName: 'Liam',
    name: 'Peanut Butter',
    category: 'notYet',
    notes: 'Waiting to introduce due to family history of allergies.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30,
    synced: true
  }
];

// Mock reports (These are less used now aiService generates content, but keep for reference/fallback)
export const mockReports: Report[] = [
  {
    id: '1',
    childName: 'Emma',
    type: 'summary',
    content: `# Monthly Summary for Emma...`, // Content shortened for brevity
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1,
    generatedFrom: ['1', '2']
  },
  {
    id: '2',
    childName: 'Noah',
    type: 'pattern',
    content: `# Behavioral Pattern Analysis for Noah...`, // Content shortened
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
    generatedFrom: ['3']
  },
  {
    id: '3',
    childName: 'Olivia',
    type: 'recommendations',
    content: `# Personalized Recommendations for Olivia...`, // Content shortened
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 4,
    generatedFrom: ['4']
  },
  {
    id: '4',
    childName: 'Liam',
    type: 'trend',
    content: `# Development Trends Analysis for Liam...`, // Content shortened
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 6,
    generatedFrom: ['5']
  }
];


// --- NEW: Define and Export Mock Report Content ---

// Mock Smart Summary Data (Structured)
export const mockSummaryData: SmartSummaryData = {
  overview: "This child is showing positive development overall, with notable progress in communication.",
  keyPoints: [
    "Increased vocabulary usage.",
    "Improved social interaction during playdates.",
    "Consistent sleep schedule observed."
  ],
  concerns: [
    "Occasional difficulty with transitions.",
    "Picky eating habits persist for certain textures."
  ],
  progress: [
    "Better emotional regulation compared to last month.",
    "Showing interest in new learning activities."
  ],
  recommendations: [
    "Continue using visual timers for transitions.",
    "Introduce new foods alongside preferred safe foods.",
    "Encourage participation in group activities."
  ]
};

// Mock Pattern Analysis Content (String/Markdown)
export const mockPatternData: string = `
- **Sleep & Behavior:** Improved behavior noted on days following uninterrupted sleep (8+ hours). Shorter sleep durations correlate with increased irritability.
- **Food & Mood:** Introduction of sugary snacks often precedes periods of hyperactivity. Balanced meals seem to support more stable energy levels.
- **Social Interaction:** Child engages more readily in familiar environments compared to new settings. One-on-one play is preferred over large groups.
- **Sensory Input:** Seeks calming deep pressure activities (hugs, weighted blanket) after periods of high stimulation.
`;

// Mock Trend Report Content (String/Markdown)
export const mockTrendData: string = `
- **Language:** Consistent upward trend in expressive language use over the past quarter. Sentence complexity is increasing.
- **Fine Motor Skills:** Steady improvement in pincer grasp and ability to manipulate small objects.
- **Gross Motor Skills:** Significant gains in balance and coordination observed over the last two months.
- **Food Acceptance:** Slight decline in willingness to try new vegetables compared to the previous month. Acceptance of fruits remains stable.
- **Sleep Duration:** Average nightly sleep duration has remained consistent around 9 hours.
`;

// Mock Recommendations Content (String/Markdown)
export const mockRecommendationsData: string = `
1.  **Communication:** Introduce picture exchange systems (PECS) for non-verbal requests. Model longer sentences during conversation.
2.  **Behavioral Support:** Pre-teach coping strategies for managing frustration during challenging tasks. Use positive reinforcement for desired behaviors.
3.  **Sensory Needs:** Schedule regular sensory breaks throughout the day. Offer a variety of tactile experiences (playdough, sand, water).
4.  **Nutrition:** Continue offering small portions of new foods without pressure. Involve the child in simple meal preparation tasks.
5.  **Sleep Routine:** Maintain a consistent bedtime routine. Ensure the sleep environment is dark, quiet, and cool.
`;


// Function to load mock data into IndexedDB
export const loadMockData = async () => {
  const dbService = (await import('./services/db')).default;
  await dbService.initialize();

  // Check if data already exists
  const existingEntries = await dbService.getAllJournalEntries();

  if (existingEntries.length === 0) {
    console.log('Loading mock data...');

    // Load journal entries
    for (const entry of mockJournalEntries) {
      try {
        // Encrypt sensitive data
        const encryptionService = (await import('./services/encryption')).default;
        await encryptionService.initialize();

        const encryptedEntry = {
          ...entry,
          // Ensure sleepNotes is included, even if empty initially
          sleepNotes: entry.sleepNotes || '',
          // Encrypt medication notes
          medicationNotes: await encryptionService.encrypt(entry.medicationNotes)
        };

        await dbService.saveJournalEntry(encryptedEntry);
      } catch (error) {
        console.error('Error saving mock journal entry:', error);
      }
    }

    // Load food items
    for (const item of mockFoodItems) {
      try {
        await dbService.saveFoodItem(item);
      } catch (error) {
        console.error('Error saving mock food item:', error);
      }
    }

    // Load reports (These are less critical now aiService generates content)
    for (const report of mockReports) {
      try {
        await dbService.saveReport(report);
      } catch (error) {
        console.error('Error saving mock report:', error);
      }
    }

    console.log('Mock data loaded successfully!');
  } else {
    console.log('Database already contains data. Skipping mock data load.');
  }
};
