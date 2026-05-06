


export async function fetchStsCdColors() {
    try {
        const response = await fetch('/api/sts_cd/colors');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {

            return null;
        }
    } catch (error) {

        return null;
    }
}
