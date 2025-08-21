"""
Base Scraper Class for Provincial Bills
Provides common functionality and error handling for all province scrapers
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import time
import re
import json
from typing import List, Dict, Optional, Tuple
import logging
from urllib.parse import urljoin, urlparse
import os

# Configure logging
logging.basicConfig(level=logging.INFO)

class BaseScraper:
    """Base class for all provincial bill scrapers"""
    
    def __init__(self, province_name: str):
        self.province_name = province_name
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        self.logger = logging.getLogger(f"{self.province_name}Scraper")
        self.mcp_server_url = os.getenv('MCP_SERVER_URL', 'http://localhost:3001')
        self.bills_data = []
        
    def scrape_current_bills(self) -> List[Dict]:
        """Main method to scrape bills - must be implemented by child classes"""
        raise NotImplementedError("Each province scraper must implement scrape_current_bills()")
        
    def fetch_page(self, url: str, retries: int = 3, delay: int = 2) -> Optional[BeautifulSoup]:
        """Fetch a page with retry logic and error handling"""
        for attempt in range(retries):
            try:
                self.logger.info(f"Fetching {url} (attempt {attempt + 1})")
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                # Handle different encodings
                if 'charset' in response.headers.get('Content-Type', ''):
                    encoding = response.headers['Content-Type'].split('charset=')[-1]
                    response.encoding = encoding
                else:
                    response.encoding = response.apparent_encoding
                
                return BeautifulSoup(response.text, 'html.parser')
                
            except requests.RequestException as e:
                self.logger.error(f"Error fetching {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(delay * (attempt + 1))
                else:
                    return None
                    
    def extract_bill_number(self, text: str) -> str:
        """Extract bill number from text using common patterns"""
        if not text:
            return ""
            
        # Common patterns for bill numbers
        patterns = [
            r'Bill\s+(\d+)',
            r'Bill\s+([A-Z]-?\d+)',
            r'Project\s+de\s+loi\s+(\d+)',  # French
            r'Projet\s+de\s+loi\s+([A-Z]-?\d+)',  # French with letter
            r'^(\d+)$',  # Just numbers
            r'^([A-Z]-?\d+)$',  # Letter and numbers
        ]
        
        text = text.strip()
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
                
        return text  # Return original if no pattern matches
        
    def normalize_status(self, status: str) -> str:
        """Normalize bill status to standard values"""
        if not status:
            return "Unknown"
            
        status_lower = status.lower().strip()
        
        status_map = {
            'first reading': 'First Reading',
            '1st reading': 'First Reading',
            'premiere lecture': 'First Reading',
            'second reading': 'Second Reading',
            '2nd reading': 'Second Reading',
            'deuxieme lecture': 'Second Reading',
            'third reading': 'Third Reading',
            '3rd reading': 'Third Reading',
            'troisieme lecture': 'Third Reading',
            'committee': 'Committee Stage',
            'comite': 'Committee Stage',
            'report stage': 'Report Stage',
            'royal assent': 'Royal Assent',
            'sanction royale': 'Royal Assent',
            'passed': 'Passed',
            'adopte': 'Passed',
            'defeated': 'Defeated',
            'withdrawn': 'Withdrawn',
            'prorogation': 'Prorogued'
        }
        
        for key, value in status_map.items():
            if key in status_lower:
                return value
                
        return status.strip()  # Return original if no mapping found
        
    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse various date formats to ISO format"""
        if not date_str:
            return None
            
        date_str = date_str.strip()
        
        # Common date formats
        date_formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%B %d, %Y',
            '%b %d, %Y',
            '%d %B %Y',
            '%d %b %Y',
            '%Y/%m/%d',
            '%d-%m-%Y',
            '%m-%d-%Y',
            '%d %B, %Y',  # French format
            '%d %b, %Y',
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime('%Y-%m-%d')
            except ValueError:
                continue
                
        # Try parsing with dateutil if available
        try:
            from dateutil import parser
            parsed_date = parser.parse(date_str)
            return parsed_date.strftime('%Y-%m-%d')
        except:
            pass
            
        return None
        
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
            
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove common artifacts
        text = text.replace('\xa0', ' ')  # Non-breaking space
        text = text.replace('\n', ' ')
        text = text.replace('\r', ' ')
        text = text.replace('\t', ' ')
        
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
        
    def extract_links(self, element, base_url: str) -> List[str]:
        """Extract all links from an element"""
        links = []
        if element:
            for link in element.find_all('a', href=True):
                href = link['href']
                # Make absolute URL
                absolute_url = urljoin(base_url, href)
                links.append(absolute_url)
        return links
        
    def create_bill_dict(self, 
                        bill_number: str,
                        title: str,
                        status: str = "",
                        sponsor: str = "",
                        introduced_date: str = None,
                        description: str = "",
                        source_url: str = "",
                        bill_url: str = "",
                        committee: str = "",
                        last_activity_date: str = None,
                        readings: List[Dict] = None,
                        vote_results: Dict = None,
                        related_links: List[str] = None) -> Dict:
        """Create a standardized bill dictionary"""
        
        return {
            'province': self.province_name,
            'bill_number': self.clean_text(bill_number),
            'title': self.clean_text(title),
            'description': self.clean_text(description),
            'status': self.normalize_status(status),
            'sponsor': self.clean_text(sponsor),
            'introduced_date': self.parse_date(introduced_date) if introduced_date else None,
            'last_activity_date': self.parse_date(last_activity_date) if last_activity_date else datetime.now().strftime('%Y-%m-%d'),
            'readings': readings or [],
            'committee': self.clean_text(committee),
            'vote_results': vote_results or {},
            'source_url': source_url,
            'bill_url': bill_url,
            'related_links': related_links or [],
            'scraped_date': datetime.now().isoformat()
        }
        
    def save_to_mcp_server(self, bills: List[Dict]) -> bool:
        """Send scraped bills to MCP server"""
        try:
            if not bills:
                self.logger.warning("No bills to save")
                return False
                
            # Send to MCP server
            response = self.session.post(
                f"{self.mcp_server_url}/api/bills/batch",
                json={
                    'province': self.province_name,
                    'bills': bills,
                    'scraped_date': datetime.now().isoformat()
                },
                timeout=30
            )
            
            if response.status_code == 200:
                self.logger.info(f"Successfully saved {len(bills)} bills to MCP server")
                return True
            else:
                self.logger.error(f"Failed to save bills: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving to MCP server: {e}")
            # Fall back to local save
            return self.save_to_file(bills)
            
    def save_to_file(self, bills: List[Dict]) -> bool:
        """Save bills to local file as backup"""
        try:
            filename = f"{self.province_name.lower()}_bills_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = os.path.join('data', filename)
            
            # Create data directory if it doesn't exist
            os.makedirs('data', exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(bills, f, indent=2, ensure_ascii=False)
                
            self.logger.info(f"Saved {len(bills)} bills to {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error saving to file: {e}")
            return False
            
    def run(self) -> Tuple[List[Dict], bool]:
        """Run the scraper and return results"""
        try:
            self.logger.info(f"Starting scrape for {self.province_name}")
            
            # Scrape bills
            bills = self.scrape_current_bills()
            
            if not bills:
                self.logger.warning(f"No bills found for {self.province_name}")
                return [], False
                
            self.logger.info(f"Found {len(bills)} bills for {self.province_name}")
            
            # Save to MCP server or file
            success = self.save_to_mcp_server(bills)
            
            return bills, success
            
        except Exception as e:
            self.logger.error(f"Fatal error in scraper: {e}")
            return [], False