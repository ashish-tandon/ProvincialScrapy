
# Alberta Legislature Bills Scraper  
import requests
from bs4 import BeautifulSoup
import pandas as pd

class AlbertaBillsScraper:
    def __init__(self):
        self.base_url = "https://www.assembly.ab.ca/assembly-business/bills"
        self.bills_db_url = "https://www.assembly.ab.ca/assembly-business/bills/bills-by-legislature"

    def scrape_bills_database(self):
        """Scrape Alberta bills from structured database"""
        bills = []

        # Get current legislature bills
        response = requests.get(self.bills_db_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for legislature sessions
        sessions = soup.find_all('div', class_='legislature-session') or soup.find_all('h3')

        for session in sessions:
            session_name = session.text.strip()

            # Find bills table for this session
            bills_table = session.find_next('table')
            if bills_table:
                rows = bills_table.find_all('tr')[1:]  # Skip header

                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) >= 4:
                        bill_link = cells[0].find('a')
                        bills.append({
                            'province': 'Alberta',
                            'session': session_name,
                            'bill_number': cells[0].text.strip(),
                            'title': cells[1].text.strip(),
                            'sponsor': cells[2].text.strip(),
                            'status': cells[3].text.strip(),
                            'bill_url': bill_link.get('href') if bill_link else '',
                            'scraped_date': datetime.now().isoformat()
                        })

        return bills

    def get_historical_bills(self, start_year=2020):
        """Get historical bills from Alberta going back to specified year"""
        all_bills = []

        # Alberta has bills database from 1906
        historical_url = f"{self.base_url}/bills-by-legislature"
        response = requests.get(historical_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find legislature links
        legislature_links = soup.find_all('a', href=True)

        for link in legislature_links:
            if 'legislature' in link.get('href', '').lower():
                leg_url = urljoin(historical_url, link.get('href'))
                leg_bills = self.scrape_legislature_session(leg_url)
                all_bills.extend(leg_bills)

        return all_bills
