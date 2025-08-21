# Provincial Scrapy 🇨🇦

A comprehensive, production-ready system for scraping and tracking legislative bills across all Canadian provinces and territories. Built with resilience and scalability in mind.

## 🌟 Key Features

- **Complete Provincial Coverage**: Automated scrapers for all Canadian provinces and territories
- **Multiple Scraping Strategies**: Firecrawl API integration with intelligent fallback mechanisms
- **Real-time Dashboard**: Modern Next.js interface for viewing and managing bills
- **Robust Data Pipeline**: Queue-based scraping with retry logic and error handling
- **RESTful API**: Complete API for programmatic access to bill data
- **Advanced Search**: Full-text search across all bills with filtering
- **Automatic Updates**: Scheduled scraping with configurable intervals
- **Data Integrity**: Duplicate detection and data normalization

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js UI    │────▶│  MCP Server  │────▶│   NocoDB    │
└─────────────────┘     └──────┬───────┘     └─────────────┘
                               │                      ▲
                               ▼                      │
                        ┌──────────────┐              │
                        │    Redis     │              │
                        │  Job Queue   │              │
                        └──────┬───────┘              │
                               │                      │
                               ▼                      │
                        ┌──────────────┐              │
                        │   Python     │──────────────┘
                        │  Scrapers    │
                        └──────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **API Server**: Node.js, Express, Bull Queue, Winston logging
- **Database**: NocoDB (SQLite/PostgreSQL compatible)
- **Scrapers**: Python 3.10+, BeautifulSoup4, Custom base classes
- **Queue**: Redis for job management
- **External Services**: Firecrawl API (optional)

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd ProvincialScrapy

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Run initial scraping
docker exec provincial-scrapy-app-dev python src/unified_scraper.py

# Access services
# Frontend: http://localhost:3000
# API: http://localhost:3001
# Database: http://localhost:8080
```

## 📦 Project Structure

```
ProvincialScrapy/
├── frontend/              # Next.js frontend application
│   ├── src/              
│   │   ├── app/          # App router pages
│   │   ├── components/   # Reusable UI components
│   │   └── store/        # State management
│   └── public/           # Static assets
├── mcp-server/           # Node.js API server
│   ├── services/         # Business logic
│   ├── routes/           # API endpoints
│   └── queues/           # Job processing
├── src/                  # Python scrapers
│   ├── scrapers/         # Province-specific scrapers
│   │   ├── base_scraper.py    # Base class with common logic
│   │   └── *_scraper.py       # Province scrapers
│   └── unified_scraper.py     # Main orchestrator
├── data/                 # Scraped data storage
├── nginx/                # Reverse proxy config
└── docker-compose.yml    # Container orchestration
```

## 🔧 Configuration

### Required Environment Variables

```env
# Firecrawl API (optional but recommended)
FIRECRAWL_API_KEY=your-api-key

# Database
NOCODB_API_TOKEN=your-token

# Security
JWT_SECRET=your-secret-key

# Redis (if external)
REDIS_HOST=redis
REDIS_PORT=6379
```

### Supported Provinces

- ✅ Ontario (Enhanced)
- ✅ British Columbia
- ✅ Alberta
- ✅ Quebec
- ✅ Saskatchewan
- ✅ Manitoba
- 🔄 Nova Scotia (in progress)
- 🔄 New Brunswick (in progress)
- 🔄 Newfoundland and Labrador (in progress)
- 🔄 Prince Edward Island (in progress)
- 🔄 Northwest Territories (planned)
- 🔄 Yukon (planned)
- 🔄 Nunavut (planned)

## 📊 API Endpoints

### Scraping Operations
- `POST /api/scrape/all` - Trigger scraping for all provinces
- `POST /api/scrape/province/:province` - Scrape specific province
- `GET /api/scrape/status/:jobId` - Check scraping job status

### Data Access
- `GET /api/bills/:province` - Get bills by province
- `GET /api/bills/:province/:billNumber` - Get specific bill details
- `GET /api/search/bills?q=keyword` - Search across all bills
- `GET /api/stats` - Get system statistics

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

## 🛠 Development

### Adding New Province Scrapers

1. Create new file in `src/scrapers/`
2. Inherit from `BaseScraper`
3. Implement `scrape_current_bills()` method
4. Register in `src/scrapers/__init__.py`

Example:
```python
from .base_scraper import BaseScraper

class YukonScraper(BaseScraper):
    def __init__(self):
        super().__init__("Yukon")
        self.base_url = "https://yukonassembly.ca"
        
    def scrape_current_bills(self):
        # Implementation
        pass
```

### Running Tests

```bash
# All tests
docker exec provincial-scrapy-app-dev pytest

# Specific scraper
docker exec provincial-scrapy-app-dev pytest tests/test_ontario_scraper.py
```

## 🚀 Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Set up cron for regular scraping
0 */6 * * * cd /app && docker exec app python src/unified_scraper.py
```

## 📈 Monitoring

- Health endpoint: `GET /health`
- Logs: `docker-compose logs -f [service-name]`
- Database admin: http://localhost:8080

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Firecrawl](https://firecrawl.dev) for intelligent web scraping
- [NocoDB](https://nocodb.com) for the database layer
- All provincial legislature websites for public data access

## 📞 Support

- 📧 Create an issue for bugs or feature requests
- 📖 See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for detailed setup
- 💬 Join discussions in the Issues section
