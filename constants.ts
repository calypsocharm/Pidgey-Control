
import { Profile, Role, Tier, Stamp, StampRarity, StampStatus, Drop, DropStatus, Ticket, TicketStatus, TicketPriority, Card, UserTemplate, Broadcast, BroadcastStatus, BroadcastChannel, Promo, PromoType, PromoStatus, Asset, AssetType, DeliveryJourney, DeliveryStatus, MessageEvent } from './types';

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
    status: 'active'
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
    status: 'suspended'
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
    status: 'active'
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
    status: 'active'
  }
];

export const MOCK_STAMPS: Stamp[] = [
  {
    id: 'stp_1',
    name: 'Retro Pigeon',
    slug: 'retro-pigeon',
    rarity: StampRarity.COMMON,
    status: StampStatus.ACTIVE,
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
    status: StampStatus.ACTIVE,
    collection: 'Synthwave Sky',
    is_drop_only: true,
    art_path: 'https://picsum.photos/seed/hawk/300/300',
  },
  {
    id: 'stp_3',
    name: 'Golden Egg',
    slug: 'golden-egg',
    rarity: StampRarity.PIDGEY,
    status: StampStatus.ACTIVE,
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

export const MOCK_CARDS: Card[] = [
    {
        id: 'crd_1',
        owner_id: 'usr_1',
        data: { template: 'bday_v1', recipient: 'Mom', status: 'delivered' },
        created_at: '2023-10-20T10:00:00Z',
        updated_at: '2023-10-20T10:00:00Z',
    },
    {
        id: 'crd_2',
        owner_id: 'usr_2',
        data: { template: 'thankyou_v2', recipient: 'Boss', status: 'draft' },
        created_at: '2023-10-25T14:00:00Z',
        updated_at: '2023-10-25T14:30:00Z',
    }
];

export const MOCK_USER_TEMPLATES: UserTemplate[] = [
    {
        id: 'ut_1',
        owner_id: 'usr_1',
        template_id: 'tpl_basic',
        template_data: { color: 'blue', font: 'serif' },
        created_at: '2023-09-01T00:00:00Z',
        updated_at: '2023-09-01T00:00:00Z',
    }
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

export const MOCK_BROADCASTS: Broadcast[] = [
    {
        id: 'bc_1',
        name: 'Halloween Spooktacular',
        subject: 'Boo! Free eggs inside 🥚',
        channels: [BroadcastChannel.EMAIL, BroadcastChannel.PUSH],
        audience_segment: 'All Active Users',
        audience_size: 12500,
        scheduled_at: '2023-10-31T09:00:00Z',
        status: BroadcastStatus.SCHEDULED,
        stats: { delivered: 0, opened: 0, clicked: 0, failed: 0 },
        created_at: '2023-10-25T10:00:00Z'
    },
    {
        id: 'bc_2',
        name: 'Weekly Digest',
        subject: 'Your week in PidgeyPost',
        channels: [BroadcastChannel.EMAIL],
        audience_segment: 'Weekly Subscribers',
        audience_size: 8500,
        status: BroadcastStatus.SENT,
        stats: { delivered: 8450, opened: 4200, clicked: 1200, failed: 50 },
        created_at: '2023-10-20T09:00:00Z'
    }
];

export const MOCK_PROMOS: Promo[] = [
    {
        id: 'prm_1',
        name: 'Welcome Bonus',
        code: 'WELCOME2023',
        type: PromoType.EGG_BONUS,
        status: PromoStatus.ACTIVE,
        description: '5 Free Eggs for new signups',
        value: { eggs: 5 },
        usage_count: 1450,
        created_at: '2023-01-01T00:00:00Z'
    },
    {
        id: 'prm_2',
        name: 'Black Friday Sale',
        code: 'BF50OFF',
        type: PromoType.DISCOUNT,
        status: PromoStatus.DRAFT,
        description: '50% off Pro Plan',
        value: { percent: 50 },
        start_at: '2023-11-24T00:00:00Z',
        end_at: '2023-11-27T23:59:59Z',
        usage_count: 0,
        created_at: '2023-10-25T00:00:00Z'
    }
];

export const MOCK_ASSETS: Asset[] = [
    {
        id: 'ast_1',
        name: 'stamp_pigeon_base.png',
        url: 'https://picsum.photos/seed/pigeon/300/300',
        type: AssetType.STAMP_ART,
        size_kb: 450,
        tags: ['bird', 'common', 'city'],
        usage_count: 5,
        created_at: '2023-09-01T00:00:00Z'
    },
    {
        id: 'ast_2',
        name: 'bg_birthday_confetti.jpg',
        url: 'https://picsum.photos/seed/bday/800/600',
        type: AssetType.CARD_TEMPLATE,
        size_kb: 1200,
        tags: ['birthday', 'celebration', 'colorful'],
        usage_count: 120,
        created_at: '2023-09-05T00:00:00Z'
    },
    {
        id: 'ast_3',
        name: 'icon_egg_mystery.svg',
        url: 'https://picsum.photos/seed/egg/100/100',
        type: AssetType.ICON,
        size_kb: 15,
        tags: ['ui', 'economy', 'egg'],
        usage_count: 1,
        created_at: '2023-01-01T00:00:00Z'
    }
];

// Deliveries Mock Data
export const MOCK_DELIVERIES: DeliveryJourney[] = [
    {
        message_id: 'msg_123',
        recipient: 'alice@wonderland.com',
        channel: BroadcastChannel.EMAIL,
        current_status: DeliveryStatus.CARD_VIEWED,
        started_at: '2023-10-27T08:00:00Z',
        updated_at: '2023-10-27T08:05:00Z',
        events: [
            { id: 'ev_1', message_id: 'msg_123', recipient: 'alice@wonderland.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.QUEUED, timestamp: '2023-10-27T08:00:00Z' },
            { id: 'ev_2', message_id: 'msg_123', recipient: 'alice@wonderland.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.SENT, timestamp: '2023-10-27T08:00:05Z' },
            { id: 'ev_3', message_id: 'msg_123', recipient: 'alice@wonderland.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.DELIVERED, timestamp: '2023-10-27T08:00:10Z' },
            { id: 'ev_4', message_id: 'msg_123', recipient: 'alice@wonderland.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.CLICKED, timestamp: '2023-10-27T08:04:00Z' },
            { id: 'ev_5', message_id: 'msg_123', recipient: 'alice@wonderland.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.CARD_VIEWED, timestamp: '2023-10-27T08:05:00Z' },
        ]
    },
    {
        message_id: 'msg_124',
        recipient: 'bob@builder.com',
        channel: BroadcastChannel.EMAIL,
        current_status: DeliveryStatus.BOUNCED,
        started_at: '2023-10-27T09:00:00Z',
        updated_at: '2023-10-27T09:00:05Z',
        events: [
            { id: 'ev_6', message_id: 'msg_124', recipient: 'bob@builder.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.QUEUED, timestamp: '2023-10-27T09:00:00Z' },
            { id: 'ev_7', message_id: 'msg_124', recipient: 'bob@builder.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.BOUNCED, timestamp: '2023-10-27T09:00:05Z', meta: { error: '550 Recipient not found' } },
        ]
    },
    {
        message_id: 'msg_125',
        recipient: 'charlie@chocolate.factory',
        channel: BroadcastChannel.SMS,
        current_status: DeliveryStatus.CARD_NOT_FOUND,
        started_at: '2023-10-27T10:00:00Z',
        updated_at: '2023-10-27T10:15:00Z',
        events: [
            { id: 'ev_8', message_id: 'msg_125', recipient: 'charlie@chocolate.factory', channel: BroadcastChannel.SMS, status: DeliveryStatus.QUEUED, timestamp: '2023-10-27T10:00:00Z' },
            { id: 'ev_9', message_id: 'msg_125', recipient: 'charlie@chocolate.factory', channel: BroadcastChannel.SMS, status: DeliveryStatus.SENT, timestamp: '2023-10-27T10:00:02Z' },
            { id: 'ev_10', message_id: 'msg_125', recipient: 'charlie@chocolate.factory', channel: BroadcastChannel.SMS, status: DeliveryStatus.CLICKED, timestamp: '2023-10-27T10:14:00Z' },
            { id: 'ev_11', message_id: 'msg_125', recipient: 'charlie@chocolate.factory', channel: BroadcastChannel.SMS, status: DeliveryStatus.CARD_NOT_FOUND, timestamp: '2023-10-27T10:15:00Z', meta: { reason: 'Card ID expired' } },
        ]
    }
];

export const MOCK_FLIGHT_PATHS: DeliveryJourney[] = [
    {
        message_id: 'flight_101',
        recipient: 'happy.user@example.com',
        channel: BroadcastChannel.EMAIL,
        current_status: DeliveryStatus.REFERRAL_CONVERTED,
        started_at: '2023-10-28T09:00:00Z',
        updated_at: '2023-10-28T09:15:00Z',
        events: [
            { id: 'e1', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.SENT, timestamp: '2023-10-28T09:00:01Z' },
            { id: 'e2', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.DELIVERED, timestamp: '2023-10-28T09:00:05Z' },
            { id: 'e3', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.OPENED, timestamp: '2023-10-28T09:02:00Z', meta: { ua: 'Gmail/iOS' } },
            { id: 'e4', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.CLICKED, timestamp: '2023-10-28T09:02:15Z', meta: { link: '/card/xyz' } },
            { id: 'e5', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.CARD_VIEWED, timestamp: '2023-10-28T09:02:16Z', meta: { duration: '45s' } },
            { id: 'e6', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.MEMORY_SAVED, timestamp: '2023-10-28T09:03:00Z', meta: { memory_id: 'mem_999' } },
            { id: 'e7', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.REFERRAL_CLICKED, timestamp: '2023-10-28T09:05:00Z' },
            { id: 'e8', message_id: 'flight_101', recipient: 'happy.user@example.com', channel: BroadcastChannel.EMAIL, status: DeliveryStatus.REFERRAL_CONVERTED, timestamp: '2023-10-28T09:15:00Z', meta: { new_user_id: 'usr_new_1' } },
        ]
    },
    {
        message_id: 'flight_404',
        recipient: 'lost.pidgey@example.com',
        channel: BroadcastChannel.SMS,
        current_status: DeliveryStatus.CARD_NOT_FOUND,
        started_at: '2023-10-28T10:00:00Z',
        updated_at: '2023-10-28T10:10:00Z',
        events: [
            { id: 'e9', message_id: 'flight_404', recipient: 'lost.pidgey@example.com', channel: BroadcastChannel.SMS, status: DeliveryStatus.SENT, timestamp: '2023-10-28T10:00:00Z' },
            { id: 'e10', message_id: 'flight_404', recipient: 'lost.pidgey@example.com', channel: BroadcastChannel.SMS, status: DeliveryStatus.CLICKED, timestamp: '2023-10-28T10:10:00Z' },
            { id: 'e11', message_id: 'flight_404', recipient: 'lost.pidgey@example.com', channel: BroadcastChannel.SMS, status: DeliveryStatus.CARD_NOT_FOUND, timestamp: '2023-10-28T10:10:01Z', meta: { reason: 'expired', attempted_id: 'crd_old_1' } },
        ]
    }
];


// Ops data for Jarvis to analyze
export const MOCK_OPERATIONAL_STATS = {
    abandoned_carts: {
        count: 7,
        potential_revenue: 850,
        top_items: ['Pro Subscription', 'Egg Bundle (50)']
    },
    system_health: {
        webhook_failures: 2,
        api_latency_ms: 45,
        last_backup: '2023-10-27T04:00:00Z'
    },
    artist_alerts: [
        { artist_id: 'art_2', message: 'Assets missing for "Watercolor Whimsy" drop', severity: 'medium' }
    ],
    revenue_trends: [
        { day: 'Mon', amount: 4000 },
        { day: 'Tue', amount: 3000 },
        { day: 'Wed', amount: 2000 },
        { day: 'Thu', amount: 2780 },
        { day: 'Fri', amount: 1890 }, // Dip here
        { day: 'Sat', amount: 2390 },
        { day: 'Sun', amount: 3490 },
    ]
};