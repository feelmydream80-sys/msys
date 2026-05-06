                                 
"""
A service to analyze a generic HTML content string or plain text, and extract 
potential data candidates for user mapping.
"""
import logging
import json
from bs4 import BeautifulSoup
from typing import Dict, List, Any

class UrlAnalyzerService:
    """
    Analyzes an HTML content string or plain text to extract structured data candidates.
    """

    def _is_html(self, content: str) -> bool:
        """A simple heuristic to check if the content is HTML."""
        return '<' in content and '>' in content

    def analyze(self, content: str) -> Dict[str, List[Any]]:
        """
        Parses content string (HTML or plain text) and extracts candidate data.

        Args:
            content: The content string to analyze.

        Returns:
            A dictionary containing lists of candidates for 'headings', 
            'paragraphs', and 'tables'.
        """
        logging.info("Analyzing pasted content...")
        try:
            logging.debug("--- Raw Content (Before Processing) ---")
            logging.debug(content)

            result = {
                'headings': [],
                'paragraphs': [],
                'tables': []
            }

            if self._is_html(content):
                logging.info("Content detected as HTML. Parsing with BeautifulSoup.")
                soup = BeautifulSoup(content, 'html.parser')
                result['headings'] = self._extract_headings(soup)
                result['paragraphs'] = self._extract_paragraphs(soup)
                result['tables'] = self._extract_tables(soup)
            else:
                logging.info("Content detected as plain text. Parsing by lines.")
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                                                                                    
                result['headings'] = [{'tag': 'txt', 'text': line} for line in lines]

            logging.debug("--- Extracted JSON Data (After Processing) ---")
            logging.debug(json.dumps(result, indent=2, ensure_ascii=False))

            return result
            
        except Exception as e:
            logging.error(f"Failed to parse content: {e}", exc_info=True)
            raise ValueError(f"붙여넣은 콘텐츠를 분석하는 데 실패했습니다: {e}")

    def _extract_headings(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extracts H1-H6 headings as candidates."""
        headings = []
        for i in range(1, 7):
            for h in soup.find_all(f'h{i}'):
                text = h.get_text(strip=True)
                if text:
                    headings.append({'tag': f'h{i}', 'text': text})
        return headings

    def _extract_paragraphs(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Extracts paragraphs and other potential text blocks as candidates."""
        paragraphs = []
                                                                
        for tag in soup.find_all(['p', 'div', 'li', 'span']):
            text = tag.get_text(strip=True)
                                         
            if text and '\n' not in text and len(text) > 5:
                paragraphs.append({'tag': tag.name, 'text': text})
        
                                                  
        seen = set()
        unique_paragraphs = []
        for p in paragraphs:
            if p['text'] not in seen:
                seen.add(p['text'])
                unique_paragraphs.append(p)
        
        return unique_paragraphs

    def _extract_tables(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extracts all tables with a more relaxed rule set."""
        tables = []
        for i, table in enumerate(soup.find_all('table')):
            rows = []
            for tr in table.find_all('tr'):
                                                  
                cells = tr.find_all(['th', 'td'])
                row_data = [cell.get_text(strip=True) for cell in cells]
                if any(row_data):                          
                    rows.append(row_data)
            
            if rows:
                                                                     
                headers = rows[0]
                body_rows = rows[1:]
                
                                                                                          
                if headers and body_rows:
                    tables.append({
                        'id': f'table-{i}',
                        'headers': headers,
                        'rows': body_rows
                    })
        return tables
