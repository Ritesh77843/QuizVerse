export interface TemplateQuestion {
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'TRUE_FALSE';
  timeLimitSeconds: number;
  points: number;
  options: { text: string; isCorrect: boolean }[];
}

export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  questions: TemplateQuestion[];
}

export const QUIZ_TEMPLATES: QuizTemplate[] = [
  {
    id: 'general-trivia',
    name: 'General Trivia',
    description: '10 classic trivia questions across mixed topics',
    emoji: '🧠',
    color: 'from-violet-600 to-purple-700',
    questions: [
      { questionText: 'What is the capital of France?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'London', isCorrect: false }, { text: 'Paris', isCorrect: true }, { text: 'Berlin', isCorrect: false }, { text: 'Madrid', isCorrect: false }] },
      { questionText: 'How many planets are in our solar system?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 20, points: 1000, options: [{ text: '7', isCorrect: false }, { text: '8', isCorrect: true }, { text: '9', isCorrect: false }, { text: '10', isCorrect: false }] },
      { questionText: 'Water boils at 100°C at sea level.', questionType: 'TRUE_FALSE', timeLimitSeconds: 15, points: 500, options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] },
      { questionText: 'Which element has the chemical symbol "Au"?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 25, points: 1000, options: [{ text: 'Silver', isCorrect: false }, { text: 'Copper', isCorrect: false }, { text: 'Gold', isCorrect: true }, { text: 'Platinum', isCorrect: false }] },
      { questionText: 'Who painted the Mona Lisa?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'Michelangelo', isCorrect: false }, { text: 'Raphael', isCorrect: false }, { text: 'Leonardo da Vinci', isCorrect: true }, { text: 'Donatello', isCorrect: false }] },
      { questionText: 'The Great Wall of China is visible from space.', questionType: 'TRUE_FALSE', timeLimitSeconds: 15, points: 500, options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }] },
      { questionText: 'What is the largest ocean on Earth?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'Atlantic', isCorrect: false }, { text: 'Indian', isCorrect: false }, { text: 'Arctic', isCorrect: false }, { text: 'Pacific', isCorrect: true }] },
      { questionText: 'How many sides does a hexagon have?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 15, points: 1000, options: [{ text: '5', isCorrect: false }, { text: '6', isCorrect: true }, { text: '7', isCorrect: false }, { text: '8', isCorrect: false }] },
      { questionText: 'Which country invented pizza?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'USA', isCorrect: false }, { text: 'France', isCorrect: false }, { text: 'Italy', isCorrect: true }, { text: 'Greece', isCorrect: false }] },
      { questionText: 'Sound travels faster than light.', questionType: 'TRUE_FALSE', timeLimitSeconds: 15, points: 500, options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }] },
    ],
  },
  {
    id: 'icebreaker',
    name: 'Icebreaker',
    description: 'Fun, low-stakes questions to warm up any group',
    emoji: '🧊',
    color: 'from-cyan-500 to-blue-600',
    questions: [
      { questionText: 'Which would you rather have: the ability to fly or be invisible?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 30, points: 500, options: [{ text: 'Fly', isCorrect: true }, { text: 'Invisible', isCorrect: false }, { text: 'Neither', isCorrect: false }, { text: 'Both!', isCorrect: false }] },
      { questionText: 'What is the most popular pizza topping worldwide?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'Mushrooms', isCorrect: false }, { text: 'Extra Cheese', isCorrect: false }, { text: 'Pepperoni', isCorrect: true }, { text: 'Olives', isCorrect: false }] },
      { questionText: 'A "group selfie" is called a "welfie".', questionType: 'TRUE_FALSE', timeLimitSeconds: 20, points: 500, options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }] },
      { questionText: 'Which season do most people prefer?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 30, points: 500, options: [{ text: 'Spring', isCorrect: false }, { text: 'Summer', isCorrect: true }, { text: 'Autumn', isCorrect: false }, { text: 'Winter', isCorrect: false }] },
      { questionText: 'Cats have more bones than humans.', questionType: 'TRUE_FALSE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] },
    ],
  },
  {
    id: 'tech-quiz',
    name: 'Tech & Science',
    description: 'Test knowledge of technology, coding & science',
    emoji: '💻',
    color: 'from-emerald-500 to-teal-600',
    questions: [
      { questionText: 'What does "HTTP" stand for?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 25, points: 1000, options: [{ text: 'HyperText Transfer Protocol', isCorrect: true }, { text: 'High Tech Transfer Process', isCorrect: false }, { text: 'HyperText Transport Process', isCorrect: false }, { text: 'Hyperlink Text Transfer Protocol', isCorrect: false }] },
      { questionText: 'Python is a compiled language.', questionType: 'TRUE_FALSE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'True', isCorrect: false }, { text: 'False', isCorrect: true }] },
      { questionText: 'Which company created the JavaScript language?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 25, points: 1000, options: [{ text: 'Google', isCorrect: false }, { text: 'Microsoft', isCorrect: false }, { text: 'Netscape', isCorrect: true }, { text: 'Apple', isCorrect: false }] },
      { questionText: 'What is the time complexity of binary search?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 30, points: 2000, options: [{ text: 'O(n)', isCorrect: false }, { text: 'O(log n)', isCorrect: true }, { text: 'O(n²)', isCorrect: false }, { text: 'O(1)', isCorrect: false }] },
      { questionText: 'DNS stands for Domain Name System.', questionType: 'TRUE_FALSE', timeLimitSeconds: 15, points: 500, options: [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }] },
      { questionText: 'Which programming language runs natively in browsers?', questionType: 'SINGLE_CHOICE', timeLimitSeconds: 20, points: 1000, options: [{ text: 'Python', isCorrect: false }, { text: 'Java', isCorrect: false }, { text: 'JavaScript', isCorrect: true }, { text: 'C++', isCorrect: false }] },
    ],
  },
  {
    id: 'blank',
    name: 'Blank Quiz',
    description: 'Start from scratch with an empty quiz',
    emoji: '✏️',
    color: 'from-zinc-600 to-zinc-700',
    questions: [],
  },
];
