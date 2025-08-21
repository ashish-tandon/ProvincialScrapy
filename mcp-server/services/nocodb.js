const axios = require('axios');
const winston = require('winston');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'nocodb' },
  transports: [
    new winston.transports.File({ filename: 'logs/nocodb.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

class NocoDBService {
  constructor() {
    this.baseUrl = process.env.NOCODB_URL || 'http://nocodb:8080';
    this.apiToken = process.env.NOCODB_API_TOKEN;
    this.projectId = null;
    this.tableId = null;
    this.connected = false;
  }

  async initialize() {
    try {
      logger.info('Initializing NocoDB service...');
      
      // Wait for NocoDB to be ready
      await this.waitForNocoDB();
      
      // Get or create project
      await this.ensureProject();
      
      // Ensure bills table exists
      await this.ensureBillsTable();
      
      this.connected = true;
      logger.info('NocoDB service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize NocoDB:', error);
      throw error;
    }
  }

  async waitForNocoDB(retries = 30, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(`${this.baseUrl}/api/v1/health`, {
          timeout: 5000
        });
        
        if (response.status === 200) {
          logger.info('NocoDB is ready');
          return;
        }
      } catch (error) {
        logger.info(`Waiting for NocoDB... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('NocoDB failed to become ready');
  }

  async ensureProject() {
    try {
      // Get existing projects
      const response = await this.apiRequest('GET', '/api/v1/db/meta/projects');
      const projects = response.list || [];
      
      // Look for our project
      let project = projects.find(p => p.title === 'Provincial Bills');
      
      if (!project) {
        // Create new project
        project = await this.apiRequest('POST', '/api/v1/db/meta/projects', {
          title: 'Provincial Bills',
          description: 'Canadian Provincial Bills Database'
        });
        logger.info('Created new project:', project.id);
      }
      
      this.projectId = project.id;
    } catch (error) {
      logger.error('Error ensuring project:', error);
      throw error;
    }
  }

  async ensureBillsTable() {
    try {
      // Get tables in project
      const tables = await this.apiRequest('GET', `/api/v1/db/meta/projects/${this.projectId}/tables`);
      
      // Look for bills table
      let billsTable = tables.find(t => t.table_name === 'bills');
      
      if (!billsTable) {
        // Create bills table
        billsTable = await this.createBillsTable();
        logger.info('Created bills table:', billsTable.id);
      }
      
      this.tableId = billsTable.id;
    } catch (error) {
      logger.error('Error ensuring bills table:', error);
      throw error;
    }
  }

  async createBillsTable() {
    const tableSchema = {
      table_name: 'bills',
      title: 'Bills',
      columns: [
        {
          column_name: 'id',
          title: 'ID',
          dt: 'int',
          pk: true,
          ai: true,
          rqd: true
        },
        {
          column_name: 'province',
          title: 'Province',
          dt: 'varchar',
          dtxp: '100',
          rqd: true
        },
        {
          column_name: 'bill_number',
          title: 'Bill Number',
          dt: 'varchar',
          dtxp: '50',
          rqd: true
        },
        {
          column_name: 'title',
          title: 'Title',
          dt: 'text',
          rqd: true
        },
        {
          column_name: 'description',
          title: 'Description',
          dt: 'text'
        },
        {
          column_name: 'status',
          title: 'Status',
          dt: 'varchar',
          dtxp: '100'
        },
        {
          column_name: 'sponsor',
          title: 'Sponsor',
          dt: 'varchar',
          dtxp: '200'
        },
        {
          column_name: 'introduced_date',
          title: 'Introduced Date',
          dt: 'date'
        },
        {
          column_name: 'last_activity_date',
          title: 'Last Activity Date',
          dt: 'date'
        },
        {
          column_name: 'readings',
          title: 'Readings',
          dt: 'json'
        },
        {
          column_name: 'committee',
          title: 'Committee',
          dt: 'varchar',
          dtxp: '200'
        },
        {
          column_name: 'vote_results',
          title: 'Vote Results',
          dt: 'json'
        },
        {
          column_name: 'source_url',
          title: 'Source URL',
          dt: 'varchar',
          dtxp: '500'
        },
        {
          column_name: 'related_links',
          title: 'Related Links',
          dt: 'json'
        },
        {
          column_name: 'scraped_date',
          title: 'Scraped Date',
          dt: 'datetime',
          rqd: true
        },
        {
          column_name: 'updated_at',
          title: 'Updated At',
          dt: 'datetime',
          au: true
        }
      ]
    };

    return await this.apiRequest('POST', `/api/v1/db/meta/projects/${this.projectId}/tables`, tableSchema);
  }

  async apiRequest(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'xc-auth': this.apiToken,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`API request failed: ${method} ${endpoint}`, error.response?.data || error.message);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }

  async saveBill(billData) {
    try {
      // Check if bill already exists
      const existingBill = await this.findBill(billData.province, billData.bill_number);
      
      if (existingBill) {
        // Update existing bill
        return await this.updateBill(existingBill.id, billData);
      } else {
        // Create new bill
        return await this.createBill(billData);
      }
    } catch (error) {
      logger.error('Error saving bill:', error);
      throw error;
    }
  }

  async findBill(province, billNumber) {
    try {
      const response = await this.apiRequest('GET', `/api/v1/db/data/noco/${this.projectId}/bills`, {
        where: `(province,eq,${province})~and(bill_number,eq,${billNumber})`,
        limit: 1
      });
      
      return response.list?.[0] || null;
    } catch (error) {
      logger.error('Error finding bill:', error);
      return null;
    }
  }

  async createBill(billData) {
    return await this.apiRequest('POST', `/api/v1/db/data/noco/${this.projectId}/bills`, {
      ...billData,
      scraped_date: new Date().toISOString()
    });
  }

  async updateBill(id, billData) {
    return await this.apiRequest('PATCH', `/api/v1/db/data/noco/${this.projectId}/bills/${id}`, {
      ...billData,
      updated_at: new Date().toISOString()
    });
  }

  async getBills(options = {}) {
    const { province, status, limit = 50, offset = 0 } = options;
    
    let where = [];
    if (province) where.push(`(province,eq,${province})`);
    if (status) where.push(`(status,eq,${status})`);
    
    const params = {
      limit,
      offset,
      sort: '-last_activity_date'
    };
    
    if (where.length > 0) {
      params.where = where.join('~and');
    }
    
    const response = await this.apiRequest('GET', `/api/v1/db/data/noco/${this.projectId}/bills`, params);
    return response.list || [];
  }

  async getBillDetails(province, billNumber) {
    const bill = await this.findBill(province, billNumber);
    return bill;
  }

  async searchBills(options = {}) {
    const { query, province, status, limit = 50 } = options;
    
    let where = [`(title,like,%${query}%)~or(description,like,%${query}%)`];
    if (province) where.push(`(province,eq,${province})`);
    if (status) where.push(`(status,eq,${status})`);
    
    const params = {
      where: where.join('~and'),
      limit,
      sort: '-last_activity_date'
    };
    
    const response = await this.apiRequest('GET', `/api/v1/db/data/noco/${this.projectId}/bills`, params);
    return response.list || [];
  }

  async getStatistics() {
    try {
      const response = await this.apiRequest('GET', `/api/v1/db/data/noco/${this.projectId}/bills`, {
        fields: 'province,status',
        limit: 10000
      });
      
      const bills = response.list || [];
      
      const stats = {
        total: bills.length,
        byProvince: {},
        byStatus: {},
        lastUpdated: new Date().toISOString()
      };
      
      bills.forEach(bill => {
        // Count by province
        stats.byProvince[bill.province] = (stats.byProvince[bill.province] || 0) + 1;
        
        // Count by status
        stats.byStatus[bill.status] = (stats.byStatus[bill.status] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      logger.error('Error getting statistics:', error);
      throw error;
    }
  }

  async saveBillsBatch(bills) {
    const results = {
      created: 0,
      updated: 0,
      failed: 0
    };
    
    for (const bill of bills) {
      try {
        await this.saveBill(bill);
        results.created++;
      } catch (error) {
        logger.error(`Failed to save bill ${bill.province} - ${bill.bill_number}:`, error);
        results.failed++;
      }
    }
    
    return results;
  }
}

// Export singleton instance
module.exports = new NocoDBService();