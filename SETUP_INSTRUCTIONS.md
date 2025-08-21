# Provincial Scrapy - Setup Instructions

## Overview

Provincial Scrapy is a comprehensive system for scraping legislative bill data from all Canadian provinces and territories. The system uses multiple strategies including Firecrawl API integration and custom scrapers to ensure reliable data collection.

## Architecture

- **Python Scrapers**: Custom scrapers for each province with fallback mechanisms
- **MCP Server**: Node.js server that orchestrates scraping jobs and integrates with Firecrawl
- **NocoDB**: Database for storing bill information
- **Redis**: Queue management for scraping jobs
- **Frontend**: Next.js dashboard for viewing and managing bills

## Prerequisites

- Docker and Docker Compose
- Python 3.10+ (for local development)
- Node.js 18+ (for local development)
- Firecrawl API key (optional but recommended)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ProvincialScrapy
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Wait for services to initialize**
   ```bash
   # Check health status
   docker-compose -f docker-compose.dev.yml ps
   
   # View logs
   docker-compose -f docker-compose.dev.yml logs -f
   ```

5. **Run initial scraping**
   ```bash
   # Scrape all provinces
   docker exec provincial-scrapy-app-dev python src/unified_scraper.py
   
   # Scrape specific provinces
   docker exec provincial-scrapy-app-dev python src/unified_scraper.py --provinces ontario quebec
   ```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Firecrawl Configuration (optional but recommended)
FIRECRAWL_API_KEY=your-firecrawl-api-key

# NocoDB Configuration
NOCODB_API_TOKEN=your-nocodb-token

# JWT Secret for Authentication
JWT_SECRET=your-secure-jwt-secret

# Redis Configuration (if using external Redis)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Firecrawl Setup

1. Sign up at [Firecrawl.dev](https://firecrawl.dev)
2. Get your API key
3. Add it to your `.env` file

Without Firecrawl, the system will use fallback HTML scrapers which may be less reliable.

## Services

### 1. NocoDB (Port 8080)

Database interface accessible at http://localhost:8080

- Default credentials are set during first run
- Tables are automatically created
- Access the admin panel to view/manage data

### 2. MCP Server (Port 3001)

API server for managing scraping jobs

- Health check: http://localhost:3001/health
- API documentation: http://localhost:3001/api-docs

### 3. Frontend (Port 3000)

Next.js dashboard at http://localhost:3000

- View bills by province
- Search functionality
- Real-time scraping status

### 4. Redis (Port 6379)

Job queue and caching

## Running Scrapers

### Using MCP Server (Recommended)

```bash
# Trigger scraping via API
curl -X POST http://localhost:3001/api/scrape/all

# Check job status
curl http://localhost:3001/api/scrape/status/{jobId}
```

### Direct Python Execution

```bash
# Run unified scraper
python src/unified_scraper.py

# Run specific province
python src/scrapers/ontario_enhanced.py

# Run with debug logging
python src/unified_scraper.py --debug
```

## Development

### Adding New Province Scrapers

1. Create new scraper in `src/scrapers/`
2. Inherit from `BaseScraper`
3. Implement `scrape_current_bills()` method
4. Add to `SCRAPERS` dict in `__init__.py`

Example:

```python
from .base_scraper import BaseScraper

class NewProvinceScraper(BaseScraper):
    def __init__(self):
        super().__init__("New Province")
        self.base_url = "https://legislature.newprovince.ca"
        
    def scrape_current_bills(self):
        bills = []
        soup = self.fetch_page(self.base_url)
        # Implementation here
        return bills
```

### Testing Scrapers

```bash
# Run tests
docker exec provincial-scrapy-app-dev pytest

# Test specific scraper
docker exec provincial-scrapy-app-dev python -m pytest tests/test_ontario_scraper.py
```

## Troubleshooting

### Common Issues

1. **No bills found**
   - Check if websites have changed structure
   - Verify Firecrawl API key is valid
   - Check logs: `docker-compose logs scraper-app`

2. **Database connection errors**
   - Ensure NocoDB is running: `docker-compose ps`
   - Check NocoDB logs: `docker-compose logs nocodb`
   - Verify API token is correct

3. **MCP Server not responding**
   - Check health endpoint
   - Verify Redis is running
   - Check for port conflicts

### Debug Mode

Enable debug logging:

```bash
# In docker-compose.dev.yml
environment:
  - LOG_LEVEL=DEBUG

# Or when running directly
python src/unified_scraper.py --debug
```

## Production Deployment

1. **Use production docker-compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Set secure environment variables**
   - Generate strong JWT_SECRET
   - Use production database
   - Enable HTTPS

3. **Set up monitoring**
   - Configure health checks
   - Set up log aggregation
   - Monitor scraping success rates

4. **Schedule regular scraping**
   ```bash
   # Add to crontab
   0 */6 * * * cd /path/to/project && docker exec provincial-scrapy-app python src/unified_scraper.py
   ```

## API Endpoints

### MCP Server API

- `GET /health` - Health check
- `POST /api/scrape/all` - Scrape all provinces
- `POST /api/scrape/province/:province` - Scrape specific province
- `GET /api/scrape/status/:jobId` - Check job status
- `GET /api/bills/:province` - Get bills for province
- `GET /api/search/bills?q=keyword` - Search bills
- `GET /api/stats` - Get statistics

### Authentication

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","name":"User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Maintenance

### Backup Database

```bash
# Backup NocoDB data
docker exec provincial-scrapy-nocodb-dev sqlite3 /usr/app/data/nocodb.db ".backup /usr/app/data/backup.db"

# Copy to host
docker cp provincial-scrapy-nocodb-dev:/usr/app/data/backup.db ./backups/
```

### Update Scrapers

1. Test changes locally
2. Update scraper code
3. Rebuild containers: `docker-compose build`
4. Deploy updates: `docker-compose up -d`

## Support

For issues or questions:

1. Check logs first
2. Review troubleshooting section
3. Check if website structures have changed
4. Create an issue with:
   - Error messages
   - Logs
   - Steps to reproduce