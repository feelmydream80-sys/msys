document.addEventListener('DOMContentLoaded', function() {
    const sessionTimerElement = document.getElementById('session-timer');
    let sessionTimeoutInterval;
    let periodicFetchInterval;

    function updateSessionTimer(secondsRemaining) {
        if (!sessionTimerElement) return;

        if (secondsRemaining > 0) {
            const minutes = Math.floor(secondsRemaining / 60);
            const seconds = Math.floor(secondsRemaining % 60);
            sessionTimerElement.textContent = `(남은 시간: ${minutes}분 ${seconds}초)`;
        } else {
            sessionTimerElement.textContent = '(세션 만료)';
            clearInterval(sessionTimeoutInterval);
        }
    }

    async function fetchAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            if (response.ok) {
                const data = await response.json();
                if (data.isLoggedIn) {
                    let secondsRemaining = data.seconds_remaining;
                    updateSessionTimer(secondsRemaining);

                    if (sessionTimeoutInterval) clearInterval(sessionTimeoutInterval);
                    sessionTimeoutInterval = setInterval(() => {
                        secondsRemaining--;
                        updateSessionTimer(secondsRemaining);
                    }, 1000);
                }
            } else {
                if (sessionTimeoutInterval) clearInterval(sessionTimeoutInterval);
                if (periodicFetchInterval) clearInterval(periodicFetchInterval);
                if (response.status === 401) {
                    alert("세션이 만료되었거나 유효하지 않아 재로그인이 필요합니다.");
                    window.location.href = '/login';
                }
            }
        } catch (error) {

            if (sessionTimeoutInterval) clearInterval(sessionTimeoutInterval);
            if (periodicFetchInterval) clearInterval(periodicFetchInterval);
        }
    }


    fetchAuthStatus();


    periodicFetchInterval = setInterval(fetchAuthStatus, 60 * 1000);
});
