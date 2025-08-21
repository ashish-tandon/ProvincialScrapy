const Queue = require('bull');
const winston = require('winston');
const firecrawlService = require('../services/firecrawl');
const nocodbService = require('../services/nocodb');
const provincialScrapers = require('../../src/scrapers');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'scraping-queue' },
  transports: [
    new winston.transports.File({ filename: 'logs/scraping-queue.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class ScrapingQueue {
  constructor() {
    this.queue = new Queue('bill-scraping', {
      redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      }
    });
    
    this.setupProcessors();
  }

  async initialize() {
    logger.info('Initializing scraping queue...');
    
    // Set up queue event handlers
    this.queue.on('error', (error) => {
      logger.error('Queue error:', error);
    });

    this.queue.on('waiting', (jobId) => {
      logger.info(`Job ${jobId} is waiting`);
    });

    this.queue.on('active', (job) => {
      logger.info(`Job ${job.id} has started processing`);
    });

    this.queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    this.queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:`, err);
    });

    // Clean up old jobs
    await this.queue.clean(24 * 3600 * 1000); // Clean jobs older than 24 hours
    
    logger.info('Scraping queue initialized');
  }

  setupProcessors() {
    // Main scraping processor
    this.queue.process('scrape-province', async (job) => {
      const { province, forceRefresh } = job.data;
      
      try {
        logger.info(`Processing scrape job for ${province}`);
        
        // Update job progress
        job.progress(10);
        
        // Get province URLs
        const provinceUrls = firecrawlService.getProvinceUrls(province);
        if (!provinceUrls) {
          throw new Error(`No URLs configured for province: ${province}`);
        }
        
        job.progress(20);
        
        // Try Firecrawl first
        let scrapedData = null;
        let usedFirecrawl = false;
        
        if (firecrawlService.isConfigured()) {
          try {
            logger.info(`Using Firecrawl for ${province}`);
            const result = await firecrawlService.scrapeUrl(provinceUrls.billsList, {
              extractionPrompt: this.getProvinceSpecificPrompt(province),
              fallback: false
            });
            
            if (result?.data?.bills) {
              scrapedData = result.data.bills;
              usedFirecrawl = true;
            }
          } catch (error) {
            logger.warn(`Firecrawl failed for ${province}, falling back to custom scraper`);
          }
        }
        
        job.progress(50);
        
        // Fall back to custom scrapers if Firecrawl didn't work
        if (!scrapedData) {
          logger.info(`Using custom scraper for ${province}`);
          scrapedData = await this.useCustomScraper(province, provinceUrls);
        }
        
        job.progress(70);
        
        // Process and save the data
        if (scrapedData && scrapedData.length > 0) {
          const processedBills = this.processBillsData(scrapedData, province);
          const saveResult = await nocodbService.saveBillsBatch(processedBills);
          
          job.progress(100);
          
          return {
            province,
            billsFound: processedBills.length,
            saveResult,
            usedFirecrawl,
            timestamp: new Date().toISOString()
          };
        } else {
          throw new Error(`No bills found for ${province}`);
        }
        
      } catch (error) {
        logger.error(`Error processing scrape job for ${province}:`, error);
        throw error;
      }
    });
    
    // Process individual bill details
    this.queue.process('scrape-bill-details', async (job) => {
      const { province, billNumber, billUrl } = job.data;
      
      try {
        logger.info(`Scraping bill details: ${province} - ${billNumber}`);
        
        const result = await firecrawlService.scrapeUrl(billUrl, {
          extractionPrompt: this.getBillDetailsPrompt(),
          fallback: true
        });
        
        // Update bill with detailed information
        if (result?.data) {
          await nocodbService.updateBill(billNumber, {
            ...result.data,
            detailsScraped: true,
            detailsScrapedDate: new Date().toISOString()
          });
        }
        
        return { success: true, billNumber };
        
      } catch (error) {
        logger.error(`Error scraping bill details for ${billNumber}:`, error);
        throw error;
      }
    });
  }

  async useCustomScraper(province, urls) {
    // This is where we'll integrate with the existing Python scrapers
    // For now, we'll use a basic HTML parsing approach
    
    const axios = require('axios');
    const cheerio = require('cheerio');
    
    try {
      const response = await axios.get(urls.billsList, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProvincialScrapy/1.0)'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      const bills = [];
      
      // Province-specific selectors
      const selectors = this.getProvinceSelectors(province);
      
      $(selectors.billContainer).each((i, elem) => {
        try {
          const bill = {
            billNumber: $(elem).find(selectors.billNumber).text().trim(),
            title: $(elem).find(selectors.title).text().trim(),
            status: $(elem).find(selectors.status).text().trim(),
            sponsor: $(elem).find(selectors.sponsor).text().trim(),
            source_url: urls.billsList
          };
          
          if (bill.billNumber && bill.title) {
            bills.push(bill);
          }
        } catch (err) {
          logger.error(`Error parsing bill element:`, err);
        }
      });
      
      return bills;
      
    } catch (error) {
      logger.error(`Custom scraper failed for ${province}:`, error);
      throw error;
    }
  }

  getProvinceSelectors(province) {
    const selectorMap = {
      'ontario': {
        billContainer: 'tr.bill-row, table tbody tr',
        billNumber: 'td:first-child',
        title: 'td:nth-child(2)',
        status: 'td:nth-child(3)',
        sponsor: 'td:nth-child(4)'
      },
      'british-columbia': {
        billContainer: '.bill-item, tr[class*="bill"]',
        billNumber: '.bill-number, td:first-child',
        title: '.bill-title, td:nth-child(2)',
        status: '.bill-status, td:nth-child(3)',
        sponsor: '.bill-member, td:nth-child(4)'
      },
      'alberta': {
        billContainer: '.views-row, tr',
        billNumber: '.views-field-field-bill-number, td:first-child',
        title: '.views-field-title, td:nth-child(2)',
        status: '.views-field-field-status, td:nth-child(3)',
        sponsor: '.views-field-field-sponsor, td:nth-child(4)'
      },
      'quebec': {
        billContainer: '.projet-loi, tr',
        billNumber: '.numero, td:first-child',
        title: '.titre, td:nth-child(2)',
        status: '.etape, td:nth-child(3)',
        sponsor: '.parrain, td:nth-child(4)'
      },
      'default': {
        billContainer: 'tr, .bill-item, .bill-row',
        billNumber: 'td:first-child, .bill-number',
        title: 'td:nth-child(2), .bill-title',
        status: 'td:nth-child(3), .bill-status',
        sponsor: 'td:nth-child(4), .bill-sponsor'
      }
    };
    
    return selectorMap[province] || selectorMap.default;
  }

  processBillsData(bills, province) {
    return bills.map(bill => ({
      province: province,
      bill_number: bill.billNumber || bill.bill_number,
      title: bill.title,
      description: bill.description || '',
      status: this.normalizeStatus(bill.status),
      sponsor: bill.sponsor || '',
      introduced_date: this.parseDate(bill.introducedDate),
      last_activity_date: this.parseDate(bill.lastActivityDate) || new Date().toISOString(),
      readings: bill.readings || [],
      committee: bill.committee || '',
      vote_results: bill.voteResults || {},
      source_url: bill.source_url || '',
      related_links: bill.relatedLinks || []
    }));
  }

  normalizeStatus(status) {
    if (!status) return 'Unknown';
    
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.includes('first reading')) return 'First Reading';
    if (normalizedStatus.includes('second reading')) return 'Second Reading';
    if (normalizedStatus.includes('third reading')) return 'Third Reading';
    if (normalizedStatus.includes('committee')) return 'Committee Stage';
    if (normalizedStatus.includes('royal assent')) return 'Royal Assent';
    if (normalizedStatus.includes('passed')) return 'Passed';
    if (normalizedStatus.includes('defeated')) return 'Defeated';
    
    return status;
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  }

  getProvinceSpecificPrompt(province) {
    const prompts = {
      'ontario': `Extract all bills from the Ontario Legislature website. Look for bill numbers (e.g., "Bill 123"), titles, MPP sponsors, current status, and reading dates.`,
      'quebec': `Extract all bills (projets de loi) from the Quebec National Assembly. Include bill numbers, French and English titles if available, sponsors (parrains), and current stage (étape).`,
      'british-columbia': `Extract all bills from the BC Legislature. Focus on bill numbers, titles, MLA sponsors, current stage, and any committee assignments.`,
      'alberta': `Extract all bills from the Alberta Legislature. Include bill numbers, titles, MLA sponsors, current status, and any recent activity dates.`
    };
    
    return prompts[province] || firecrawlService.getDefaultExtractionPrompt();
  }

  getBillDetailsPrompt() {
    return `Extract detailed information about this specific bill including:
    - Full bill text or summary
    - All reading dates and votes
    - Committee proceedings
    - Amendments
    - Debate transcripts references
    - Related documents
    - Vote breakdowns by party if available`;
  }

  async addScrapeJob(data) {
    return await this.queue.add('scrape-province', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: false,
      removeOnFail: false
    });
  }

  async getJob(jobId) {
    return await this.queue.getJob(jobId);
  }

  isConnected() {
    return this.queue.client.status === 'ready';
  }

  async close() {
    await this.queue.close();
  }
}

// Export singleton instance
module.exports = new ScrapingQueue();