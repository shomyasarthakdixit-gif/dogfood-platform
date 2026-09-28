import { Event, Team, Submission, Track, Prize } from '@/lib/types';

export const mockTracks: Track[] = [
  { id: 'track-1', event_id: 'evt-1', name: 'Core Platform', description: 'Build tools for developers', created_at: new Date().toISOString() },
  { id: 'track-2', event_id: 'evt-1', name: 'AI Innovation', description: 'Leverage AI for new experiences', created_at: new Date().toISOString() },
];

export const mockPrizes: Prize[] = [
  { id: 'prize-1', event_id: 'evt-1', track_id: null, name: 'Grand Prize', description: 'Best overall project', amount: '$10,000', created_at: new Date().toISOString() },
  { id: 'prize-2', event_id: 'evt-1', track_id: 'track-1', name: 'Best Platform Tool', description: 'Best developer tool', amount: '$5,000', created_at: new Date().toISOString() },
];

export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    slug: 'dogfood-2026',
    name: 'Dogfood 2026',
    description: 'The premier hackathon for the Dogfood 2026 platform. Build amazing things with our new tech stack!',
    start_date: new Date(Date.now() - 86400000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    created_at: new Date().toISOString(),
    status: 'OPEN',
    tracks: mockTracks,
    prizes: mockPrizes,
  },
  {
    id: 'evt-2',
    slug: 'dogfood-winter-2026',
    name: 'Dogfood Winter Innovators',
    description: 'Warm up your coding skills. A 48-hour sprint to build sustainable, eco-friendly tech solutions.',
    start_date: new Date(Date.now() + 86400000 * 30).toISOString(), // starts in 30 days
    end_date: new Date(Date.now() + 86400000 * 32).toISOString(), // 2 days long
    created_at: new Date(Date.now() - 864000000).toISOString(),
    status: 'UPCOMING',
    tracks: [
      { id: 't-3', event_id: 'evt-2', name: 'Green Tech', description: null, created_at: new Date().toISOString() },
      { id: 't-4', event_id: 'evt-2', name: 'Open Source', description: null, created_at: new Date().toISOString() }
    ],
    prizes: [],
  },
  {
    id: 'evt-3',
    slug: 'global-ai-challenge',
    name: 'Global AI Challenge',
    description: 'Push the boundaries of artificial intelligence. Build agents, train models, and create intelligent interfaces.',
    start_date: new Date(Date.now() + 86400000 * 60).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 67).toISOString(), // 1 week long
    created_at: new Date().toISOString(),
    status: 'UPCOMING',
    tracks: [
      { id: 't-5', event_id: 'evt-3', name: 'LLM Agents', description: null, created_at: new Date().toISOString() },
      { id: 't-6', event_id: 'evt-3', name: 'Computer Vision', description: null, created_at: new Date().toISOString() }
    ],
    prizes: [],
  },
  {
    id: 'evt-4',
    slug: 'dogfood-2025',
    name: 'Dogfood 2025',
    description: 'Last year\'s flagship hackathon. Explore the legacy projects and see how far we\'ve come.',
    start_date: new Date(Date.now() - 86400000 * 400).toISOString(),
    end_date: new Date(Date.now() - 86400000 * 397).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 450).toISOString(),
    status: 'CLOSED',
    tracks: [
      { id: 't-7', event_id: 'evt-4', name: 'Legacy Core', description: null, created_at: new Date().toISOString() },
    ],
    prizes: [],
  }
];

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    event_id: 'evt-1',
    name: 'Team Alpha',
    description: 'We are building the next generation of tools.',
    created_at: new Date().toISOString(),
    members: [
      { id: 'tm-1', team_id: 'team-1', user_id: 'user-1', role: 'LEADER', created_at: new Date().toISOString(), user: { id: 'user-1', email: 'alice@example.com', name: 'Alice Organizer', role: 'USER', created_at: new Date().toISOString() } },
      { id: 'tm-2', team_id: 'team-1', user_id: 'user-2', role: 'MEMBER', created_at: new Date().toISOString(), user: { id: 'user-2', email: 'bob@example.com', name: 'Bob Builder', role: 'USER', created_at: new Date().toISOString() } },
    ]
  }
];

export const mockSubmissions: Submission[] = [
  {
    id: 'sub-1',
    team_id: 'team-1',
    event_id: 'evt-1',
    title: 'Alpha Project',
    description: 'A revolutionary new way to build software.',
    url: 'https://github.com/dogfood/alpha',
    repo_url: 'https://github.com/dogfood/alpha',
    status: 'SUBMITTED',
    created_at: new Date().toISOString(),
    team: mockTeams[0],
    track: mockTracks[0],
  },
  {
    id: 'sub-2',
    team_id: 'team-2',
    event_id: 'evt-1',
    title: 'Beta Project (Draft)',
    description: 'Still working on this one...',
    url: null,
    repo_url: null,
    status: 'DRAFT',
    created_at: new Date().toISOString(),
    team: { ...mockTeams[0], id: 'team-2', name: 'Team Beta' },
  },
  {
    id: 'ecolink',
    team_id: 'team-eco',
    event_id: 'evt-1',
    title: 'EcoLink',
    description: 'Smart city optimizer that reduces energy consumption by 30%.',
    url: 'https://ecolink.demo',
    repo_url: 'https://github.com/ecolink/core',
    demo_url: 'https://ecolink.demo',
    status: 'SUBMITTED',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    team: { ...mockTeams[0], id: 'team-eco', name: 'Green Engineers' },
  },
  {
    id: 'healthsphere',
    team_id: 'team-health',
    event_id: 'evt-1',
    title: 'HealthSphere',
    description: 'AI patient diagnostics app that connects rural areas to top doctors.',
    url: 'https://healthsphere.app',
    repo_url: 'https://github.com/healthsphere/app',
    demo_url: 'https://healthsphere.app',
    status: 'SUBMITTED',
    created_at: new Date(Date.now() - 86400000 * 11).toISOString(),
    team: { ...mockTeams[0], id: 'team-health', name: 'MedTech Innovators' },
  },
  {
    id: 'chainguard',
    team_id: 'team-chain',
    event_id: 'evt-1',
    title: 'ChainGuard',
    description: 'Decentralized panel for tracking blockchain vulnerabilities in real-time.',
    url: 'https://chainguard.network',
    repo_url: 'https://github.com/chainguard/panel',
    demo_url: 'https://chainguard.network',
    status: 'SUBMITTED',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    team: { ...mockTeams[0], id: 'team-chain', name: 'Crypto Sec' },
  },
  {
    id: 'quantumsim',
    team_id: 'team-quantum',
    event_id: 'evt-1',
    title: 'QuantumSim',
    description: 'Quantum data visualizer allowing developers to test quantum algorithms in the browser.',
    url: 'https://quantumsim.io',
    repo_url: 'https://github.com/quantumsim/viz',
    demo_url: 'https://quantumsim.io',
    status: 'SUBMITTED',
    created_at: new Date(Date.now() - 86400000 * 13).toISOString(),
    team: { ...mockTeams[0], id: 'team-quantum', name: 'Q-Bits' },
  }
];
