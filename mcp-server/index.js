const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Queue } = require('bull');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables
dotenv.config();

// Import services and routes
const firecrawlService = require('./services/firecrawl');
const nocodbService = require('./services/nocodb');
const authRoutes = require('./routes/auth');
const scrapingQueue = require('./queues/scraping');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'mcp-server' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      nocodb: nocodbService.isConnected(),
      firecrawl: firecrawlService.isConfigured(),
      redis: scrapingQueue.isConnected()
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Scraping endpoints
app.post('/api/scrape/province/:province', async (req, res) => {
  try {
    const { province } = req.params;
    const { forceRefresh = false } = req.body;
    
    logger.info(`Scraping request for province: ${province}`);
    
    // Add scraping job to queue
    const job = await scrapingQueue.addScrapeJob({
      province,
      forceRefresh,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      jobId: job.id,
      message: `Scraping job queued for ${province}`
    });
  } catch (error) {
    logger.error('Error queuing scrape job:', error);
    res.status(500).json({ error: 'Failed to queue scraping job' });
  }
});

// Scrape all provinces
app.post('/api/scrape/all', async (req, res) => {
  try {
    const provinces = [
      'ontario', 'british-columbia', 'alberta', 'quebec', 
      'saskatchewan', 'manitoba', 'nova-scotia', 'new-brunswick',
      'newfoundland', 'prince-edward-island', 'northwest-territories',
      'yukon', 'nunavut'
    ];
    
    const jobs = [];
    for (const province of provinces) {
      const job = await scrapingQueue.addScrapeJob({
        province,
        forceRefresh: req.body.forceRefresh || false,
        timestamp: new Date().toISOString()
      });
      jobs.push({ province, jobId: job.id });
    }
    
    res.json({
      success: true,
      jobs,
      message: 'Scraping jobs queued for all provinces'
    });
  } catch (error) {
    logger.error('Error queuing scrape jobs:', error);
    res.status(500).json({ error: 'Failed to queue scraping jobs' });
  }
});

// Get scraping job status
app.get('/api/scrape/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await scrapingQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const state = await job.getState();
    const progress = job.progress();
    
    res.json({
      jobId,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason
    });
  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

// Get bills for a province
app.get('/api/bills/:province', async (req, res) => {
  try {
    const { province } = req.params;
    const { limit = 50, offset = 0, status } = req.query;
    
    const bills = await nocodbService.getBills({
      province,
      limit: parseInt(limit),
      offset: parseInt(offset),
      status
    });
    
    res.json({
      success: true,
      data: bills,
      province,
      count: bills.length
    });
  } catch (error) {
    logger.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get bill details
app.get('/api/bills/:province/:billNumber', async (req, res) => {
  try {
    const { province, billNumber } = req.params;
    
    const bill = await nocodbService.getBillDetails(province, billNumber);
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    logger.error('Error fetching bill details:', error);
    res.status(500).json({ error: 'Failed to fetch bill details' });
  }
});

// Search bills
app.get('/api/search/bills', async (req, res) => {
  try {
    const { q, province, status, limit = 50 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const results = await nocodbService.searchBills({
      query: q,
      province,
      status,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      query: q,
      results,
      count: results.length
    });
  } catch (error) {
    logger.error('Error searching bills:', error);
    res.status(500).json({ error: 'Failed to search bills' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await nocodbService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`MCP Server running on port ${PORT}`);
  
  // Initialize services
  nocodbService.initialize().catch(err => {
    logger.error('Failed to initialize NocoDB service:', err);
  });
  
  scrapingQueue.initialize().catch(err => {
    logger.error('Failed to initialize scraping queue:', err);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await scrapingQueue.close();
  process.exit(0);
});

module.exports = app;