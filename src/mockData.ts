// mockData.ts
import { TabConfig } from './types';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/15o25XLsJPIKcUZw4tEnP_MKma82eeCF6vmhxvUfjunM/edit';

export const DEFAULT_TABS: TabConfig[] = [
  { id: 'acc-1', name: 'Resume Account (Account 1)', gid: '1781170742' },
  { id: 'acc-2', name: 'Resume Page (Account 2)', gid: '963812390' },
  { id: 'acc-3', name: 'Sharifah (Account 3)', gid: '1760068546' },
];

export interface MockRow {
  label: string;
  groupLink: string;
  specificPostLink: string;
}

export const MOCK_DATA_BY_TAB: Record<string, MockRow[]> = {
  'acc-1': [
    // Direct Tasks (Column C present)
    {
      label: 'Kuala Lumpur Community Updates',
      groupLink: 'https://www.facebook.com/groups/klcommunity',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-kl-1'
    },
    {
      label: 'Selangor Job Seekers & Freelancers',
      groupLink: 'https://www.facebook.com/groups/selangorjobs',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-selangor-job'
    },
    {
      label: 'Malaysia Startups Incubator',
      groupLink: 'https://www.facebook.com/groups/malaysiastartups',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-startup-incubator'
    },
    {
      label: 'Ahmad Tech Discussion Hub',
      groupLink: 'https://www.facebook.com/groups/ahmadtech',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-tech-post'
    },
    // Group Links Only (Column C blank)
    {
      label: 'Digital Nomads Malaysia',
      groupLink: 'https://www.facebook.com/groups/digitalnomadsmy',
      specificPostLink: ''
    },
    {
      label: 'E-Commerce Sellers Malaysia',
      groupLink: 'https://www.facebook.com/groups/ecsellersmy',
      specificPostLink: ''
    },
    {
      label: 'Business Networking PJ',
      groupLink: 'https://www.facebook.com/groups/biznetworkpj',
      specificPostLink: ''
    },
    {
      label: 'Subang Jaya Resident Forum',
      groupLink: 'https://www.facebook.com/groups/subangresidents',
      specificPostLink: ''
    },
    {
      label: 'Penang Foodies Club',
      groupLink: 'https://www.facebook.com/groups/penangfood',
      specificPostLink: ''
    },
    {
      label: 'Malaysia Developers Gathering',
      groupLink: 'https://www.facebook.com/groups/mydevgathering',
      specificPostLink: ''
    }
  ],
  'acc-2': [
    // Direct Tasks
    {
      label: 'Kuala Lumpur Food Delivery',
      groupLink: 'https://www.facebook.com/groups/klfooddelivery',
      specificPostLink: 'https://www.facebook.com/nurul.huda/posts/specific-klfood-1'
    },
    {
      label: 'Malaysian Baking Sweet Club',
      groupLink: 'https://www.facebook.com/groups/mybakingclub',
      specificPostLink: 'https://www.facebook.com/nurul.huda/posts/specific-baking-recipe'
    },
    // Group Links Only
    {
      label: 'Halal Food Recommendations KL',
      groupLink: 'https://www.facebook.com/groups/halalfoodkl',
      specificPostLink: ''
    },
    {
      label: 'Home Cooks Malaysia Circle',
      groupLink: 'https://www.facebook.com/groups/homecookmy',
      specificPostLink: ''
    },
    {
      label: 'Ampang Resident Updates',
      groupLink: 'https://www.facebook.com/groups/ampangresidents',
      specificPostLink: ''
    },
    {
      label: 'Petaling Jaya Garage Sale',
      groupLink: 'https://www.facebook.com/groups/pjgaragesale',
      specificPostLink: ''
    }
  ],
  'acc-3': [
    // Direct Tasks
    {
      label: 'Malaysia Tech Marketplace',
      groupLink: 'https://www.facebook.com/groups/mytechmarket',
      specificPostLink: 'https://www.facebook.com/alif.danial/posts/specific-tech-sale'
    },
    // Group Links Only
    {
      label: 'PC Builders Malaysia Guild',
      groupLink: 'https://www.facebook.com/groups/pcbuildersmy',
      specificPostLink: ''
    },
    {
      label: 'Gamers Gathering Kuala Lumpur',
      groupLink: 'https://www.facebook.com/groups/gamerskl',
      specificPostLink: ''
    },
    {
      label: 'Cheras Community Hub',
      groupLink: 'https://www.facebook.com/groups/cherascommunity',
      specificPostLink: ''
    },
    {
      label: 'Malaysia IT Deals and Gadgets',
      groupLink: 'https://www.facebook.com/groups/myitdeals',
      specificPostLink: ''
    }
  ]
};
