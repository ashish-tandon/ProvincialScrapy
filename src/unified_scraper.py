#!/usr/bin/env python3
"""
Unified Provincial Bills Scraper
Coordinates scraping across all Canadian provinces and territories
"""

import os
import sys
import json
import asyncio
import argparse
import logging
from datetime import datetime
from typing import List, Dict
import requests

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers import SCRAPERS, BaseScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('UnifiedScraper')

class UnifiedProvincialScraper:
    """Orchestrates scraping across all provinces"""
    
    def __init__(self, use_mcp_server=True):
        self.use_mcp_server = use_mcp_server
        self.mcp_server_url = os.getenv('MCP_SERVER_URL', 'http://localhost:3001')
        self.results = {}
        self.errors = {}
        
    def scrape_province(self, province: str) -> Dict:
        """Scrape a single province"""
        logger.info(f"Starting scrape for {province}")
        
        try:
            # Get the scraper class
            scraper_class = SCRAPERS.get(province.lower())
            if not scraper_class:
                raise ValueError(f"No scraper available for province: {province}")
                
            # Initialize and run scraper
            scraper = scraper_class()
            bills, success = scraper.run()
            
            result = {
                'province': province,
                'bills_count': len(bills),
                'success': success,
                'timestamp': datetime.now().isoformat(),
                'bills': bills[:5]  # Sample of bills for verification
            }
            
            self.results[province] = result
            logger.info(f"Completed {province}: {len(bills)} bills found")
            
            return result
            
        except Exception as e:
            error_msg = f"Error scraping {province}: {str(e)}"
            logger.error(error_msg)
            self.errors[province] = error_msg
            
            return {
                'province': province,
                'bills_count': 0,
                'success': False,
                'error': error_msg,
                'timestamp': datetime.now().isoformat()
            }
            
    def scrape_all_provinces(self, provinces: List[str] = None) -> Dict:
        """Scrape all provinces or a specific list"""
        if provinces is None:
            provinces = list(SCRAPERS.keys())
            
        logger.info(f"Starting scrape for {len(provinces)} provinces")
        
        # If using MCP server, trigger scraping through it
        if self.use_mcp_server:
            return self.scrape_via_mcp_server(provinces)
        else:
            # Direct scraping
            for province in provinces:
                self.scrape_province(province)
                
            return self.generate_report()
            
    def scrape_via_mcp_server(self, provinces: List[str]) -> Dict:
        """Trigger scraping through MCP server"""
        try:
            # Check if MCP server is available
            health_response = requests.get(f"{self.mcp_server_url}/health", timeout=5)
            if health_response.status_code != 200:
                logger.warning("MCP server not healthy, falling back to direct scraping")
                self.use_mcp_server = False
                return self.scrape_all_provinces(provinces)
                
            # Trigger scraping for each province
            jobs = []
            for province in provinces:
                response = requests.post(
                    f"{self.mcp_server_url}/api/scrape/province/{province}",
                    json={'forceRefresh': True},
                    timeout=10
                )
                
                if response.status_code == 200:
                    job_data = response.json()
                    jobs.append({
                        'province': province,
                        'jobId': job_data.get('jobId'),
                        'status': 'queued'
                    })
                    logger.info(f"Queued scraping job for {province}")
                else:
                    logger.error(f"Failed to queue job for {province}: {response.status_code}")
                    
            # Wait for jobs to complete (with timeout)
            return self.wait_for_jobs(jobs)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"MCP server connection failed: {e}")
            logger.info("Falling back to direct scraping")
            self.use_mcp_server = False
            return self.scrape_all_provinces(provinces)
            
    def wait_for_jobs(self, jobs: List[Dict], timeout: int = 300) -> Dict:
        """Wait for MCP server jobs to complete"""
        import time
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            all_complete = True
            
            for job in jobs:
                if job['status'] in ['completed', 'failed']:
                    continue
                    
                try:
                    # Check job status
                    response = requests.get(
                        f"{self.mcp_server_url}/api/scrape/status/{job['jobId']}",
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        job_status = response.json()
                        job['status'] = job_status.get('state', 'unknown')
                        job['progress'] = job_status.get('progress', 0)
                        
                        if job['status'] == 'completed':
                            result = job_status.get('result', {})
                            self.results[job['province']] = {
                                'province': job['province'],
                                'bills_count': result.get('billsFound', 0),
                                'success': True,
                                'timestamp': datetime.now().isoformat()
                            }
                        elif job['status'] == 'failed':
                            self.errors[job['province']] = job_status.get('failedReason', 'Unknown error')
                            
                    all_complete = False
                    
                except Exception as e:
                    logger.error(f"Error checking job status: {e}")
                    all_complete = False
                    
            if all_complete:
                break
                
            time.sleep(5)  # Wait before next check
            
        return self.generate_report()
        
    def generate_report(self) -> Dict:
        """Generate a comprehensive scraping report"""
        total_bills = sum(r.get('bills_count', 0) for r in self.results.values())
        successful_provinces = sum(1 for r in self.results.values() if r.get('success', False))
        
        report = {
            'summary': {
                'total_provinces_attempted': len(self.results) + len(self.errors),
                'successful_provinces': successful_provinces,
                'failed_provinces': len(self.errors),
                'total_bills_scraped': total_bills,
                'timestamp': datetime.now().isoformat(),
                'method': 'mcp_server' if self.use_mcp_server else 'direct'
            },
            'results': self.results,
            'errors': self.errors
        }
        
        # Save report
        report_file = f"scraping_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Report saved to {report_file}")
        
        return report
        
    def print_summary(self, report: Dict):
        """Print a human-readable summary"""
        print("\n" + "="*60)
        print("SCRAPING SUMMARY")
        print("="*60)
        
        summary = report['summary']
        print(f"Total Provinces Attempted: {summary['total_provinces_attempted']}")
        print(f"Successful: {summary['successful_provinces']}")
        print(f"Failed: {summary['failed_provinces']}")
        print(f"Total Bills Scraped: {summary['total_bills_scraped']}")
        print(f"Method: {summary['method']}")
        print(f"Timestamp: {summary['timestamp']}")
        
        if report['results']:
            print("\nSUCCESSFUL PROVINCES:")
            print("-"*40)
            for province, result in report['results'].items():
                print(f"  {province}: {result['bills_count']} bills")
                
        if report['errors']:
            print("\nFAILED PROVINCES:")
            print("-"*40)
            for province, error in report['errors'].items():
                print(f"  {province}: {error}")
                
        print("="*60 + "\n")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Unified Provincial Bills Scraper')
    parser.add_argument(
        '--provinces', 
        nargs='+', 
        help='Specific provinces to scrape (default: all)'
    )
    parser.add_argument(
        '--no-mcp', 
        action='store_true',
        help='Disable MCP server and use direct scraping'
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug logging'
    )
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        
    # Initialize scraper
    scraper = UnifiedProvincialScraper(use_mcp_server=not args.no_mcp)
    
    # Run scraping
    report = scraper.scrape_all_provinces(args.provinces)
    
    # Print summary
    scraper.print_summary(report)
    
    # Exit with appropriate code
    sys.exit(0 if report['summary']['failed_provinces'] == 0 else 1)

if __name__ == "__main__":
    main()