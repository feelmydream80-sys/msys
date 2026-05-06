                             
import hashlib
import os
import base64
import logging
import re

class PasswordService:
    """
    비밀번호 관련 모든 작업을 처리합니다. (해싱 및 검증)
    비밀번호 해싱 방식으로 SHA-512와 PBKDF2를 사용합니다.
    """
    
    ITERATIONS = 260000
    SALT_SIZE = 16
    HASH_ALGORITHM = 'sha512'

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hashes a plain-text password using PBKDF2 with SHA-512.

        Args:
            password: The plain-text password to hash.

        Returns:
            The hashed password in the format "salt$hash".
            
        Raises:
            ValueError: If the password is empty or invalid.
        """
        if not password:
            raise ValueError("Password cannot be empty.")
        
        try:
            salt = os.urandom(PasswordService.SALT_SIZE)
            key = hashlib.pbkdf2_hmac(
                PasswordService.HASH_ALGORITHM,
                password.encode('utf-8'),
                salt,
                PasswordService.ITERATIONS
            )
                                                   
            stored_password = f"{base64.b64encode(salt).decode('utf-8')}${base64.b64encode(key).decode('utf-8')}"
            return stored_password
        except Exception as e:
            logging.error(f"Error during password hashing: {e}", exc_info=True)
            raise ValueError("Failed to hash password due to an internal error.")

    @staticmethod
    def check_password(password: str, stored_password: str) -> bool:
        """
        Verifies a plain-text password against a stored SHA-512 hash.

        Args:
            password: The plain-text password to verify.
            stored_password: The stored hashed password.

        Returns:
            True if the password matches, False otherwise.
        """
        if not password or not stored_password:
            return False

        try:
            salt_str, key_str = stored_password.split('$')
            salt = base64.b64decode(salt_str)
            
            key_to_check = hashlib.pbkdf2_hmac(
                PasswordService.HASH_ALGORITHM,
                password.encode('utf-8'),
                salt,
                PasswordService.ITERATIONS
            )
            
            return base64.b64encode(key_to_check).decode('utf-8') == key_str
        except Exception as e:
            logging.error(f"Error during password verification: {e}", exc_info=True)
            return False

    @staticmethod
    def validate_password_policy_detailed(password: str) -> dict:
        """
        Validates the password against the defined security policy and returns detailed results.

        Args:
            password: The plain-text password to validate.

        Returns:
            A dictionary containing validation results for each rule.
        """
        results = {
            'length': len(password) >= 8,
            'special_char': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
            'no_consecutive': True,
            'no_repeating': True,
            'is_valid': True,
            'message': "비밀번호가 유효합니다."
        }

                                                   
        for i in range(len(password) - 2):
            if password[i].isdigit() and password[i+1].isdigit() and password[i+2].isdigit():
                if int(password[i+1]) == int(password[i]) + 1 and int(password[i+2]) == int(password[i+1]) + 1:
                    results['no_consecutive'] = False
                    results['is_valid'] = False
                    results['message'] = "연속된 숫자 (예: 123, 456)는 사용할 수 없습니다."
                    break

                                                 
        for i in range(len(password) - 2):
            if password[i].isdigit() and password[i] == password[i+1] and password[i] == password[i+2]:
                results['no_repeating'] = False
                results['is_valid'] = False
                results['message'] = "동일한 숫자를 3번 이상 반복 (예: 111, 888)할 수 없습니다."
                break

                      
        if not results['length']:
            results['is_valid'] = False
            results['message'] = "비밀번호는 8자 이상이어야 합니다."

                                  
        if not results['special_char']:
            results['is_valid'] = False
            results['message'] = "최소 1개 이상의 특수문자를 포함해야 합니다."

        return results

    @staticmethod
    def validate_password_policy(password: str) -> tuple[bool, str]:
        """
        Validates the password against the defined security policy.

        Args:
            password: The plain-text password to validate.

        Returns:
            A tuple containing a boolean (True if valid) and a message string.
        """
        results = PasswordService.validate_password_policy_detailed(password)
        return results['is_valid'], results['message']
