import { Profile, Role, Tier, Stamp, StampRarity, Drop, DropStatus, Ticket, TicketStatus, TicketPriority } from './types';

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'usr_1',
    email: 'alice@wonderland.com',
    full_name: 'Alice Liddell',
    role: Role.USER,
    tier: Tier.PRO,
    egg_balance: { mystery: 1, premium: 5, standard: 12 },
    created_at: '2023-01-15T08:00:00Z',
    last_seen: '2023-10-27T14:30:00Z',
    avatar_url: 'https://picsum.photos/seed/alice/200',
  },
  {
    id: 'usr_2',
    email: 'mad@hatter.tea',
    full_name: 'Tarrant Hightopp',
    role: Role.USER,
    tier: Tier.FREE,
    egg_balance: { mystery: 0, premium: 0, standard: 2 },
    created_at: '2023-02-20T10:15:00Z',
    last_seen: '2023-10-26T09:00:00Z',
    avatar_url: 'https://picsum.photos/seed/hatter/200',
  },
  {
    id: 'usr_3',
    email: 'queen@hearts.gov',
    full_name: 'Iracebeth of Crims',
    role: Role.ADMIN,
    tier: Tier.PRO,
    egg_balance: { mystery: 100, premium: 100, standard: 100 },
    created_at: '2022-12-01T00:00:00Z',
    last_seen: '2023-10-27T16:45:00Z',
    avatar_url: 'https://picsum.photos/seed/queen/200',
  },
  {
    id: 'usr_4',
    email: 'cheshire@cat.smile',
    full_name: 'Chessur',
    role: Role.SUPPORT,
    tier: Tier.PREMIUM,
    egg_balance: { mystery: 2, premium: 2, standard: 5 },
    created_at: '2023-03-10T12:00:00Z',
    last_seen: '2023-10-27T11:20:00Z',
    avatar_url: 'https://picsum.photos/seed/cat/200',
  }
];

export const MOCK_STAMPS: Stamp[] = [
  {
    id: 'stp_1',
    name: 'Retro Pigeon',
    slug: 'retro-pigeon',
    rarity: StampRarity.COMMON,
    collection: 'City Birds',
    is_drop_only: false,
    price_eggs: 50,
    art_path: 'https://picsum.photos/seed/pigeon/300/300',
  },
  {
    id: 'stp_2',
    name: 'Neon Hawk',
    slug: 'neon-hawk',
    rarity: StampRarity.LEGENDARY,
    collection: 'Synthwave Sky',
    is_drop_only: true,
    art_path: 'https://picsum.photos/seed/hawk/300/300',
  },
  {
    id: 'stp_3',
    name: 'Golden Egg',
    slug: 'golden-egg',
    rarity: StampRarity.PIDGEY,
    collection: 'Origins',
    is_drop_only: true,
    art_path: 'https://picsum.photos/seed/gold/300/300',
  },
];

export const MOCK_DROPS: Drop[] = [
  {
    id: 'drp_1',
    title: 'Cyber Avian Collection',
    description: 'Robotic birds from the year 3000.',
    artist_id: 'art_1',
    egg_price: 150,
    max_supply: 5000,
    status: DropStatus.LIVE,
    start_at: '2023-10-25T00:00:00Z',
    end_at: '2023-11-01T00:00:00Z',
    banner_path: 'https://picsum.photos/seed/cyber/800/200',
  },
  {
    id: 'drp_2',
    title: 'Watercolor Whimsy',
    description: 'Soft pastels for gentle souls.',
    artist_id: 'art_2',
    egg_price: 100,
    status: DropStatus.DRAFT,
    start_at: '2023-11-15T00:00:00Z',
    end_at: '2023-11-22T00:00:00Z',
    banner_path: 'https://picsum.photos/seed/water/800/200',
  },
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'tkt_1',
    profile_id: 'usr_1',
    subject: 'My mystery egg didn\'t hatch!',
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    source: 'form',
    tags: ['bug', 'economy'],
    created_at: '2023-10-27T09:30:00Z',
    messages: [
      {
        id: 'msg_1',
        ticket_id: 'tkt_1',
        sender_type: 'member',
        body: 'I clicked hatch and it spun forever. Now the egg is gone but no stamp.',
        created_at: '2023-10-27T09:30:00Z',
      }
    ]
  },
  {
    id: 'tkt_2',
    profile_id: 'usr_2',
    subject: 'How do I upgrade to Pro?',
    status: TicketStatus.NEW,
    priority: TicketPriority.NORMAL,
    source: 'email',
    tags: ['sales', 'question'],
    created_at: '2023-10-27T14:15:00Z',
    messages: [
      {
        id: 'msg_2',
        ticket_id: 'tkt_2',
        sender_type: 'member',
        body: 'I want the monthly egg bonus but can\'t find the button.',
        created_at: '2023-10-27T14:15:00Z',
      }
    ]
  }
];
