
# British Columbia Legislature Bills Scraper
import requests
from bs4 import BeautifulSoup
import xml.etree.ElementTree as ET
import pandas as pd

class BCBillsScraper:
    def __init__(self):
        self.base_url = "https://www.leg.bc.ca/parliamentary-business/bills"
        self.progress_url = "https://www.leg.bc.ca/parliamentary-business/bills-and-legislation"

    def scrape_bills_xml(self):
        """Scrape BC bills from XML feed if available"""
        bills = []

        # Try XML endpoint first
        xml_urls = [
            f"{self.base_url}.xml",
            f"{self.base_url}/feed.xml", 
            f"{self.progress_url}.xml"
        ]

        for xml_url in xml_urls:
            try:
                response = requests.get(xml_url)
                if response.status_code == 200:
                    root = ET.fromstring(response.content)

                    for bill in root.findall('.//bill'):
                        bills.append({
                            'province': 'British Columbia',
                            'bill_number': bill.find('number').text if bill.find('number') is not None else '',
                            'title': bill.find('title').text if bill.find('title') is not None else '',
                            'status': bill.find('status').text if bill.find('status') is not None else '',
                            'member': bill.find('member').text if bill.find('member') is not None else '',
                            'scraped_date': datetime.now().isoformat()
                        })
                    return bills
            except:
                continue

        # Fallback to HTML scraping
        return self.scrape_bills_html()

    def scrape_bills_html(self):
        """Fallback HTML scraping for BC bills"""
        response = requests.get(self.base_url)
        soup = BeautifulSoup(response.content, 'html.parser')
        bills = []

        # Look for bills table
        table = soup.find('table', class_='bills') or soup.find('table')
        if table:
            rows = table.find_all('tr')[1:]  # Skip header

            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 3:
                    bills.append({
                        'province': 'British Columbia',
                        'bill_number': cells[0].text.strip(),
                        'title': cells[1].text.strip(),
                        'member': cells[2].text.strip() if len(cells) > 2 else '',
                        'status': cells[3].text.strip() if len(cells) > 3 else '',
                        'scraped_date': datetime.now().isoformat()
                    })

        return bills
