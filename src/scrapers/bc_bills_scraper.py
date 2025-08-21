"""
British Columbia Legislature Bills Scraper
"""

from .base_scraper import BaseScraper
import re

class BCBillsScraper(BaseScraper):
    def __init__(self):
        super().__init__("British Columbia")
        self.base_url = "https://www.leg.bc.ca"
        self.bills_urls = [
            "https://www.leg.bc.ca/parliamentary-business/legislation-debates-proceedings/42nd-parliament-5th-session/bills/progress",
            "https://www.leg.bc.ca/parliamentary-business/legislation-debates-proceedings/bills",
            "https://www.leg.bc.ca/bills"
        ]
        
    def scrape_current_bills(self):
        """Scrape current bills from BC Legislature"""
        bills = []
        
        for url in self.bills_urls:
            self.logger.info(f"Trying BC URL: {url}")
            soup = self.fetch_page(url)
            
            if soup:
                # Try multiple extraction methods
                bills.extend(self.extract_from_progress_table(soup, url))
                bills.extend(self.extract_from_bills_list(soup, url))
                
                if bills:
                    break
                    
        # Remove duplicates based on bill number
        seen = set()
        unique_bills = []
        for bill in bills:
            if bill['bill_number'] not in seen:
                seen.add(bill['bill_number'])
                unique_bills.append(bill)
                
        return unique_bills
        
    def extract_from_progress_table(self, soup, source_url):
        """Extract bills from progress table format"""
        bills = []
        
        # Look for progress tables
        tables = soup.find_all('table', class_=['table-bills-progress', 'bills-table', 'table'])
        
        for table in tables:
            rows = table.find_all('tr')
            
            for row in rows[1:]:  # Skip header
                cells = row.find_all(['td', 'th'])
                
                if len(cells) >= 3:
                    try:
                        # BC specific format
                        bill_cell = cells[0]
                        title_cell = cells[1]
                        member_cell = cells[2] if len(cells) > 2 else None
                        status_cell = cells[3] if len(cells) > 3 else None
                        
                        # Extract bill number
                        bill_link = bill_cell.find('a')
                        if bill_link:
                            bill_text = bill_link.get_text()
                            bill_number = self.extract_bill_number(bill_text)
                            bill_url = self.base_url + bill_link.get('href', '')
                        else:
                            bill_number = self.extract_bill_number(bill_cell.get_text())
                            bill_url = ""
                            
                        # Extract title
                        title = self.clean_text(title_cell.get_text())
                        
                        # Extract member/sponsor
                        sponsor = self.clean_text(member_cell.get_text()) if member_cell else ""
                        
                        # Extract status
                        status = self.clean_text(status_cell.get_text()) if status_cell else ""
                        
                        if bill_number and title:
                            bill = self.create_bill_dict(
                                bill_number=bill_number,
                                title=title,
                                sponsor=sponsor,
                                status=status,
                                source_url=source_url,
                                bill_url=bill_url
                            )
                            bills.append(bill)
                            
                    except Exception as e:
                        self.logger.error(f"Error parsing BC table row: {e}")
                        
        return bills
        
    def extract_from_bills_list(self, soup, source_url):
        """Extract bills from list format"""
        bills = []
        
        # Look for bill containers
        bill_containers = soup.find_all(['div', 'article'], class_=['bill-item', 'bill-container', 'legislation-item'])
        
        for container in bill_containers:
            try:
                # Look for bill link
                bill_link = container.find('a', class_=['bill-link', 'title-link']) or container.find('a')
                
                if bill_link:
                    # Extract from link
                    link_text = bill_link.get_text()
                    
                    # BC format: "Bill M 201 — Title of Bill"
                    match = re.match(r'Bill\s+([A-Z]?\s*\d+)\s*[—–-]\s*(.+)', link_text, re.IGNORECASE)
                    if match:
                        bill_number = match.group(1).strip()
                        title = match.group(2).strip()
                    else:
                        # Try alternative format
                        parts = re.split(r'[—–-]', link_text, 1)
                        if len(parts) == 2:
                            bill_number = self.extract_bill_number(parts[0])
                            title = self.clean_text(parts[1])
                        else:
                            continue
                            
                    # Look for member info
                    member_elem = container.find(['span', 'div'], class_=['member', 'sponsor'])
                    sponsor = self.clean_text(member_elem.get_text()) if member_elem else ""
                    
                    # Look for status
                    status_elem = container.find(['span', 'div'], class_=['status', 'stage'])
                    status = self.clean_text(status_elem.get_text()) if status_elem else ""
                    
                    bill = self.create_bill_dict(
                        bill_number=bill_number,
                        title=title,
                        sponsor=sponsor,
                        status=status,
                        source_url=source_url,
                        bill_url=self.base_url + bill_link.get('href', '')
                    )
                    bills.append(bill)
                    
            except Exception as e:
                self.logger.error(f"Error parsing BC bill container: {e}")
                
        return bills
