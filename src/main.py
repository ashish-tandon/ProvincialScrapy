
# Unified Canadian Provincial Bills Scraper
import asyncio
import aiohttp
from datetime import datetime
import pandas as pd
from .scrapers.ontario_bills_scraper import OntarioBillsScraper
from .scrapers.bc_bills_scraper import BCBillsScraper  
from .scrapers.alberta_bills_scraper import AlbertaBillsScraper
from .scrapers.quebec_bills_scraper import QuebecBillsScraper
from .scrapers.saskatchewan_bills_scraper import SaskatchewanBillsScraper
from .scrapers.manitoba_bills_scraper import ManitobaBillsScraper

class CanadianProvincialBillsScraper:
    def __init__(self):
        self.scrapers = {
            'ontario': OntarioBillsScraper(),
            'bc': BCBillsScraper(),
            'alberta': AlbertaBillsScraper(),
            'quebec': QuebecBillsScraper(),
            'saskatchewan': SaskatchewanBillsScraper(),
            'manitoba': ManitobaBillsScraper()
        }
        self.all_bills = []

    async def scrape_all_provinces(self):
        """Run all provincial scrapers in parallel"""
        tasks = []

        for province, scraper in self.scrapers.items():
            task = asyncio.create_task(self.scrape_province(province, scraper))
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Combine all results
        for result in results:
            if isinstance(result, list):
                self.all_bills.extend(result)

        return self.all_bills

    async def scrape_province(self, province, scraper):
        """Scrape a single province"""
        try:
            print(f"Starting scrape for {province}...")
            bills = scraper.scrape_current_bills()
            print(f"Found {len(bills)} bills for {province}")
            return bills
        except Exception as e:
            print(f"Error scraping {province}: {e}")
            return []

    def save_to_database(self):
        """Save all bills to database or CSV"""
        df = pd.DataFrame(self.all_bills)

        # Save to CSV for now
        filename = f"canadian_provincial_bills_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        df.to_csv(filename, index=False)

        print(f"Saved {len(self.all_bills)} bills to {filename}")
        return filename

    def get_summary_stats(self):
        """Get summary statistics"""
        if not self.all_bills:
            return {}

        df = pd.DataFrame(self.all_bills)
        stats = {
            'total_bills': len(df),
            'by_province': df['province'].value_counts().to_dict(),
            'latest_update': datetime.now().isoformat()
        }

        return stats

def main():
    """Main entry point for the scraper"""
    scraper = CanadianProvincialBillsScraper()

    # Run the scraper
    bills = asyncio.run(scraper.scrape_all_provinces())

    # Save results
    filename = scraper.save_to_database()

    # Print summary
    stats = scraper.get_summary_stats()
    print("\nScraping Summary:")
    print(f"Total bills scraped: {stats['total_bills']}")
    print(f"Bills by province: {stats['by_province']}")

# Usage example:
if __name__ == "__main__":
    main()
