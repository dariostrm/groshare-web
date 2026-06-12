let apiUrl = "https://groshare.dariostrm.dev/api/v1";
let testApiUrl = "http://localhost:8080/api/v1";

export function api(endpoint: string): string {
    if (endpoint.startsWith("/")) {
        endpoint = endpoint.substring(1);
    }
    return `${apiUrl}/${endpoint}`;
}