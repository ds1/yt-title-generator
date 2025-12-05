// YT-Title-Generator MCP Server
// Generates SEO-optimized, click-worthy YouTube titles

const WebSocket = require('ws');

class YTTitleGenerator {
  constructor() {
    this.name = 'YT-Title-Generator';
    this.version = '1.0.0';
    this.capabilities = ['youtube', 'titles', 'optimization', 'seo'];
    this.port = process.env.PORT || 3000;

    // Title templates by style
    this.titleTemplates = {
      tutorial: [
        '{keyword} - Complete Guide for {audience}',
        'How to {keyword} (Step-by-Step Tutorial)',
        '{keyword} Tutorial: {benefit} in {time}',
        'Learn {keyword} - {audience} Guide {year}',
        'Master {keyword}: From Beginner to Pro'
      ],
      review: [
        '{keyword} Review: Is It Worth It? ({year})',
        'I Tried {keyword} for {time} - Honest Review',
        '{keyword}: The Truth Nobody Tells You',
        '{keyword} vs Competition - Which Is Better?',
        'My Honest {keyword} Review After {time}'
      ],
      listicle: [
        'Top {number} {keyword} Tips You Need to Know',
        '{number} {keyword} Mistakes to Avoid in {year}',
        '{number} Best {keyword} Secrets Revealed',
        '{keyword}: {number} Things I Wish I Knew Earlier',
        'The {number} Most Important {keyword} Tips'
      ],
      howTo: [
        'How I {result} with {keyword}',
        'How to {keyword} (The RIGHT Way)',
        '{keyword}: How to Get {result} Fast',
        'The Easy Way to {keyword} ({year})',
        'How to {keyword} Without {obstacle}'
      ],
      entertainment: [
        'I Tried {keyword} and THIS Happened...',
        '{keyword} Challenge Gone Wrong?!',
        'You Won\'t Believe This {keyword} Result',
        'Testing {keyword} So You Don\'t Have To',
        'What Happens When You {keyword}?'
      ],
      educational: [
        '{keyword} Explained Simply',
        'What is {keyword}? Everything You Need to Know',
        '{keyword} for Beginners: Complete Overview',
        'Understanding {keyword}: A Deep Dive',
        'The Science Behind {keyword}'
      ]
    };

    // Power words for engagement
    this.powerWords = {
      urgency: ['Now', 'Today', 'Immediately', 'Quick', 'Fast', 'Instant'],
      exclusivity: ['Secret', 'Hidden', 'Exclusive', 'Insider', 'Unknown'],
      value: ['Free', 'Ultimate', 'Complete', 'Essential', 'Best'],
      emotion: ['Amazing', 'Incredible', 'Mind-Blowing', 'Shocking', 'Surprising'],
      trust: ['Proven', 'Tested', 'Official', 'Expert', 'Professional']
    };
  }

  start() {
    const wss = new WebSocket.Server({ port: this.port });

    wss.on('connection', (ws) => {
      console.log(`[${new Date().toISOString()}] Client connected`);

      ws.on('message', async (message) => {
        try {
          const request = JSON.parse(message.toString());
          console.log(`[${new Date().toISOString()}] Received:`, request.method);

          const response = await this.handleRequest(request);
          ws.send(JSON.stringify(response));
        } catch (error) {
          console.error('Error processing message:', error);
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error' },
            id: null
          }));
        }
      });

      ws.on('close', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected`);
      });
    });

    console.log(`🚀 ${this.name} MCP server running on port ${this.port}`);

    if (process.env.REPLIT_ENVIRONMENT === 'production') {
      console.log(`📡 Published WebSocket URL: wss://yt-title-generator-agt.replit.app`);
    } else {
      console.log(`📡 Dev WebSocket URL: ws://localhost:${this.port}`);
    }
  }

  async handleRequest(request) {
    const { method, params, id } = request;

    switch(method) {
      case 'ping':
        return this.handlePing(id);

      case 'tools/list':
        return this.handleToolsList(id);

      case 'tools/call':
        return await this.handleToolCall(params, id);

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id
        };
    }
  }

  handlePing(id) {
    return {
      jsonrpc: '2.0',
      result: {
        status: 'ok',
        agent: this.name,
        version: this.version,
        timestamp: new Date().toISOString()
      },
      id
    };
  }

  handleToolsList(id) {
    return {
      jsonrpc: '2.0',
      result: {
        tools: [
          {
            name: 'generateTitles',
            description: 'Generate SEO-optimized YouTube titles based on analyzed keywords',
            inputSchema: {
              type: 'object',
              properties: {
                concept: {
                  type: 'string',
                  description: 'The main video concept'
                },
                keywords: {
                  type: 'object',
                  description: 'Analyzed keywords with recommendations'
                },
                contentStyle: {
                  type: 'string',
                  enum: ['tutorial', 'review', 'listicle', 'howTo', 'entertainment', 'educational'],
                  description: 'Style of content'
                },
                targetAudience: {
                  type: 'string',
                  description: 'Target audience'
                },
                count: {
                  type: 'number',
                  description: 'Number of titles to generate',
                  default: 5
                },
                tone: {
                  type: 'string',
                  enum: ['professional', 'casual', 'clickbait', 'educational'],
                  description: 'Tone of the titles'
                }
              },
              required: ['concept', 'keywords']
            }
          }
        ]
      },
      id
    };
  }

  async handleToolCall(params, id) {
    const { name, arguments: args } = params;

    if (name !== 'generateTitles') {
      return {
        jsonrpc: '2.0',
        error: { code: -32602, message: `Unknown tool: ${name}` },
        id
      };
    }

    try {
      const result = await this.generateTitles(args);
      return {
        jsonrpc: '2.0',
        result: {
          content: result
        },
        id
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        error: { code: -32603, message: error.message },
        id
      };
    }
  }

  async generateTitles({ concept, keywords, contentStyle = 'tutorial', targetAudience = 'general', count = 5, tone = 'professional' }) {
    if (!concept) {
      throw new Error('Concept is required');
    }

    console.log(`Generating ${count} titles for: "${concept}"`);

    // Extract primary keywords
    const primaryKeywords = keywords?.recommended?.primary || [{ keyword: concept }];
    const mainKeyword = primaryKeywords[0]?.keyword || concept;

    const titles = [];
    const templates = this.titleTemplates[contentStyle] || this.titleTemplates.tutorial;

    // Generate titles from templates
    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const title = this.fillTemplate(templates[i], {
        keyword: this.capitalizeWords(mainKeyword),
        audience: this.capitalizeWords(targetAudience),
        year: new Date().getFullYear(),
        time: this.getRandomTime(),
        number: this.getRandomNumber(),
        benefit: this.getRandomBenefit(),
        result: this.getRandomResult(mainKeyword),
        obstacle: this.getRandomObstacle()
      });

      const analysis = this.analyzeTitle(title, mainKeyword);

      titles.push({
        title,
        ...analysis,
        template: templates[i]
      });
    }

    // Generate custom variations
    const customTitles = this.generateCustomTitles(mainKeyword, primaryKeywords, tone, targetAudience);
    customTitles.forEach(title => {
      const analysis = this.analyzeTitle(title, mainKeyword);
      titles.push({
        title,
        ...analysis,
        template: 'custom'
      });
    });

    // Sort by SEO score
    titles.sort((a, b) => b.seoScore - a.seoScore);

    // Get top titles
    const selectedTitles = titles.slice(0, count);

    return {
      concept,
      mainKeyword,
      contentStyle,
      targetAudience,
      generatedAt: new Date().toISOString(),
      titles: selectedTitles,
      bestTitle: selectedTitles[0],
      alternativeTitles: selectedTitles.slice(1),
      tips: [
        'Keep titles under 60 characters for full visibility',
        'Place primary keyword near the beginning',
        'Use numbers when possible (e.g., "5 Tips")',
        'Include the year for evergreen content',
        'Create curiosity without being misleading'
      ],
      warnings: this.generateWarnings(selectedTitles)
    };
  }

  fillTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  capitalizeWords(str) {
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  getRandomTime() {
    const times = ['30 Days', '1 Week', '24 Hours', '1 Month', '10 Minutes'];
    return times[Math.floor(Math.random() * times.length)];
  }

  getRandomNumber() {
    const numbers = [3, 5, 7, 10, 12, 15];
    return numbers[Math.floor(Math.random() * numbers.length)];
  }

  getRandomBenefit() {
    const benefits = ['Results', 'Success', 'Mastery', 'Progress', 'Growth'];
    return benefits[Math.floor(Math.random() * benefits.length)];
  }

  getRandomResult(keyword) {
    const results = [
      `Mastered ${keyword}`,
      `Got Amazing Results`,
      `Achieved Success`,
      `Made Real Progress`,
      `Changed Everything`
    ];
    return results[Math.floor(Math.random() * results.length)];
  }

  getRandomObstacle() {
    const obstacles = ['Spending Money', 'Wasting Time', 'Common Mistakes', 'Confusion', 'Frustration'];
    return obstacles[Math.floor(Math.random() * obstacles.length)];
  }

  generateCustomTitles(mainKeyword, primaryKeywords, tone, audience) {
    const titles = [];
    const keyword = this.capitalizeWords(mainKeyword);
    const year = new Date().getFullYear();

    switch (tone) {
      case 'clickbait':
        titles.push(`This ${keyword} Trick Changes EVERYTHING`);
        titles.push(`Why Nobody Talks About ${keyword} (Secrets Revealed)`);
        break;
      case 'professional':
        titles.push(`${keyword}: A Comprehensive Guide (${year})`);
        titles.push(`Professional ${keyword} Techniques Explained`);
        break;
      case 'casual':
        titles.push(`Let's Talk About ${keyword}`);
        titles.push(`My ${keyword} Journey - What I Learned`);
        break;
      case 'educational':
        titles.push(`Understanding ${keyword}: Complete Breakdown`);
        titles.push(`${keyword} 101: Everything You Need to Know`);
        break;
    }

    // Add audience-specific title
    if (audience && audience !== 'general') {
      titles.push(`${keyword} for ${this.capitalizeWords(audience)}: Complete Guide`);
    }

    return titles;
  }

  analyzeTitle(title, keyword) {
    const analysis = {
      characterCount: title.length,
      wordCount: title.split(' ').length,
      hasKeyword: title.toLowerCase().includes(keyword.toLowerCase()),
      keywordPosition: title.toLowerCase().indexOf(keyword.toLowerCase()),
      hasNumber: /\d/.test(title),
      hasYear: /202[4-9]/.test(title),
      hasPowerWord: false,
      powerWordsUsed: [],
      seoScore: 0,
      issues: []
    };

    // Check for power words
    for (const [category, words] of Object.entries(this.powerWords)) {
      for (const word of words) {
        if (title.toLowerCase().includes(word.toLowerCase())) {
          analysis.hasPowerWord = true;
          analysis.powerWordsUsed.push({ word, category });
        }
      }
    }

    // Calculate SEO score
    let score = 50; // Base score

    // Keyword presence and position
    if (analysis.hasKeyword) {
      score += 20;
      if (analysis.keywordPosition < 20) score += 10; // Early placement bonus
    }

    // Length optimization (50-60 chars is ideal)
    if (analysis.characterCount >= 45 && analysis.characterCount <= 65) {
      score += 15;
    } else if (analysis.characterCount > 70) {
      score -= 10;
      analysis.issues.push('Title may be truncated in search results');
    } else if (analysis.characterCount < 30) {
      score -= 5;
      analysis.issues.push('Title might be too short for SEO');
    }

    // Engagement factors
    if (analysis.hasNumber) score += 5;
    if (analysis.hasYear) score += 5;
    if (analysis.hasPowerWord) score += 10;

    // Clamp score
    analysis.seoScore = Math.max(0, Math.min(100, score));
    analysis.rating = analysis.seoScore >= 80 ? 'excellent' :
                      analysis.seoScore >= 60 ? 'good' :
                      analysis.seoScore >= 40 ? 'fair' : 'poor';

    return analysis;
  }

  generateWarnings(titles) {
    const warnings = [];

    // Check for duplicate similar titles
    const titleStarts = titles.map(t => t.title.split(' ').slice(0, 3).join(' '));
    const uniqueStarts = new Set(titleStarts);
    if (uniqueStarts.size < titles.length) {
      warnings.push('Some titles have similar beginnings - consider more variety');
    }

    // Check for truncation issues
    const longTitles = titles.filter(t => t.characterCount > 60);
    if (longTitles.length > 0) {
      warnings.push(`${longTitles.length} title(s) may be truncated in search results`);
    }

    // Check keyword presence
    const noKeyword = titles.filter(t => !t.hasKeyword);
    if (noKeyword.length > 0) {
      warnings.push(`${noKeyword.length} title(s) missing the primary keyword`);
    }

    return warnings;
  }
}

// Start the server
const server = new YTTitleGenerator();
server.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing WebSocket server');
  process.exit(0);
});
