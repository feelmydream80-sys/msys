import os

def load_sql(file_path: str) -> str:
    """
    지정된 경로의 SQL 파일을 읽어 그 내용을 문자열로 반환합니다.
    """
                                 
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_path = os.path.join(base_dir, file_path)
    
    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
                                        
        raise FileNotFoundError(f"SQL 파일을 찾을 수 없습니다: {full_path}")
    except Exception as e:
                  
        raise RuntimeError(f"SQL 파일을 읽는 중 오류 발생: {e}")
