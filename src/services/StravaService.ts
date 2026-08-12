export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: any;
}

export class StravaService {
  private static STORAGE_KEY = 'ghost_runner_strava_token';

  public static getAuthUrl(clientId: string, redirectUri: string): string {
    const scope = 'read,activity:read_all,activity:write';
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
  }

  public static async exchangeToken(clientId: string, clientSecret: string, code: string): Promise<StravaTokenResponse> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      throw new Error(`Strava OAuth token exchange failed: ${response.statusText}`);
    }

    const data: StravaTokenResponse = await response.json();
    StravaService.saveToken(data.access_token);
    return data;
  }

  public static saveToken(token: string): void {
    localStorage.setItem(StravaService.STORAGE_KEY, token);
  }

  public static getToken(): string | null {
    return localStorage.getItem(StravaService.STORAGE_KEY);
  }

  public static async getUserActivities(accessToken: string): Promise<any[]> {
    const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Strava activities: ${response.statusText}`);
    }

    return response.json();
  }

  public static async uploadActivity(accessToken: string, gpxBlob: Blob, name: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', gpxBlob, 'ghost_runner.gpx');
    formData.append('name', name);
    formData.append('data_type', 'gpx');

    const response = await fetch('https://www.strava.com/api/v3/uploads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Strava upload failed: ${response.statusText}`);
    }

    return response.json();
  }
}
