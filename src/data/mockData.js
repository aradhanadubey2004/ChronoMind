export const mockUser = {
  id: 'usr_01',
  name: 'Alex Vance',
  email: 'alex.vance@chronomind.ai',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  company: 'Apex AI Ventures',
  role: 'Principal Architect & Founder',
  plan: 'Pro Cognitive',
  cognitiveCapacity: 94,
  memoriesStored: 1842,
  decisionsTracked: 128,
  aiTokensUsed: '582.4K / 1M',
  apiKey: 'cm_live_98f23a8871bc29a00213d4ef',
  autoExtractMemories: true,
  privacyMode: 'Zero Knowledge'
};

export const mockMemories = [
  {
    id: 'mem_1',
    title: 'Product Architecture Review: PostgreSQL + TimescaleDB for Timeline Store',
    summary: 'Evaluated high-throughput database backends for the real-time temporal decision tree index. Agreed to adopt PostgreSQL with TimescaleDB extensions rather than NoSQL key-value stores.',
    category: 'meeting',
    retentionScore: 98,
    tags: ['Architecture', 'Database', 'Performance', 'Engineering'],
    createdAt: '2 hours ago',
    contextSnippet: 'Discussed 50,000 writes/sec target load. Multi-attribute range queries and relational graph links required for cross-referencing decisions made in Q2.',
    relevanceScore: 98,
    isPinned: true,
    decayDays: 180,
    sourceSession: 'Architecture Review #14',
    participants: ['Alex Vance (Host)', 'Elena Rostova (Lead Data Eng)', 'Marcus Chen (VP Eng)'],
    keyPoints: [
      'DynamoDB lacked multi-attribute range query efficiency for temporal memory trees',
      'PostgreSQL + TimescaleDB provides 99.9% uptime SLA and seamless SQL analytic queries',
      'Memory indexing latency stays under 18ms at peak load'
    ],
    decisionsMade: [
      'Adopt PostgreSQL + TimescaleDB for temporal store',
      'Implement client-side AES-GCM-256 envelope key derivation'
    ],
    actionItems: [
      'Elena: Provision staging TimescaleDB cluster by Thursday',
      'Alex: Draft security envelope key rotation protocol spec'
    ]
  },
  {
    id: 'mem_2',
    title: 'Executive Sync: User Onboarding & Conversion Friction Analysis',
    summary: 'Analyzed user behavior telemetry on the new signup funnel. Identified a 24% conversion bottleneck at the multi-factor authentication setup step.',
    category: 'insight',
    retentionScore: 94,
    tags: ['UX', 'Conversion', 'Authentication', 'Growth'],
    createdAt: 'Yesterday at 3:30 PM',
    contextSnippet: 'Telemetry revealed desktop users abandoning signups when required to open mobile authenticator apps. Single-click WebAuthn biometrics will eliminate friction.',
    relevanceScore: 92,
    isPinned: true,
    decayDays: 120,
    sourceSession: 'Product Strategy Sync',
    participants: ['Alex Vance', 'Sarah Jenkins (Growth Lead)', 'David Kim (Product Lead)'],
    keyPoints: [
      'Drop-off rate peaked at 24.2% on the TOTP setup screen',
      'Passkey / WebAuthn biometric login can be offered as primary option',
      'Magic link fallback maintains 100% device accessibility'
    ],
    decisionsMade: [
      'Make WebAuthn Passkeys the primary login option',
      'Deprecate mandatory TOTP for self-serve starter plans'
    ],
    actionItems: [
      'Sarah: Update onboarding flow UI mockup in Figma',
      'David: Benchmark conversion lift in A/B test cohort'
    ]
  },
  {
    id: 'mem_3',
    title: 'Zero-Knowledge Envelope Key Rotation & AES-256 Implementation',
    summary: 'Constructed client-side crypto handler for client-side memory payload encryption prior to cloud persistence.',
    category: 'code',
    retentionScore: 99,
    tags: ['Security', 'Encryption', 'SOC2', 'Privacy'],
    createdAt: '3 days ago',
    contextSnippet: 'const derivedKey = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, ...)',
    relevanceScore: 96,
    isPinned: false,
    decayDays: 365,
    sourceSession: 'SecOps Audit Call',
    participants: ['Alex Vance', 'SecOps External Auditor'],
    keyPoints: [
      'Client master key never transmitted over the network',
      'PBKDF2 SHA-256 derivation with 250,000 iterations enforces SOC2 compliance',
      'Supports automated annual key rotation without data re-encryption'
    ],
    decisionsMade: [
      'Enforce Zero-Knowledge payload encryption across all Pro and Enterprise tiers'
    ],
    actionItems: [
      'Alex: Commit crypto utility module to repo and update technical docs'
    ]
  },
  {
    id: 'mem_4',
    title: 'Q3 Enterprise SaaS Monetization & Pricing Tier Structure',
    summary: 'Finalized enterprise pricing model introducing hybrid seat-based pricing plus cognitive token quotas.',
    category: 'strategy',
    retentionScore: 88,
    tags: ['Pricing', 'Monetization', 'Finance', 'SaaS'],
    createdAt: '4 days ago',
    contextSnippet: 'Market analysis showed pure seat-based plans disincentivized heavy AI usage. Hybrid model preserves 82%+ gross margins.',
    relevanceScore: 85,
    isPinned: false,
    decayDays: 90,
    sourceSession: 'Executive Steering Board',
    participants: ['Alex Vance', 'Board Investors', 'CFO'],
    keyPoints: [
      'Base Pro seat set at $49/mo with 1M cognitive memory tokens included',
      'Overage priced at $0.002 per memory index lookup query',
      'Gross margin target locked at 84.5%'
    ],
    decisionsMade: [
      'Adopt hybrid seat + token usage pricing structure for Q3 launch'
    ],
    actionItems: [
      'Finance: Draft updated billing agreement for sales team'
    ]
  },
  {
    id: 'mem_5',
    title: 'User Interface Preferences & Dense Dashboard Layout Guidelines',
    summary: 'Documented design tokens for high-density monitoring displays, crisp white canvas palette, and smooth micro-interactions.',
    category: 'preference',
    retentionScore: 100,
    tags: ['UI/UX', 'Design Tokens', 'Preferences'],
    createdAt: '1 week ago',
    contextSnippet: ' Alex requested clean white glassmorphism background (#FFFFFF / #F8FAFC), royal blue accents (#2563EB), and tight grid alignment.',
    relevanceScore: 100,
    isPinned: true,
    decayDays: 999,
    sourceSession: 'Design System Review',
    participants: ['Alex Vance', 'Lead UI Designer'],
    keyPoints: [
      'Light theme exclusively with royal blue primary accents',
      'Card padding: 20px, border-radius: 16px, subtle shadows',
      'High accessibility contrast WCAG AA compliant typography'
    ],
    decisionsMade: [
      'Standardize on Light Enterprise SaaS Design System'
    ],
    actionItems: [
      'Design: Export Tailwind design token CSS variable file'
    ]
  }
];

export const mockDecisions = [
  {
    id: 'dec_101',
    title: 'Migrate Core State Engine to Server-Sent Events (SSE)',
    description: 'Transitioning real-time streaming updates from WebSocket full-duplex to SSE + HTTP/2 for lower infrastructure idle costs and simplified load balancing.',
    timestamp: 'Today, 10:30 AM',
    impactScore: 9.2,
    riskLevel: 'Medium',
    status: 'Executed',
    tags: ['Infrastructure', 'Networking', 'Realtime'],
    linkedMemoriesCount: 4,
    simulatedScenarioCount: 3,
    author: 'Alex Vance',
    choices: [
      {
        id: 'c1',
        label: 'HTTP/2 Server-Sent Events (Chosen)',
        selected: true,
        projectedOutcome: 'Reduced infrastructure cost by 38%, eliminated sticky session requirements in Cloud Run.',
        aiConfidence: 94,
        riskIndex: 18
      },
      {
        id: 'c2',
        label: 'Retain Custom WebSocket Server',
        selected: false,
        projectedOutcome: 'Maintains bidirectional low latency, but requires dedicated stateful Redis adapter cluster.',
        aiConfidence: 78,
        riskIndex: 45
      },
      {
        id: 'c3',
        label: 'gRPC Web Streaming',
        selected: false,
        projectedOutcome: 'Excellent binary efficiency, but higher client proxy configuration overhead.',
        aiConfidence: 82,
        riskIndex: 62
      }
    ]
  },
  {
    id: 'dec_102',
    title: 'Launch ChronoMind Chrome Extension vs Native Desktop App',
    description: 'Evaluating initial launch vector to capture knowledge workers during web browsing vs full screen system context capture.',
    timestamp: 'Yesterday, 3:15 PM',
    impactScore: 8.7,
    riskLevel: 'High',
    status: 'Evaluating',
    tags: ['Product Strategy', 'Growth', 'Distribution'],
    linkedMemoriesCount: 6,
    simulatedScenarioCount: 5,
    author: 'Product Board',
    choices: [
      {
        id: 'c1',
        label: 'Chrome Extension First (Recommended)',
        selected: false,
        projectedOutcome: '3.4x faster user adoption, 60% lower development cycle cost, frictionless setup.',
        aiConfidence: 91,
        riskIndex: 22
      },
      {
        id: 'c2',
        label: 'Tauri Native Rust Desktop App',
        selected: false,
        projectedOutcome: 'Deeper system integration and global shortcut capture, but 4-month longer release cycle.',
        aiConfidence: 74,
        riskIndex: 68
      }
    ]
  },
  {
    id: 'dec_103',
    title: 'Adopt Multi-Region Cloud Run vs Kubernetes (GKE)',
    description: 'Comparing serverless container scaling vs dedicated GKE Autopilot cluster for global edge memory nodes.',
    timestamp: 'Jul 28, 2026',
    impactScore: 9.5,
    riskLevel: 'Critical',
    status: 'Simulated',
    tags: ['Cloud', 'DevOps', 'Scale'],
    linkedMemoriesCount: 8,
    simulatedScenarioCount: 8,
    author: 'Infrastructure Lead',
    choices: [
      {
        id: 'c1',
        label: 'Multi-Region Cloud Run',
        selected: true,
        projectedOutcome: 'Zero idle cost during off-peak hours, sub-second cold starts with min instances.',
        aiConfidence: 96,
        riskIndex: 14
      },
      {
        id: 'c2',
        label: 'GKE Autopilot',
        selected: false,
        projectedOutcome: 'Full Kubernetes ecosystem support, but $450/mo baseline fixed cluster overhead per region.',
        aiConfidence: 85,
        riskIndex: 52
      }
    ]
  }
];

export const mockChatMessages = [
  {
    id: 'm_1',
    sender: 'assistant',
    text: "Welcome back, Alex. I've synced **1,420 cognitive memories** and reviewed your **3 active decision timelines**. How can ChronoMind assist your workflow today?",
    timestamp: '10:00 AM',
    modelUsed: 'Chrono-Flash 3.5'
  },
  {
    id: 'm_2',
    sender: 'user',
    text: "Can you recall why we chose SSE over WebSockets for our real-time state engine? Summarize the decision impact and list the linked memory references.",
    timestamp: '10:02 AM'
  },
  {
    id: 'm_3',
    sender: 'assistant',
    text: `Here is the memory recall from **Decision Timeline #101** and linked architecture notes:

### 🧠 Core Decision Summary
On **August 4th, 2026**, you chose **Server-Sent Events (SSE)** over WebSockets.

### 🔑 Key Rationales
1. **Infrastructure Efficiency:** SSE avoids stateful TCP socket overhead, cutting Cloud Run load-balancer idle costs by **38%**.
2. **Simplified Scaling:** Works seamlessly with standard HTTP/2 auto-scaling without needing a Redis Pub/Sub adapter layer.
3. **Client Simplicity:** Native Browser \`EventSource\` handling with automatic reconnection resilience.

### 🔗 Linked Memory Contexts
* 📍 **Mem #1:** PostgreSQL + TimescaleDB for temporal event logging
* 📍 **Mem #3:** Zero-Knowledge Envelope Key Rotation
* 📍 **Decision #101:** SSE vs WebSocket vs gRPC Web

Would you like me to generate a scenario prediction for adding SSE fallback polling for legacy browser targets?`,
    timestamp: '10:02 AM',
    modelUsed: 'Chrono-Reasoning 2.0',
    memoryContexts: ['Mem #1: DB Architecture', 'Dec #101: SSE vs WS', 'Mem #3: Security Key'],
    reasoningSteps: [
      'Scanned semantic memory graph for "SSE WebSocket Decision"',
      'Cross-referenced Decision #101 impact logs',
      'Extracted cost delta (-38%) and architectural tags',
      'Synthesized structured response with markdown formatting'
    ],
    pinnedToMemory: true
  }
];

export const mockTasks = [
  {
    id: 't_1',
    title: 'Finalize Zero-Knowledge Memory Envelope Specs',
    description: 'Document argon2id parameters and client-side key derivation security boundary for SOC2 compliance report.',
    category: 'Deep Work',
    energyNeeded: 'High Focus',
    priorityScore: 94,
    status: 'in_progress',
    dueDate: 'Today, 5:00 PM',
    estimatedMinutes: 90,
    linkedDecisionTitle: 'Zero-Knowledge Encryption Key Rotation Protocol',
    memoryCount: 3,
    aiScheduleRecommendation: 'Recommended focus slot: 2:00 PM - 3:30 PM (Peak Cognitive Window)'
  },
  {
    id: 't_2',
    title: 'Review Chrome Extension Onboarding Wireframes',
    description: 'Verify 1-click WebAuthn biometrics passkey UI flow based on yesterday\'s user drop-off analysis.',
    category: 'Strategic',
    energyNeeded: 'Medium Flow',
    priorityScore: 88,
    status: 'todo',
    dueDate: 'Tomorrow, 12:00 PM',
    estimatedMinutes: 45,
    linkedDecisionTitle: 'Launch ChronoMind Chrome Extension vs Native Desktop App',
    memoryCount: 2,
    aiScheduleRecommendation: 'Recommended focus slot: Tomorrow 10:00 AM'
  },
  {
    id: 't_3',
    title: 'Benchmark Speculative Decoding Logit Speedup',
    description: 'Run 500 test generations comparing Chrono-Flash draft models against baseline response latencies.',
    category: 'Deep Work',
    energyNeeded: 'High Focus',
    priorityScore: 82,
    status: 'completed',
    dueDate: 'Yesterday',
    estimatedMinutes: 60,
    memoryCount: 4
  },
  {
    id: 't_4',
    title: 'Audit API Token Usage Limits for Enterprise Tiers',
    description: 'Configure automated soft-cap warnings at 80% usage for high-volume customer workspaces.',
    category: 'Quick Win',
    energyNeeded: 'Low Energy / Quick',
    priorityScore: 65,
    status: 'todo',
    dueDate: 'Aug 6, 2026',
    estimatedMinutes: 20,
    memoryCount: 1,
    aiScheduleRecommendation: 'Ideal for low-energy end-of-day slot at 4:30 PM'
  }
];

export const mockPricingPlans = [
  {
    id: 'starter',
    name: 'Individual Mind',
    priceMonthly: 19,
    priceAnnual: 15,
    description: 'For solo founders, researchers, and creators looking to build an augmented second brain.',
    features: [
      'Up to 1,000 Active Memory Nodes',
      'Temporal AI Chat (Chrono-Flash)',
      'Basic Decision Timeline (3 Active)',
      'Web Browser Context Capture',
      'Standard 24-Hour Memory Sync'
    ],
    ctaText: 'Start 14-Day Free Trial'
  },
  {
    id: 'pro',
    name: 'Pro Cognitive',
    badge: 'MOST POPULAR',
    recommended: true,
    priceMonthly: 49,
    priceAnnual: 39,
    description: 'For power users, senior engineers, and strategists requiring deep memory graph recall and decision simulations.',
    features: [
      'Unlimited Semantic Memory Vault',
      'Chrono-Reasoning 2.0 & Ultra LLMs',
      'Infinite Decision Timelines & Scenario Simulator',
      'AI Cognitive Task Matrix & Energy Scheduler',
      'Zero-Knowledge Client Envelope Encryption',
      'Priority SSE Streaming & Instant Search',
      'Custom Context Tags & Export'
    ],
    ctaText: 'Upgrade to Pro'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Brain',
    priceMonthly: 149,
    priceAnnual: 119,
    description: 'For executive teams, startups, and organizations requiring shared team cognitive memory graphs and SOC2 compliance.',
    features: [
      'Multi-User Shared Team Memory Graphs',
      'Custom Dedicated Single-Tenant LLM Endpoints',
      'Role-Based Access Control (RBAC) & SAML SSO',
      'SOC2 Type II & GDPR Audit Trail Compliance',
      'Dedicated Cognitive AI Architect Support',
      '99.99% Uptime SLA Guarantee'
    ],
    ctaText: 'Contact Executive Sales'
  }
];
