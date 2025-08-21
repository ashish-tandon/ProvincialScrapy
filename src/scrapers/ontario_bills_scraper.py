
# Ontario Legislature Bills Scraper
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from datetime import datetime

class OntarioBillsScraper:
    def __init__(self):
        self.base_url = "https://www.ola.org/en/legislative-business/bills"
        self.data_portal_url = "https://data.ontario.ca/"
        self.session = requests.Session()

    def scrape_current_bills(self):
        """Scrape current session bills from Ontario Legislature"""
        bills = []

        # First check if there's an API endpoint
        response = self.session.get(self.base_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for bill table or list
        bill_rows = soup.find_all('tr', class_='bill-row') or soup.select('table tbody tr')

        for row in bill_rows:
            try:
                bill_number = row.find('td', class_='bill-number') or row.select('td')[0]
                title = row.find('td', class_='title') or row.select('td')[1] 
                status = row.find('td', class_='status') or row.select('td')[2]

                bills.append({
                    'province': 'Ontario',
                    'bill_number': bill_number.text.strip() if bill_number else '',
                    'title': title.text.strip() if title else '',
                    'status': status.text.strip() if status else '',
                    'scraped_date': datetime.now().isoformat(),
                    'source_url': self.base_url
                })
            except Exception as e:
                print(f"Error parsing bill row: {e}")
                continue

        return bills

    def get_bill_details(self, bill_url):
        """Get detailed information for a specific bill"""
        response = self.session.get(bill_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract detailed bill information
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
