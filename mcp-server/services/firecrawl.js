const axios = require('axios');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'firecrawl' },
  transports: [
    new winston.transports.File({ filename: 'logs/firecrawl.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class FirecrawlService {
  constructor() {
    this.apiKey = process.env.FIRECRAWL_API_KEY;
    this.baseUrl = process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev/v0';
    this.configured = !!this.apiKey;
    
    if (!this.configured) {
      logger.warn('Firecrawl API key not configured');
    }
  }

  isConfigured() {
    return this.configured;
  }

  async scrapeUrl(url, options = {}) {
    if (!this.configured) {
      throw new Error('Firecrawl service not configured');
    }

    try {
      logger.info(`Scraping URL: ${url}`);
      
      const response = await axios.post(
        `${this.baseUrl}/scrape`,
        {
          url,
          pageOptions: {
            waitFor: options.waitFor || 2000,
            screenshot: options.screenshot || false,
            fullPageScreenshot: options.fullPageScreenshot || false,
            includeHtml: true,
            includeMarkdown: true,
            onlyMainContent: options.onlyMainContent !== false
          },
          extractorOptions: {
            mode: 'llm-extraction',
            extractionPrompt: options.extractionPrompt || this.getDefaultExtractionPrompt(),
            extractionSchema: options.extractionSchema || this.getDefaultSchema()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      logger.info(`Successfully scraped ${url}`);
      return response.data;
    } catch (error) {
      logger.error(`Error scraping ${url}:`, error.message);
      
      // If Firecrawl fails, try direct scraping as fallback
      if (options.fallback !== false) {
        return this.fallbackScrape(url);
      }
      
      throw error;
    }
  }

  async fallbackScrape(url) {
    try {
      logger.info(`Attempting fallback scrape for ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });

      return {
        success: true,
        data: {
          html: response.data,
          url: url,
          status: response.status,
          fallback: true
        }
      };
    } catch (error) {
      logger.error(`Fallback scrape failed for ${url}:`, error.message);
      throw error;
    }
  }

  getDefaultExtractionPrompt() {
    return `Extract all bill information from this government webpage. Focus on:
    - Bill numbers and identifiers
    - Bill titles and descriptions
    - Current status (first reading, second reading, committee, royal assent, etc.)
    - Sponsor/introducer information
    - Important dates (introduction, readings, votes)
    - Summary or purpose of the bill
    - Any vote results
    - Committee assignments
    - Related documents or links`;
  }

  getDefaultSchema() {
    return {
      type: 'object',
      properties: {
        bills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              billNumber: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string' },
              sponsor: { type: 'string' },
              introducedDate: { type: 'string' },
              lastActivityDate: { type: 'string' },
              readings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stage: { type: 'string' },
                    date: { type: 'string' },
                    result: { type: 'string' }
                  }
                }
              },
              committee: { type: 'string' },
              voteResults: {
                type: 'object',
                properties: {
                  yeas: { type: 'number' },
                  nays: { type: 'number' },
                  abstentions: { type: 'number' }
                }
              },
              relatedLinks: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    };
  }

  async batchScrape(urls, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 5;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.scrapeUrl(url, options).catch(err => ({
          url,
          error: err.message,
          success: false
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // Province-specific URL configurations
  getProvinceUrls(province) {
    const provinceConfigs = {
      'ontario': {
        billsList: 'https://www.ola.org/en/legislative-business/bills',
        currentSession: 'https://www.ola.org/en/legislative-business/bills/parliament-43',
        api: 'https://www.ola.org/en/legislative-business/bills/data'
      },
      'british-columbia': {
        billsList: 'https://www.leg.bc.ca/parliamentary-business/legislation-debates-proceedings/bills',
        currentSession: 'https://www.leg.bc.ca/parliamentary-business/legislation-debates-proceedings/42nd-parliament-5th-session',
        api: null
      },
      'alberta': {
        billsList: 'https://www.assembly.ab.ca/assembly-business/bills',
        currentSession: 'https://www.assembly.ab.ca/assembly-business/bills/bills-on-the-order-paper',
        api: 'https://www.assembly.ab.ca/net/index.aspx?p=bills_home'
      },
      'quebec': {
        billsList: 'http://www.assnat.qc.ca/en/travaux-parlementaires/projets-loi/projets-loi-43-1.html',
        currentSession: 'http://www.assnat.qc.ca/en/travaux-parlementaires/projets-loi/projets-loi-43-1.html',
        api: null
      },
      'saskatchewan': {
        billsList: 'https://www.legassembly.sk.ca/legislative-business/bills/',
        currentSession: 'https://www.legassembly.sk.ca/legislative-business/bills/',
        api: null
      },
      'manitoba': {
        billsList: 'https://www.gov.mb.ca/legislature/business/bills.html',
        currentSession: 'https://www.gov.mb.ca/legislature/business/sessional_list.html',
        api: null
      },
      'nova-scotia': {
        billsList: 'https://nslegislature.ca/legislative-business/bills-statutes',
        currentSession: 'https://nslegislature.ca/legislative-business/bills-statutes/first-session-64th-general-assembly',
        api: null
      },
      'new-brunswick': {
        billsList: 'https://www.gnb.ca/legis/bill/index-e.asp',
        currentSession: 'https://www.gnb.ca/legis/bill/FILE/60/3/index-e.htm',
        api: null
      },
      'newfoundland': {
        billsList: 'https://www.assembly.nl.ca/Legislation/sr/lists/bills.htm',
        currentSession: 'https://www.assembly.nl.ca/Legislation/sr/lists/bills50.htm',
        api: null
      },
      'prince-edward-island': {
        billsList: 'https://www.assembly.pe.ca/bills',
        currentSession: 'https://www.assembly.pe.ca/bills/session/3/5',
        api: null
      }
    };

    return provinceConfigs[province] || null;
  }
}

// Export singleton instance
module.exports = new FirecrawlService();