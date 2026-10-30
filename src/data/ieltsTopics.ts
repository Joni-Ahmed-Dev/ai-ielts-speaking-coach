/**
 * Official-style IELTS Speaking Topics, Cue Cards, and Free Talk Prompts
 */

export interface Part1Topic {
  id: string;
  category: string;
  questions: string[];
}

export interface Part2CueCard {
  id: string;
  title: string;
  prompt: string;
  bulletPoints: string[];
  followUp: string;
  part3Questions: string[];
}

export interface FreeTalkTopic {
  id: string;
  title: string;
  starter: string;
  suggestedFollowUps: string[];
}

export const PART_1_TOPICS: Part1Topic[] = [
  {
    id: 'hometown',
    category: 'Hometown & Living',
    questions: [
      'Could you tell me a little bit about where you grew up?',
      'What do you like most about living in your current city?',
      'Has your hometown changed significantly over recent years?',
      'Would you prefer to live there in the future, or move somewhere else?',
    ],
  },
  {
    id: 'work_studies',
    category: 'Work or Studies',
    questions: [
      'Do you work or are you currently a student?',
      'What made you choose this particular field or subject?',
      'What is the most interesting part of your daily routine at work or university?',
      'If you could change one thing about your job or study environment, what would it be?',
    ],
  },
  {
    id: 'technology',
    category: 'Technology & Daily Routine',
    questions: [
      'How much time do you spend using digital devices on a typical day?',
      'Do you prefer communicating with friends through text messages or voice calls?',
      'Has modern technology made human life more convenient or more stressful?',
    ],
  },
  {
    id: 'leisure',
    category: 'Leisure & Hobbies',
    questions: [
      'What kinds of activities do you enjoy doing during your free time?',
      'Do you prefer spending your weekends outdoors or relaxing at home?',
      'Did you have different hobbies when you were a child compared to now?',
    ],
  },
];

export const PART_2_CUE_CARDS: Part2CueCard[] = [
  {
    id: 'cue-person-influence',
    title: 'A Person Who Has Influenced You',
    prompt: 'Describe a person who has had a significant positive influence on your life.',
    bulletPoints: [
      'Who this person is and how you know them',
      'What qualities or actions make them special to you',
      'How they helped or inspired you in a specific situation',
      'And explain why their influence has had a lasting impact on your life',
    ],
    followUp: 'Do you still keep in regular touch with this person?',
    part3Questions: [
      'In what ways do parents influence their children compared to teachers or peers?',
      'Do you think modern celebrities have a responsibility to act as positive role models?',
      'Why do some people find it difficult to accept advice from older generations?',
      'How have social media influencers altered the way young people view success?',
    ],
  },
  {
    id: 'cue-memorable-journey',
    title: 'A Memorable Journey or Trip',
    prompt: 'Describe a memorable journey you have taken that left a deep impression on you.',
    bulletPoints: [
      'Where you went and whom you went with',
      'What mode of transportation you used',
      'What unexpected or exciting events happened during the trip',
      'And explain why this particular journey remains so memorable to you',
    ],
    followUp: 'Would you recommend this travel destination to a friend?',
    part3Questions: [
      'How has international travel changed over the past few decades?',
      'Some people argue that excessive tourism harms local culture and the environment. Do you agree?',
      'What are the advantages of travelling independently compared to joining an organized group tour?',
      'Do you think virtual reality travel will ever replace the desire for physical journeys?',
    ],
  },
  {
    id: 'cue-challenging-goal',
    title: 'A Difficult Goal You Achieved',
    prompt: 'Describe a goal or challenge that was difficult for you to achieve.',
    bulletPoints: [
      'What the goal was and when you set it',
      'What obstacles or doubts you encountered along the way',
      'What specific steps you took to overcome these difficulties',
      'And explain how you felt when you finally succeeded',
    ],
    followUp: 'Did achieving this goal change your future plans?',
    part3Questions: [
      'Why is goal setting essential for personal and professional development?',
      'Do people in modern society place too much emphasis on competitive achievements?',
      'How can educational systems better prepare students to cope with failure and setbacks?',
      'Are intrinsic rewards more powerful motivators than financial compensation?',
    ],
  },
];

export const FREE_TALK_TOPICS: FreeTalkTopic[] = [
  {
    id: 'culture_food',
    title: 'Food, Culture & Comfort',
    starter: "Hey! What's your absolute comfort food, and is there a memory or story tied to it?",
    suggestedFollowUps: [
      'What food from your country do you think everyone in the world should try once?',
      'Have you ever tried cooking something that turned out completely unexpected?',
    ],
  },
  {
    id: 'travel_dreams',
    title: 'Dream Destinations & Adventures',
    starter: "If you could catch a flight to anywhere tomorrow morning with all expenses paid, where would you go first?",
    suggestedFollowUps: [
      'Are you more of an adventurous explorer or do you prefer quiet scenic retreats?',
      'What is the most surprising cultural difference you have encountered while travelling?',
    ],
  },
  {
    id: 'future_tech',
    title: 'AI, Future & Life 10 Years from Now',
    starter: "Technology is evolving so rapidly right now. How do you imagine our day-to-day life looking ten years from now?",
    suggestedFollowUps: [
      'Do you feel optimistic about AI and automation, or are there aspects that concern you?',
      'Which daily chore do you wish a smart robot would take over completely right now?',
    ],
  },
];
