# Canadian Provincial Bills Scraper

A comprehensive web scraping tool for collecting legislative bill information from Canadian provincial legislatures.

## Overview

This project scrapes and aggregates bill information from multiple Canadian provinces including:
- Ontario
- British Columbia  
- Alberta
- Quebec
- Saskatchewan
- Manitoba

## Features

- **Multi-province support**: Scrapes bills from 6 Canadian provinces
- **Asynchronous scraping**: Parallel processing for improved performance
- **Structured data output**: CSV format with consistent schema
- **Error handling**: Robust error handling and logging
- **Extensible architecture**: Easy to add new provinces or data sources

## Project Structure

```
ProvincialScrapy/
├── src/
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── alberta_bills_scraper.py
│   │   ├── bc_bills_scraper.py
│   │   ├── ontario_bills_scraper.py
│   │   ├── quebec_bills_scraper.py
│   │   ├── saskatchewan_bills_scraper.py
│   │   └── manitoba_bills_scraper.py
│   ├── utils/
│   │   ├── __init__.py
│   │   └── data_processor.py
│   └── main.py
├── data/
│   └── .gitkeep
├── requirements.txt
├── .gitignore
├── README.md
└── setup.py
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ProvincialScrapy
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```python
from src.main import CanadianProvincialBillsScraper

scraper = CanadianProvincialBillsScraper()
bills = await scraper.scrape_all_provinces()
scraper.save_to_database()
```

### Command Line

```bash
python src/main.py
```

## Data Schema

Each bill record contains:
- `province`: Province name
- `bill_number`: Legislative bill number
- `title`: Bill title
- `sponsor`: Bill sponsor/author
- `status`: Current legislative status
- `session`: Legislative session
- `bill_url`: URL to bill details
- `scraped_date`: Timestamp of scraping

## Dependencies

- `requests`: HTTP requests
- `beautifulsoup4`: HTML parsing
- `pandas`: Data manipulation
- `aiohttp`: Asynchronous HTTP requests
- `asyncio`: Asynchronous programming support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Status

This project is actively maintained and regularly updated to handle changes in provincial legislative websites.
