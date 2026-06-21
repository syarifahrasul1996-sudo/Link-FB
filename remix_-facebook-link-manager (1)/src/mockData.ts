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
  groupPostLink: string;
  specificPostLink: string;
}

export const MOCK_DATA_BY_TAB: Record<string, MockRow[]> = {
  'acc-1': [
    // Specific Post Links (Column D present)
    {
      label: 'Kuala Lumpur Community Updates',
      groupLink: 'https://www.facebook.com/groups/klcommunity',
      groupPostLink: 'https://www.facebook.com/groups/klcommunity/posts/101235624',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-kl-1'
    },
    {
      label: 'Selangor Job Seekers & Freelancers',
      groupLink: 'https://www.facebook.com/groups/selangorjobs',
      groupPostLink: 'https://www.facebook.com/groups/selangorjobs/posts/405102391',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-selangor-job'
    },
    {
      label: 'Malaysia Startups Incubator',
      groupLink: 'https://www.facebook.com/groups/malaysiastartups',
      groupPostLink: 'https://www.facebook.com/groups/malaysiastartups/posts/882142274',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-startup-incubator'
    },
    {
      label: 'Ahmad Tech Discussion Hub',
      groupLink: 'https://www.facebook.com/groups/ahmadtech',
      groupPostLink: 'https://www.facebook.com/groups/ahmadtech/posts/33100527',
      specificPostLink: 'https://www.facebook.com/zahir.ahmad/posts/specific-tech-post'
    },
    // My Post Links (Column C present, Column D blank)
    {
      label: 'Digital Nomads Malaysia',
      groupLink: 'https://www.facebook.com/groups/digitalnomadsmy',
      groupPostLink: 'https://www.facebook.com/groups/digitalnomadsmy/posts/201488102',
      specificPostLink: ''
    },
    {
      label: 'E-Commerce Sellers Malaysia',
      groupLink: 'https://www.facebook.com/groups/ecsellersmy',
      groupPostLink: 'https://www.facebook.com/groups/ecsellersmy/posts/776102148',
      specificPostLink: ''
    },
    {
      label: 'Business Networking PJ',
      groupLink: 'https://www.facebook.com/groups/biznetworkpj',
      groupPostLink: 'https://www.facebook.com/groups/biznetworkpj/posts/551029410',
      specificPostLink: ''
    },
    // Group Links Only (Column C & D blank)
    {
      label: 'Subang Jaya Resident Forum',
      groupLink: 'https://www.facebook.com/groups/subangresidents',
      groupPostLink: '',
      specificPostLink: ''
    },
    {
      label: 'Penang Foodies Club',
      groupLink: 'https://www.facebook.com/groups/penangfood',
      groupPostLink: '',
      specificPostLink: ''
    },
    {
      label: 'Malaysia Developers Gathering',
      groupLink: 'https://www.facebook.com/groups/mydevgathering',
      groupPostLink: '',
      specificPostLink: ''
    }
  ],
  'acc-2': [
    // Specific Post Links
    {
      label: 'Kuala Lumpur Food Delivery',
      groupLink: 'https://www.facebook.com/groups/klfooddelivery',
      groupPostLink: 'https://www.facebook.com/groups/klfooddelivery/posts/301299401',
      specificPostLink: 'https://www.facebook.com/nurul.huda/posts/specific-klfood-1'
    },
    {
      label: 'Malaysian Baking Sweet Club',
      groupLink: 'https://www.facebook.com/groups/mybakingclub',
      groupPostLink: 'https://www.facebook.com/groups/mybakingclub/posts/559400213',
      specificPostLink: 'https://www.facebook.com/nurul.huda/posts/specific-baking-recipe'
    },
    // My Post Links
    {
      label: 'Halal Food Recommendations KL',
      groupLink: 'https://www.facebook.com/groups/halalfoodkl',
      groupPostLink: 'https://www.facebook.com/groups/halalfoodkl/posts/1199342',
      specificPostLink: ''
    },
    {
      label: 'Home Cooks Malaysia Circle',
      groupLink: 'https://www.facebook.com/groups/homecookmy',
      groupPostLink: 'https://www.facebook.com/groups/homecookmy/posts/882193',
      specificPostLink: ''
    },
    // Group Links Only
    {
      label: 'Ampang Resident Updates',
      groupLink: 'https://www.facebook.com/groups/ampangresidents',
      groupPostLink: '',
      specificPostLink: ''
    },
    {
      label: 'Petaling Jaya Garage Sale',
      groupLink: 'https://www.facebook.com/groups/pjgaragesale',
      groupPostLink: '',
      specificPostLink: ''
    }
  ],
  'acc-3': [
    // Specific Post Links
    {
      label: 'Malaysia Tech Marketplace',
      groupLink: 'https://www.facebook.com/groups/mytechmarket',
      groupPostLink: 'https://www.facebook.com/groups/mytechmarket/posts/8841029',
      specificPostLink: 'https://www.facebook.com/alif.danial/posts/specific-tech-sale'
    },
    // My Post Links
    {
      label: 'PC Builders Malaysia Guild',
      groupLink: 'https://www.facebook.com/groups/pcbuildersmy',
      groupPostLink: 'https://www.facebook.com/groups/pcbuildersmy/posts/776102aa',
      specificPostLink: ''
    },
    {
      label: 'Gamers Gathering Kuala Lumpur',
      groupLink: 'https://www.facebook.com/groups/gamerskl',
      groupPostLink: 'https://www.facebook.com/groups/gamerskl/posts/122485',
      specificPostLink: ''
    },
    // Group Links Only
    {
      label: 'Cheras Community Hub',
      groupLink: 'https://www.facebook.com/groups/cherascommunity',
      groupPostLink: '',
      specificPostLink: ''
    },
    {
      label: 'Malaysia IT Deals and Gadgets',
      groupLink: 'https://www.facebook.com/groups/myitdeals',
      groupPostLink: '',
      specificPostLink: ''
    }
  ]
};
