export const mockCustomers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    avatar: null,
    lastMessage: 'Looking for SUV under $40k',
    timestamp: '2 hours ago',
    unread: true,
    status: 'online',
    profile: {
      budget_max: 40000,
      product_type: 'SUV',
      key_features: ['safety', 'family-friendly'],
      urgency: 'high',
      sentiment: 'positive',
      intent: 'purchase'
    },
    conversations: [
      { id: 'm1', sender: 'customer', text: 'Hi, I\'m looking for a family SUV under $40k.', time: '10:30 AM' },
      { id: 'm2', sender: 'agent', text: 'Great! We have several options. Do you have any specific features in mind?', time: '10:32 AM' },
      { id: 'm3', sender: 'customer', text: 'Safety is my top priority. Also looking for good fuel economy.', time: '10:35 AM' },
    ]
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john@email.com',
    avatar: null,
    lastMessage: 'What financing options available?',
    timestamp: '1 day ago',
    unread: false,
    status: 'offline',
    profile: {
      budget_max: 50000,
      product_type: 'Sedan',
      key_features: ['luxury', 'performance'],
      urgency: 'medium',
      sentiment: 'neutral',
      intent: 'research'
    },
    conversations: [
      { id: 'm1', sender: 'customer', text: 'I\'m interested in a luxury sedan. What do you have?', time: 'Yesterday' },
      { id: 'm2', sender: 'agent', text: 'We have Mercedes, BMW, and Audi options. Budget?', time: 'Yesterday' },
    ]
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.d@company.com',
    avatar: null,
    lastMessage: 'Need a quote for the fleet',
    timestamp: '3 hours ago',
    unread: true,
    status: 'online',
    profile: {
      budget_max: 200000,
      product_type: 'Fleet',
      key_features: ['bulk discount', 'maintenance package'],
      urgency: 'high',
      sentiment: 'positive',
      intent: 'purchase'
    },
    conversations: [
      { id: 'm1', sender: 'customer', text: 'Our company needs 10 vehicles for our sales team.', time: '9:00 AM' },
    ]
  },
  {
    id: '4',
    name: 'Michael Brown',
    email: 'mbrown@gmail.com',
    avatar: null,
    lastMessage: 'Can I schedule a test drive?',
    timestamp: '5 hours ago',
    unread: false,
    status: 'away',
    profile: {
      budget_max: 35000,
      product_type: 'Truck',
      key_features: ['towing capacity', 'off-road'],
      urgency: 'low',
      sentiment: 'neutral',
      intent: 'research'
    },
    conversations: []
  },
  {
    id: '5',
    name: 'Jessica Wilson',
    email: 'jwilson@outlook.com',
    avatar: null,
    lastMessage: 'Looking for electric options',
    timestamp: '30 mins ago',
    unread: true,
    status: 'online',
    profile: {
      budget_max: 60000,
      product_type: 'Electric',
      key_features: ['range', 'fast charging', 'autopilot'],
      urgency: 'high',
      sentiment: 'positive',
      intent: 'purchase'
    },
    conversations: [
      { id: 'm1', sender: 'customer', text: 'What electric cars do you have with 300+ mile range?', time: '11:00 AM' },
      { id: 'm2', sender: 'agent', text: 'Tesla Model 3 and Ford Mustang Mach-E both meet that criteria!', time: '11:02 AM' },
      { id: 'm3', sender: 'customer', text: 'Great, what\'s the price difference?', time: '11:05 AM' },
    ]
  },
  {
    id: '6',
    name: 'David Lee',
    email: 'dlee@techcorp.io',
    avatar: null,
    lastMessage: 'Interested in hybrid models',
    timestamp: '2 days ago',
    unread: false,
    status: 'offline',
    profile: {
      budget_max: 45000,
      product_type: 'Hybrid',
      key_features: ['fuel economy', 'reliability'],
      urgency: 'low',
      sentiment: 'neutral',
      intent: 'browsing'
    },
    conversations: []
  },
];

export const mockSuggestions = [
  {
    id: 's1',
    type: 'recommendation',
    icon: '💡',
    title: 'Recommend Toyota RAV4 Hybrid',
    description: 'Based on their budget ($40k) and priority for safety & fuel economy, this is a top match.',
  },
  {
    id: 's2',
    type: 'talking_point',
    icon: '🗣️',
    title: 'Mention 0% APR Financing',
    description: 'Current promotion ends this month. This could help close the deal faster.',
  },
  {
    id: 's3',
    type: 'action',
    icon: '⚡',
    title: 'Schedule Test Drive',
    description: 'Customer seems ready. Suggest a test drive for this weekend.',
  },
];
