export async function apiRequest(endpoint, method = "GET", data = null) {
    const token = localStorage.getItem("token")

    const config = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    }

    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`
    }

    if (data) {
        config.body = JSON.stringify(data)
    }

    try {
        const response = await fetch(`http://localhost:8000${endpoint}`, config)

        if (response.status === 401) {
            localStorage.clear()
            window.location.href = "auth.html"
            return null
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API Error: ${response.status}`);
        }

        return response.json()
    } catch (error) {
        console.error("API Request Failed:", error)
        throw error
    }
}
