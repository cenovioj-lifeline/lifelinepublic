// Pitch deck content for Lifeline Inc

export interface Card {
  title: string;
  preview: string;
  content: string;
  source?: string;
}

export interface Topic {
  title: string;
  subtitle: string;
  category: 'vision' | 'product' | 'business' | 'founder';
  desc: string;
  cards: Card[];
}

export const categories = {
  vision: { 
    name: 'Vision & Mission', 
    desc: "Why this needs to exist.", 
    topics: [1, 3, 5, 10] 
  },
  product: { 
    name: 'Product', 
    desc: "How it works.", 
    topics: [2, 4, 7, 8] 
  },
  business: { 
    name: 'Business Model', 
    desc: "Who benefits, who pays.", 
    topics: [6, 11] 
  },
  founder: { 
    name: 'Founder', 
    desc: "The worldview behind the platform.", 
    topics: [9, 12] 
  }
};

export const bookMeta = [
  { num: 1, color: 'c1', title: 'The Origin Story', tagline: '"The tool removes the performative aspect of vulnerability."', category: 'vision' as const },
  { num: 2, color: 'c2', title: 'What Lifeline Public Is', tagline: '"Every arc is just a series of rated events."', category: 'product' as const },
  { num: 3, color: 'c3', title: 'The Problem We Solve', tagline: '"We don\'t actually know each other."', category: 'vision' as const },
  { num: 4, color: 'c4', title: 'How It Works', tagline: '"Rate events from -10 to +10."', category: 'product' as const },
  { num: 5, color: 'c5', title: 'Why Now', tagline: '"People are tired of performing."', category: 'vision' as const },
  { num: 6, color: 'c6', title: 'Business Model', tagline: '"Fans pay to see what matters."', category: 'business' as const },
  { num: 7, color: 'c7', title: 'The Platform', tagline: '"Collections become communities."', category: 'product' as const },
  { num: 8, color: 'c8', title: 'Fan Contributions', tagline: '"Let fans help tell the story."', category: 'product' as const },
  { num: 9, color: 'c9', title: 'Founder Vision', tagline: '"This is what I was meant to build."', category: 'founder' as const },
  { num: 10, color: 'c10', title: 'Market Opportunity', tagline: '"The parasocial relationship economy."', category: 'vision' as const },
  { num: 11, color: 'c11', title: 'Revenue Streams', tagline: '"Multiple paths to sustainability."', category: 'business' as const },
  { num: 12, color: 'c12', title: 'The Ask', tagline: '"Join us in building this."', category: 'founder' as const },
];

export const topics: Record<number, Topic> = {
  1: {
    title: "The Origin Story",
    subtitle: "The Lifeline Exercise",
    category: "vision",
    desc: "We don't actually know each other. This platform changes that.",
    cards: [
      {
        title: "The Permission Problem",
        preview: "When do you feel comfortable bringing up that your dad died? That you went through a divorce? That you struggled with addiction?",
        content: `<p>When do you feel comfortable bringing up that your dad died? That you went through a divorce? That you struggled with addiction? Most people never find the right moment.</p>
<p>The Lifeline Exercise creates that moment. It gives people <em>permission</em> to share the stories that actually shaped them, without the social awkwardness of bringing it up unprompted.</p>
<blockquote>"The tool removes the performative aspect of vulnerability. You're not oversharing—you're participating in a structured exercise."</blockquote>`
      },
      {
        title: "How the Exercise Works",
        preview: "Draw a horizontal line. Plot the 15-20 events that shaped who you are. Rate each from -10 to +10.",
        content: `<p>Draw a horizontal line. Plot the 15-20 events that shaped who you are. Rate each from -10 (worst thing that ever happened) to +10 (best thing).</p>
<p>Then share it with someone. Watch how quickly the conversation goes from surface-level to meaningful.</p>
<p>This exercise has been used in leadership programs, therapy, and team building for decades. We're making it accessible to everyone.</p>`
      },
      {
        title: "The Discovery",
        preview: "I discovered this exercise in a leadership program. Within 90 minutes, I knew more about 12 strangers than I knew about friends I'd had for years.",
        content: `<p>I discovered this exercise in a leadership program. Within 90 minutes, I knew more about 12 strangers than I knew about friends I'd had for years.</p>
<p>That moment changed everything. I realized we've been having the wrong conversations our whole lives.</p>
<blockquote>"Real relationships require real sharing. This makes it possible."</blockquote>`
      },
      {
        title: "Why It Works",
        preview: "The exercise works because it's structured. You're not randomly trauma-dumping. You're following a format that makes depth feel safe.",
        content: `<p>The exercise works because it's structured. You're not randomly trauma-dumping. You're following a format that makes depth feel safe.</p>
<p>The rating system adds objectivity. A -8 event is clearly significant. People understand the weight without needing explanation.</p>
<p>The timeline provides context. Events aren't isolated—they're part of a journey.</p>`
      }
    ]
  },
  2: {
    title: "What Lifeline Public Is",
    subtitle: "The Digital Version",
    category: "product",
    desc: "Every arc is just a series of rated events. We're building the platform to share them.",
    cards: [
      {
        title: "The Platform Vision",
        preview: "Lifeline Public is a platform where people share their actual life stories—the highs and lows that shaped who they became.",
        content: `<p>Lifeline Public is a platform where people share their actual life stories—the highs and lows that shaped who they became.</p>
<p>Not the highlight reel. Not the curated image. The real story, with all its complexity.</p>`
      },
      {
        title: "The Timeline Format",
        preview: "Every lifeline is a timeline of events, each rated from -10 to +10. Simple, visual, powerful.",
        content: `<p>Every lifeline is a timeline of events, each rated from -10 to +10. Simple, visual, powerful.</p>
<p>You can see at a glance: this person went through something hard at 25, rebounded at 30, had a setback at 35, and found their stride at 40.</p>
<p>The pattern tells a story that words alone can't capture.</p>`
      },
      {
        title: "Collections",
        preview: "Collections group lifelines by theme—a TV show's characters, a company's founders, a historical period's key figures.",
        content: `<p>Collections group lifelines by theme—a TV show's characters, a company's founders, a historical period's key figures.</p>
<p>Each collection becomes a community. Fans contribute insights. Connections emerge between stories.</p>
<blockquote>"Collections become communities."</blockquote>`
      }
    ]
  },
  3: {
    title: "The Problem We Solve",
    subtitle: "Why Connection Is Broken",
    category: "vision",
    desc: "Social media optimized for engagement destroyed our ability to truly know each other.",
    cards: [
      {
        title: "The Performance Trap",
        preview: "Every platform incentivizes performance. Show your best self. Get likes. Build a personal brand. Hide the struggle.",
        content: `<p>Every platform incentivizes performance. Show your best self. Get likes. Build a personal brand. Hide the struggle.</p>
<p>The result? We're more connected than ever and more lonely than ever. We have thousands of followers and no one who really knows us.</p>`
      },
      {
        title: "Parasocial Relationships",
        preview: "We feel like we know celebrities, influencers, public figures. But we only know their curated image.",
        content: `<p>We feel like we know celebrities, influencers, public figures. But we only know their curated image.</p>
<p>Lifeline Public flips this. When someone shares their actual life arc—the failures alongside the wins—you understand them differently.</p>`
      },
      {
        title: "The Depth Deficit",
        preview: "Most conversations stay surface-level because there's no structure for going deeper. We solve that.",
        content: `<p>Most conversations stay surface-level because there's no structure for going deeper. We solve that.</p>
<p>The Lifeline format provides the structure. The rating system provides the context. The platform provides the permission.</p>`
      }
    ]
  },
  4: {
    title: "How It Works",
    subtitle: "The User Experience",
    category: "product",
    desc: "Simple. Visual. Powerful. Here's how people use Lifeline Public.",
    cards: [
      {
        title: "Creating a Lifeline",
        preview: "Add events. Rate them -10 to +10. Add context and images. Publish when ready.",
        content: `<p>Creating a lifeline is simple:</p>
<ul>
<li>Add events with dates (or just order)</li>
<li>Rate each event from -10 to +10</li>
<li>Add descriptions and images</li>
<li>Publish when you're ready</li>
</ul>
<p>The interface is designed to make the process feel natural, not clinical.</p>`
      },
      {
        title: "Exploring Lifelines",
        preview: "Browse by collection, search by theme, discover connections between stories.",
        content: `<p>Exploring is intuitive:</p>
<ul>
<li>Browse collections by theme</li>
<li>See the visual arc at a glance</li>
<li>Dive deep into individual events</li>
<li>Discover connections between stories</li>
</ul>`
      },
      {
        title: "Contributing",
        preview: "Fans can suggest events, add context, share images. Community-powered storytelling.",
        content: `<p>The platform is collaborative:</p>
<ul>
<li>Suggest missing events</li>
<li>Add historical context</li>
<li>Share relevant images</li>
<li>Vote on the accuracy of ratings</li>
</ul>
<p>The community helps tell the story together.</p>`
      }
    ]
  },
  5: {
    title: "Why Now",
    subtitle: "The Timing Is Perfect",
    category: "vision",
    desc: "People are exhausted by performance. They're ready for something real.",
    cards: [
      {
        title: "Post-Pandemic Authenticity",
        preview: "COVID changed how we value connection. Shallow engagement isn't enough anymore.",
        content: `<p>The pandemic forced us to confront what really matters. Shallow social media engagement stopped satisfying us.</p>
<p>People are hungry for real connection. They're tired of the performance.</p>`
      },
      {
        title: "The Authenticity Movement",
        preview: "Vulnerability is trending. But there's no platform designed for meaningful depth.",
        content: `<p>Books like Brené Brown's dominate bestseller lists. Podcasts go deep. Therapy is destigmatized.</p>
<p>But there's no platform designed specifically for sharing your actual life story. We're filling that gap.</p>`
      },
      {
        title: "Technology Readiness",
        preview: "The tools exist now to build this beautifully. Visual, mobile-first, community-powered.",
        content: `<p>The technology to build a beautiful, intuitive platform for life stories didn't exist 10 years ago.</p>
<p>Now we can create something that feels premium, works on any device, and scales to millions of users.</p>`
      }
    ]
  },
  6: {
    title: "Business Model",
    subtitle: "How We Make Money",
    category: "business",
    desc: "Fans pay to see what matters. Premium access, community features, and more.",
    cards: [
      {
        title: "Freemium Model",
        preview: "Basic access is free. Premium unlocks deeper features and exclusive content.",
        content: `<p>Anyone can browse public lifelines for free. Premium subscribers get:</p>
<ul>
<li>Exclusive behind-the-scenes content</li>
<li>Early access to new features</li>
<li>Community contribution tools</li>
<li>Ad-free experience</li>
</ul>`
      },
      {
        title: "Collection Partnerships",
        preview: "We partner with shows, companies, and creators to build official collections.",
        content: `<p>Official collections are partnerships:</p>
<ul>
<li>TV shows get fan engagement tools</li>
<li>Companies get culture-building platforms</li>
<li>Creators get deeper fan connections</li>
</ul>
<p>Revenue share on premium subscriptions to their collections.</p>`
      },
      {
        title: "Enterprise Applications",
        preview: "The lifeline exercise is used in leadership programs worldwide. We're digitizing that.",
        content: `<p>The lifeline exercise is already used in:</p>
<ul>
<li>Leadership development programs</li>
<li>Team building exercises</li>
<li>Therapy and coaching</li>
<li>Onboarding and culture building</li>
</ul>
<p>Enterprise licenses for private, internal use.</p>`
      }
    ]
  },
  7: {
    title: "The Platform",
    subtitle: "Collections & Communities",
    category: "product",
    desc: "Collections become communities. Here's how the platform grows.",
    cards: [
      {
        title: "Collection Types",
        preview: "Fiction, non-fiction, historical, personal. Different types for different stories.",
        content: `<p>Collections come in many forms:</p>
<ul>
<li><strong>Fiction:</strong> TV shows, movies, books</li>
<li><strong>Non-fiction:</strong> Historical figures, celebrities</li>
<li><strong>Personal:</strong> Family histories, memoirs</li>
<li><strong>Organizational:</strong> Company founders, team members</li>
</ul>`
      },
      {
        title: "Community Features",
        preview: "Discussions, contributions, voting. The community shapes the content.",
        content: `<p>Each collection is a community:</p>
<ul>
<li>Discussion threads on events</li>
<li>Community-suggested additions</li>
<li>Voting on rating accuracy</li>
<li>Collaborative storytelling</li>
</ul>`
      },
      {
        title: "Growth Mechanics",
        preview: "Each collection attracts its own audience. Network effects kick in as collections cross-reference.",
        content: `<p>Growth is organic:</p>
<ul>
<li>Each collection has its own audience</li>
<li>Cross-references create discovery</li>
<li>Contributors become ambassadors</li>
<li>Quality content attracts more quality</li>
</ul>`
      }
    ]
  },
  8: {
    title: "Fan Contributions",
    subtitle: "Community-Powered Content",
    category: "product",
    desc: "Let fans help tell the story. Moderated, quality-controlled, community-driven.",
    cards: [
      {
        title: "Contribution Types",
        preview: "Events, images, context, corrections. Fans bring the details.",
        content: `<p>Fans can contribute:</p>
<ul>
<li>Missing events and context</li>
<li>Historical images and media</li>
<li>Corrections and clarifications</li>
<li>Connections to other lifelines</li>
</ul>`
      },
      {
        title: "Moderation System",
        preview: "Community-suggested, editor-approved. Quality control without bottlenecks.",
        content: `<p>Quality control is built in:</p>
<ul>
<li>Community members suggest additions</li>
<li>Collection editors review and approve</li>
<li>Voting surfaces the best contributions</li>
<li>Clear guidelines maintain standards</li>
</ul>`
      },
      {
        title: "Contributor Recognition",
        preview: "Top contributors get recognition, badges, and access to exclusive features.",
        content: `<p>Contributors are valued:</p>
<ul>
<li>Contributor profiles and stats</li>
<li>Badges for quality contributions</li>
<li>Leaderboards within collections</li>
<li>Early access to new features</li>
</ul>`
      }
    ]
  },
  9: {
    title: "Founder Vision",
    subtitle: "Why I'm Building This",
    category: "founder",
    desc: "This is what I was meant to build. Here's why.",
    cards: [
      {
        title: "The Aha Moment",
        preview: "When I did the lifeline exercise, everything clicked. This is what's been missing.",
        content: `<p>When I did the lifeline exercise for the first time, I understood something I'd been circling for years.</p>
<p>We spend our lives with people and never really know them. Not because we don't care—because we don't have the format.</p>
<blockquote>"This is what I was meant to build."</blockquote>`
      },
      {
        title: "The Long View",
        preview: "I'm not building to flip. I'm building something that will exist for decades.",
        content: `<p>This isn't a quick startup play. I'm building infrastructure for human connection that will exist for decades.</p>
<p>The lifeline exercise is timeless. The platform is the distribution.</p>`
      },
      {
        title: "Why Me",
        preview: "I've spent my career at the intersection of stories and technology. This is the synthesis.",
        content: `<p>My background is perfect for this:</p>
<ul>
<li>Storytelling and narrative design</li>
<li>Technology and product development</li>
<li>Community building and engagement</li>
<li>Deep personal experience with the exercise</li>
</ul>`
      }
    ]
  },
  10: {
    title: "Market Opportunity",
    subtitle: "The Parasocial Economy",
    category: "vision",
    desc: "The parasocial relationship economy is massive. We're building infrastructure for it.",
    cards: [
      {
        title: "The Size of the Market",
        preview: "Billions spent on content that helps us feel like we know people. We're making that real.",
        content: `<p>The market for parasocial content is enormous:</p>
<ul>
<li>Streaming subscriptions</li>
<li>Fan communities and merchandise</li>
<li>Celebrity media and gossip</li>
<li>Reality TV and documentaries</li>
</ul>
<p>All of it is about wanting to know people. We deliver on that promise.</p>`
      },
      {
        title: "Competitive Landscape",
        preview: "There's no direct competitor. Social media is too shallow. Memoirs are too static.",
        content: `<p>Nothing else does what we do:</p>
<ul>
<li>Social media is too shallow</li>
<li>Memoirs are static and one-way</li>
<li>Wikipedia is facts, not feelings</li>
<li>Podcasts are audio, not visual</li>
</ul>
<p>We're creating a new category.</p>`
      },
      {
        title: "The Network Effect",
        preview: "As more collections launch, the platform becomes more valuable. Cross-pollination drives growth.",
        content: `<p>Network effects kick in as we grow:</p>
<ul>
<li>More collections = more discovery</li>
<li>More contributors = better content</li>
<li>More users = more valuable community</li>
<li>Cross-references multiply engagement</li>
</ul>`
      }
    ]
  },
  11: {
    title: "Revenue Streams",
    subtitle: "Multiple Paths to Sustainability",
    category: "business",
    desc: "Premium subscriptions, partnerships, enterprise—diversified revenue from day one.",
    cards: [
      {
        title: "Consumer Subscriptions",
        preview: "$5-15/month for premium access. Multiple tiers based on features.",
        content: `<p>Consumer subscription tiers:</p>
<ul>
<li><strong>Free:</strong> Browse public content</li>
<li><strong>Fan ($5/mo):</strong> Premium features, no ads</li>
<li><strong>Superfan ($15/mo):</strong> Exclusive content, contributor tools</li>
</ul>`
      },
      {
        title: "Creator Partnerships",
        preview: "Revenue share with shows, creators, and rights holders. Win-win monetization.",
        content: `<p>Partnership revenue:</p>
<ul>
<li>Revenue share on collection subscriptions</li>
<li>Sponsored collection launches</li>
<li>Cross-promotion opportunities</li>
<li>White-label solutions</li>
</ul>`
      },
      {
        title: "Enterprise Licenses",
        preview: "Private lifeline platforms for companies. Team building, onboarding, culture.",
        content: `<p>Enterprise applications:</p>
<ul>
<li>Private company collections</li>
<li>Team building exercises</li>
<li>Leadership development</li>
<li>Culture documentation</li>
</ul>
<p>Per-seat licensing or flat fees.</p>`
      }
    ]
  },
  12: {
    title: "The Ask",
    subtitle: "Join Us",
    category: "founder",
    desc: "We're raising to build the team and scale the platform. Here's what we need.",
    cards: [
      {
        title: "What We're Raising",
        preview: "Seed round to build the core team and launch premium features.",
        content: `<p>We're raising a seed round to:</p>
<ul>
<li>Hire core engineering team</li>
<li>Build premium features</li>
<li>Launch partnership program</li>
<li>Scale to 100+ collections</li>
</ul>`
      },
      {
        title: "Use of Funds",
        preview: "70% team, 20% product development, 10% marketing and partnerships.",
        content: `<p>Fund allocation:</p>
<ul>
<li><strong>70%:</strong> Team (engineering, design, community)</li>
<li><strong>20%:</strong> Product development and infrastructure</li>
<li><strong>10%:</strong> Marketing and partnership development</li>
</ul>`
      },
      {
        title: "The Opportunity",
        preview: "Help us build something that matters. Join the team, invest, or partner with us.",
        content: `<p>There are many ways to get involved:</p>
<ul>
<li>Invest in the seed round</li>
<li>Join the team</li>
<li>Partner on a collection</li>
<li>Become a beta tester</li>
</ul>
<blockquote>"Help us build something that matters."</blockquote>`
      }
    ]
  }
};

// Helper to get all cards for a category
export function getCardsByCategory(categoryKey: string): Array<Card & { topicNum: number; topicTitle: string }> {
  const topicNums = categories[categoryKey as keyof typeof categories]?.topics || [];
  const allCards: Array<Card & { topicNum: number; topicTitle: string }> = [];
  
  topicNums.forEach(num => {
    const topic = topics[num];
    if (topic) {
      topic.cards.forEach(card => {
        allCards.push({
          ...card,
          topicNum: num,
          topicTitle: topic.title
        });
      });
    }
  });
  
  return allCards;
}

// Get total card count
export function getTotalCardCount(): number {
  return Object.values(topics).reduce((sum, topic) => sum + topic.cards.length, 0);
}

// Get card count by category
export function getCardCountByCategory(categoryKey: string): number {
  return getCardsByCategory(categoryKey).length;
}
