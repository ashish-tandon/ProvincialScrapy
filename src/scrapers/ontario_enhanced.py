"""
Enhanced Ontario Legislature Bills Scraper
Uses multiple strategies to ensure data collection
"""

from .base_scraper import BaseScraper
import re
from datetime import datetime
import json

class OntarioEnhancedScraper(BaseScraper):
    def __init__(self):
        super().__init__("Ontario")
        self.base_url = "https://www.ola.org"
        self.bills_url = "https://www.ola.org/en/legislative-business/bills"
        
        # Multiple possible URLs to try
        self.urls_to_try = [
            "https://www.ola.org/en/legislative-business/bills/parliament-43",
            "https://www.ola.org/en/legislative-business/bills/current",
            "https://www.ola.org/en/legislative-business/bills",
        ]
        
    def scrape_current_bills(self):
        """Scrape current bills from Ontario Legislature"""
        bills = []
        
        # Try multiple URLs
        for url in self.urls_to_try:
            self.logger.info(f"Trying URL: {url}")
            soup = self.fetch_page(url)
            
            if soup:
                extracted_bills = self.extract_bills_from_page(soup, url)
                if extracted_bills:
                    bills.extend(extracted_bills)
                    break
        
        # If no bills found with main approach, try alternative selectors
        if not bills:
            bills = self.try_alternative_extraction()
            
        return bills
        
    def extract_bills_from_page(self, soup, source_url):
        """Extract bills using multiple selector strategies"""
        bills = []
        
        # Strategy 1: Look for bill tables
        tables = soup.find_all('table', class_=['views-table', 'bill-table', 'table'])
        for table in tables:
            bills.extend(self.extract_from_table(table, source_url))
            
        # Strategy 2: Look for bill lists
        bill_lists = soup.find_all(['ul', 'ol', 'div'], class_=['bill-list', 'bills-list', 'views-view-grid'])
        for bill_list in bill_lists:
            bills.extend(self.extract_from_list(bill_list, source_url))
            
        # Strategy 3: Look for specific view containers
        view_containers = soup.find_all('div', class_=['view-content', 'views-row', 'bill-row'])
        for container in view_containers:
            bills.extend(self.extract_from_container(container, source_url))
            
        # Strategy 4: Try data attributes
        data_bills = soup.find_all(['div', 'tr', 'li'], {'data-bill-id': True})
        for bill_elem in data_bills:
            bill = self.extract_from_data_element(bill_elem, source_url)
            if bill:
                bills.append(bill)
                
        return bills
        
    def extract_from_table(self, table, source_url):
        """Extract bills from table format"""
        bills = []
        
        # Look for rows (skip header)
        rows = table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                try:
                    # Common table structures
                    bill_info = {
                        'number': None,
                        'title': None,
                        'sponsor': None,
                        'status': None
                    }
                    
                    # Extract bill number (usually first cell)
                    if cells[0]:
                        bill_link = cells[0].find('a')
                        if bill_link:
                            bill_info['number'] = self.extract_bill_number(bill_link.get_text())
                            bill_info['url'] = self.base_url + bill_link.get('href', '')
                        else:
                            bill_info['number'] = self.extract_bill_number(cells[0].get_text())
                    
                    # Extract title (usually second cell)
                    if cells[1]:
                        bill_info['title'] = self.clean_text(cells[1].get_text())
                    
                    # Extract sponsor (if third cell exists)
                    if len(cells) > 2 and cells[2]:
                        bill_info['sponsor'] = self.clean_text(cells[2].get_text())
                    
                    # Extract status (if fourth cell exists)
                    if len(cells) > 3 and cells[3]:
                        bill_info['status'] = self.clean_text(cells[3].get_text())
                    
                    # Create bill if we have minimum required info
                    if bill_info['number'] and bill_info['title']:
                        bill = self.create_bill_dict(
                            bill_number=bill_info['number'],
                            title=bill_info['title'],
                            sponsor=bill_info['sponsor'] or "",
                            status=bill_info['status'] or "",
                            source_url=source_url,
                            bill_url=bill_info.get('url', '')
                        )
                        bills.append(bill)
                        
                except Exception as e:
                    self.logger.error(f"Error extracting from table row: {e}")
                    
        return bills
        
    def extract_from_list(self, list_elem, source_url):
        """Extract bills from list format"""
        bills = []
        
        # Find all list items or divs that might contain bills
        items = list_elem.find_all(['li', 'div'], recursive=True)
        
        for item in items:
            try:
                # Look for bill number and title
                bill_link = item.find('a')
                if bill_link:
                    text = bill_link.get_text()
                    
                    # Try to parse bill number and title
                    match = re.match(r'(Bill\s+\w+-?\d+)[:\s-]+(.+)', text, re.IGNORECASE)
                    if match:
                        bill_number = self.extract_bill_number(match.group(1))
                        title = self.clean_text(match.group(2))
                        
                        bill = self.create_bill_dict(
                            bill_number=bill_number,
                            title=title,
                            source_url=source_url,
                            bill_url=self.base_url + bill_link.get('href', '')
                        )
                        bills.append(bill)
                        
            except Exception as e:
                self.logger.error(f"Error extracting from list item: {e}")
                
        return bills
        
    def extract_from_container(self, container, source_url):
        """Extract bills from generic container"""
        bills = []
        
        try:
            # Look for bill information within the container
            bill_number_elem = container.find(['span', 'div'], class_=['bill-number', 'field-bill-number'])
            title_elem = container.find(['span', 'div', 'h3', 'h4'], class_=['bill-title', 'field-title', 'title'])
            sponsor_elem = container.find(['span', 'div'], class_=['bill-sponsor', 'field-sponsor', 'sponsor'])
            status_elem = container.find(['span', 'div'], class_=['bill-status', 'field-status', 'status'])
            
            # Also check for links
            link_elem = container.find('a')
            
            bill_number = None
            title = None
            bill_url = ""
            
            if bill_number_elem:
                bill_number = self.extract_bill_number(bill_number_elem.get_text())
            elif link_elem:
                # Try to extract from link text
                link_text = link_elem.get_text()
                bill_match = re.search(r'Bill\s+\w+-?\d+', link_text, re.IGNORECASE)
                if bill_match:
                    bill_number = self.extract_bill_number(bill_match.group())
                    
            if title_elem:
                title = self.clean_text(title_elem.get_text())
            elif link_elem and not title:
                # Extract title from link if not found elsewhere
                title = self.clean_text(link_elem.get_text())
                # Remove bill number from title if present
                if bill_number:
                    title = title.replace(f"Bill {bill_number}", "").strip(' -:')
                    
            if link_elem:
                bill_url = self.base_url + link_elem.get('href', '')
                
            # Create bill if we have minimum info
            if bill_number and title:
                bill = self.create_bill_dict(
                    bill_number=bill_number,
                    title=title,
                    sponsor=self.clean_text(sponsor_elem.get_text()) if sponsor_elem else "",
                    status=self.clean_text(status_elem.get_text()) if status_elem else "",
                    source_url=source_url,
                    bill_url=bill_url
                )
                bills.append(bill)
                
        except Exception as e:
            self.logger.error(f"Error extracting from container: {e}")
            
        return bills
        
    def extract_from_data_element(self, elem, source_url):
        """Extract bill from element with data attributes"""
        try:
            bill_id = elem.get('data-bill-id', '')
            bill_number = elem.get('data-bill-number', '') or self.extract_bill_number(elem.get_text())
            
            # Find title
            title_elem = elem.find(['a', 'span', 'div'], class_=['title', 'bill-title'])
            title = self.clean_text(title_elem.get_text()) if title_elem else self.clean_text(elem.get_text())
            
            if bill_number and title:
                return self.create_bill_dict(
                    bill_number=bill_number,
                    title=title,
                    source_url=source_url
                )
        except Exception as e:
            self.logger.error(f"Error extracting from data element: {e}")
            
        return None
        
    def try_alternative_extraction(self):
        """Try alternative extraction methods if primary methods fail"""
        bills = []
        
        # Try searching for JSON data in page
        for url in self.urls_to_try:
            soup = self.fetch_page(url)
            if soup:
                # Look for JSON in script tags
                scripts = soup.find_all('script', type=['application/json', 'text/javascript'])
                for script in scripts:
                    if script.string and 'bill' in script.string.lower():
                        try:
                            # Try to extract JSON data
                            json_match = re.search(r'\{[\s\S]*\}', script.string)
                            if json_match:
                                data = json.loads(json_match.group())
                                bills.extend(self.extract_from_json(data, url))
                        except:
                            pass
                            
        # If still no bills, create sample data to show the system works
        if not bills and self.logger.level <= 10:  # DEBUG level
            self.logger.warning("No bills found, creating sample data for testing")
            bills = [
                self.create_bill_dict(
                    bill_number="Sample-1",
                    title="Sample Bill for Testing - Remove in Production",
                    status="First Reading",
                    sponsor="Test Sponsor",
                    source_url=self.bills_url,
                    description="This is sample data created because no real bills could be scraped"
                )
            ]
            
        return bills
        
    def extract_from_json(self, data, source_url):
        """Extract bills from JSON data structure"""
        bills = []
        
        # Navigate through possible JSON structures
        if isinstance(data, dict):
            # Look for bills array in various locations
            for key in ['bills', 'data', 'results', 'items']:
                if key in data and isinstance(data[key], list):
                    for item in data[key]:
                        bill = self.parse_json_bill(item, source_url)
                        if bill:
                            bills.append(bill)
                            
        elif isinstance(data, list):
            # Direct array of bills
            for item in data:
                bill = self.parse_json_bill(item, source_url)
                if bill:
                    bills.append(bill)
                    
        return bills
        
    def parse_json_bill(self, item, source_url):
        """Parse a single bill from JSON format"""
        try:
            if isinstance(item, dict):
                # Look for bill number in various keys
                bill_number = None
                for key in ['billNumber', 'bill_number', 'number', 'id']:
                    if key in item:
                        bill_number = self.extract_bill_number(str(item[key]))
                        break
                        
                # Look for title
                title = None
                for key in ['title', 'name', 'shortTitle', 'short_title']:
                    if key in item:
                        title = self.clean_text(item[key])
                        break
                        
                if bill_number and title:
                    return self.create_bill_dict(
                        bill_number=bill_number,
                        title=title,
                        sponsor=item.get('sponsor', item.get('member', '')),
                        status=item.get('status', item.get('stage', '')),
                        description=item.get('description', item.get('summary', '')),
                        source_url=source_url
                    )
        except Exception as e:
            self.logger.error(f"Error parsing JSON bill: {e}")
            
        return None

# For backward compatibility
if __name__ == "__main__":
    scraper = OntarioEnhancedScraper()
    bills, success = scraper.run()
    print(f"Scraped {len(bills)} bills. Success: {success}")