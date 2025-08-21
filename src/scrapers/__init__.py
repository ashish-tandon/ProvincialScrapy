"""
Provincial Scrapers Package
Exports all available provincial bill scrapers
"""

from .base_scraper import BaseScraper
from .ontario_enhanced import OntarioEnhancedScraper
from .ontario_bills_scraper import OntarioBillsScraper
from .bc_bills_scraper import BCBillsScraper
from .alberta_bills_scraper import AlbertaBillsScraper
from .quebec_bills_scraper import QuebecBillsScraper
from .saskatchewan_bills_scraper import SaskatchewanBillsScraper
from .manitoba_bills_scraper import ManitobaBillsScraper

# Map of all available scrapers
SCRAPERS = {
    'ontario': OntarioEnhancedScraper,
    'british-columbia': BCBillsScraper,
    'bc': BCBillsScraper,
    'alberta': AlbertaBillsScraper,
    'quebec': QuebecBillsScraper,
    'saskatchewan': SaskatchewanBillsScraper,
    'manitoba': ManitobaBillsScraper,
}

__all__ = [
    'BaseScraper',
    'OntarioEnhancedScraper',
    'OntarioBillsScraper',
    'BCBillsScraper', 
    'AlbertaBillsScraper',
    'QuebecBillsScraper',
    'SaskatchewanBillsScraper',
    'ManitobaBillsScraper',
    'SCRAPERS'
]
