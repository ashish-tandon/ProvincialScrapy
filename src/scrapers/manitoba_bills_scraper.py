# Manitoba Legislature Bills Scraper
import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import re

class ManitobaBillsScraper:
    def __init__(self):
        self.base_url = "https://www.gov.mb.ca/legislature/business/bills.html"
        self.session = requests.Session()

    def scrape_current_bills(self):
        """Scrape current session bills from Manitoba Legislature"""
        bills = []

        try:
            response = self.session.get(self.base_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            # Look for bills table or list
            bills_container = soup.find('div', class_='bills-list') or soup.find('table') or soup.find('section', class_='bills')

            if bills_container:
                bill_items = bills_container.find_all('tr') or bills_container.find_all('div', class_='bill-item')

                for item in bill_items:
                    try:
                        # Extract bill information
                        bill_link = item.find('a')
                        if bill_link:
                            bill_number = self.extract_bill_number(bill_link.text)
                            title = bill_link.text.strip()
                            bill_url = bill_link.get('href')
                            
                            # Get additional details if available
                            status_cell = item.find('td', class_='status') or item.find('span', class_='status')
                            sponsor_cell = item.find('td', class_='sponsor') or item.find('span', class_='sponsor')
                            
                            bills.append({
                                'province': 'Manitoba',
                                'bill_number': bill_number,
                                'title': title,
                                'bill_url': bill_url if bill_url else '',
                                'status': status_cell.text.strip() if status_cell else '',
                                'sponsor': sponsor_cell.text.strip() if sponsor_cell else '',
                                'scraped_date': datetime.now().isoformat(),
                                'source_url': self.base_url
                            })

                    except Exception as e:
                        print(f"Error parsing Manitoba bill: {e}")
                        continue

        except Exception as e:
            print(f"Error scraping Manitoba bills: {e}")

        return bills

    def extract_bill_number(self, text):
        """Extract bill number from text"""
        match = re.search(r'Bill (\d+)|(\d+)', text, re.IGNORECASE)
        return match.group(1) or match.group(2) if match else ''

    def get_bill_details(self, bill_url):
        """Get detailed information for a specific bill"""
        if not bill_url:
            return {}
            
        try:
            response = self.session.get(bill_url)
            soup = BeautifulSoup(response.content, 'html.parser')

            details = {
                'readings': [],
                'committee': '',
                'sponsor': '',
                'amendments': []
            }

            # Look for reading stages
            readings_section = soup.find('section', class_='readings') or soup.find('div', class_='bill-stages')
            if readings_section:
                for reading in readings_section.find_all('div', class_='reading'):
                    details['readings'].append({
                        'stage': reading.find('span', class_='stage').text if reading.find('span', class_='stage') else '',
                        'date': reading.find('span', class_='date').text if reading.find('span', class_='date') else ''
                    })

            return details

        except Exception as e:
            print(f"Error getting bill details: {e}")
            return {}
