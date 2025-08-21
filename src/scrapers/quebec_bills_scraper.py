
# Quebec National Assembly Bills Scraper
import requests
from bs4 import BeautifulSoup
import pandas as pd

class QuebecBillsScraper:
    def __init__(self):
        self.base_url_en = "https://www.assnat.qc.ca/en/travaux-parlementaires/projets-loi"
        self.base_url_fr = "https://www.assnat.qc.ca/fr/travaux-parlementaires/projets-loi"

    def scrape_current_bills(self, language='en'):
        """Scrape Quebec bills in English or French"""
        base_url = self.base_url_en if language == 'en' else self.base_url_fr
        bills = []

        response = requests.get(base_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for bills list or table
        bills_container = soup.find('div', class_='bills-list') or soup.find('table')

        if bills_container:
            bill_items = bills_container.find_all('tr') or bills_container.find_all('div', class_='bill-item')

            for item in bill_items:
                try:
                    # Extract bill information based on structure
                    bill_link = item.find('a')
                    if bill_link:
                        bill_number = self.extract_bill_number(bill_link.text)
                        title = bill_link.text.strip()

                        # Get bill details page
                        bill_url = urljoin(base_url, bill_link.get('href'))
                        details = self.get_bill_details(bill_url)

                        bills.append({
                            'province': 'Quebec',
                            'language': language,
                            'bill_number': bill_number,
                            'title': title,
                            'bill_url': bill_url,
                            'status': details.get('status', ''),
                            'scraped_date': datetime.now().isoformat()
                        })

                except Exception as e:
                    print(f"Error parsing Quebec bill: {e}")
                    continue

        return bills

    def extract_bill_number(self, text):
        """Extract bill number from text"""
        import re
        match = re.search(r'Bill (\d+)|Projet de loi (\d+)', text, re.IGNORECASE)
        return match.group(1) or match.group(2) if match else ''

    def scrape_both_languages(self):
        """Scrape bills in both English and French"""
        english_bills = self.scrape_current_bills('en')
        french_bills = self.scrape_current_bills('fr')

        # Merge and deduplicate bills
        all_bills = english_bills + french_bills
        return self.deduplicate_bills(all_bills)
