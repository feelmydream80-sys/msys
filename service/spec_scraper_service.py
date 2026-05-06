                                 
import logging
import time
from typing import Union
import requests
from bs4 import BeautifulSoup

class SpecScraperService:
    """
    Scrapes data specification details from a given URL.
    """

    def __init__(self, user_agent='Mozilla/5.0'):
        self.headers = {'User-Agent': user_agent}

    def scrape_from_url(self, url: str) -> dict:
        """
        Fetches and parses data from the provided URL.

        Args:
            url: The URL to scrape.

        Returns:
            A dictionary containing the scraped data.

        Raises:
            ValueError: If the URL is invalid, fetching fails, or parsing fails.
        """
        logging.info(f"Starting to scrape data from URL: {url}")
        try:
            time.sleep(1)                                                 
            response = requests.get(url, headers=self.headers, timeout=10, verify=False)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            logging.info("Successfully fetched and parsed the URL content.")
            return self._parse_html(soup)
        except requests.RequestException as e:
            logging.error(f"URL fetch error for {url}: {e}", exc_info=True)
            raise ValueError(f"Failed to fetch content from the URL: {e}")
        except Exception as e:
            logging.error(f"Scraping failed for {url}: {e}", exc_info=True)
            raise ValueError(f"Failed to parse data from the page: {e}")

    def _parse_html(self, soup: BeautifulSoup) -> dict:
        """
        Parses the BeautifulSoup object to extract specification data.
        """
        scraped_data = {
            "data_name": self._extract_text(soup, '.tit-area'),
            "description": self._extract_text(soup, '.cont'),
            "details": self._extract_details(soup),
            "reference_doc": self._extract_reference_doc(soup),
            "tables": self._extract_tables(soup)
        }
        logging.info("Finished parsing HTML content.")
        return scraped_data

    def _extract_text(self, soup: BeautifulSoup, selector: str) -> str:
        """Extracts text from a given CSS selector."""
        element = soup.select_one(selector)
        if element:
            text = element.get_text(separator="\n", strip=True)
            logging.info(f"SUCCESS: Found text for selector '{selector}': '{text[:50]}...'")
            return text
        logging.warning(f"FAIL: Element for selector '{selector}' not found.")
        return ""

    def _extract_details(self, soup: BeautifulSoup) -> list:
        """Extracts key-value details."""
        details = []
        detail_keys = ["제공기관", "관리부서명", "API 유형", "데이터포맷", "키워드", "등록일", "수정일"]
        for key in detail_keys:
            if th := soup.find('th', string=key):
                if td := th.find_next_sibling('td'):
                    value = td.text.strip()
                    details.append({"key": key, "value": value})
                    logging.info(f"SUCCESS: Found Detail = '{key}': '{value}'")
            else:
                logging.warning(f"FAIL: Value for detail '{key}' not found.")
        return details

    def _extract_reference_doc(self, soup: BeautifulSoup) -> Union[dict, None]:
        """Extracts the reference document link."""
        if doc_th := soup.find('th', string='참고문서'):
            if doc_td := doc_th.find_next_sibling('td'):
                if doc_a := doc_td.find('a'):
                    doc = {
                        "text": doc_a.text.strip(),
                        "onclick": doc_a.get('onclick', '')
                    }
                    logging.info(f"SUCCESS: Found Reference Doc = {doc}")
                    return doc
        logging.warning("FAIL: Reference document element not found.")
        return None

    def _extract_tables(self, soup: BeautifulSoup) -> list:
        """Extracts tables for request/response variables."""
        tables = []
        for h4 in soup.find_all('h4'):
            table_title = h4.text.strip()
            if '요청변수' in table_title or '출력결과' in table_title:
                if table := h4.find_next_sibling('table'):
                    table_data = {"name": table_title, "headers": [], "rows": []}
                    if thead := table.find('thead'):
                        table_data["headers"] = [th.text.strip() for th in thead.find_all('th')]
                    if tbody := table.find('tbody'):
                        for tr in tbody.find_all('tr'):
                            row_data = [td.text.strip() for td in tr.find_all('td')]
                            table_data["rows"].append(row_data)
                    tables.append(table_data)
                    logging.info(f"SUCCESS: Found table '{table_title}' with {len(table_data['rows'])} rows.")
        return tables
