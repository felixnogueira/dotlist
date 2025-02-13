class SpotifyAPI {
    constructor() {
        this.accessToken = null;
        this.baseUrl = 'https://api.spotify.com/v1';
    }

    setAccessToken(token) {
        if (!token) {
            throw new Error('No access token provided');
        }
        this.accessToken = token;
    }

    async makeRequest(endpoint, method = 'GET', body = null) {
        try {
            if (!this.accessToken) {
                throw new Error('No access token available. Please log in again.');
            }

            console.log('Making API request to:', `${this.baseUrl}${endpoint}`);

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : null,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', {
                endpoint: `${this.baseUrl}${endpoint}`,
                method: method,
                error: error.message,
                stack: error.stack,
            });

            throw error;
        }
    }
    async getUserProfile() {
        return await this.makeRequest('/me');
    }

    async getTopArtists(limit = 10) {
        return await this.makeRequest(`/me/top/artists?limit=${limit}`);
    }

    async getTopTracks(limit = 20) {
        return await this.makeRequest(`/me/top/tracks?limit=${limit}`);
    }

    async getFavoriteGenres() {

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        const topArtists = await this.getTopArtists(20);
        const genres = topArtists.items.flatMap(artist => artist.genres);
        const uniqueGenres = [...new Set(genres)]; // Remove duplicates

        const shuffledGenres = shuffleArray(uniqueGenres);
        return shuffledGenres.slice(0, 5);
    }

    async createPlaylist(userId, name, description = '', isPublic = true) {
        return await this.makeRequest(`/users/${userId}/playlists`, 'POST', {
            name: name,
            description: description,
            public: isPublic
        });
    }

    async addTracksToPlaylist(playlistId, trackUris) {
        return await this.makeRequest(`/playlists/${playlistId}/tracks`, 'POST', {
            uris: trackUris
        });
    }

    async getRecommendations(params) {
        const queryString = new URLSearchParams(params).toString();
        return await this.makeRequest(`/recommendations?${queryString}`);
    }

    async getAudioFeatures(trackIds) {
        return await this.makeRequest(`/audio-features?ids=${trackIds.join(',')}`);
    }
}

export const spotifyApi = new SpotifyAPI();