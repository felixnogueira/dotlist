import { spotifyApi } from './spotify-api.js';

export async function generateRecommendations(answers) {
    let seed_genres = await getSeedGenres();
    let seed_artists = answers.include_artists?.slice(0, 5).join(',') || '';

    if (answers.exclude_genres?.length > 0) {
        seed_genres = seed_genres.split(',')
            .filter(g => !answers.exclude_genres.includes(g))
            .slice(0, 5)
            .join(',');
    }

    if (!seed_genres && !seed_artists) {
        throw new Error('Need at least one seed (genre or artist) for recommendations');
    }

    const params = {
        limit: 50,
        seed_genres: seed_genres,
        seed_artists: seed_artists,
        min_popularity: answers.free_time === 'social' ? 50 : 0,
    };

    if (answers.free_time) {
        switch (answers.free_time) {
            case 'creative':
                params.min_instrumentalness = 0.7;
                params.min_acousticness = 0.6;
                break;
            case 'physical':
                params.min_energy = 0.8;
                params.min_danceability = 0.7;
                break;
        }
    }

    if (answers.purpose) {
        switch (answers.purpose) {
            case 'dancing':
                params.min_danceability = 0.7;
                params.min_energy = 0.7;
                params.min_tempo = 120;
                break;
            case 'relaxing':
                params.max_energy = 0.3;
                params.max_danceability = 0.3;
                break;
        }
    }

    const recs = await spotifyApi.getRecommendations(params);

    const user = await spotifyApi.getUserProfile();
    const playlist = await spotifyApi.createPlaylist(
        user.id,
        answers.playlist_name || 'My Custom Playlist',
        'Created with dotlist'
    );

    await spotifyApi.addTracksToPlaylist(
        playlist.id,
        recs.tracks.map(track => track.uri)
    );

    return {
        name: answers.playlist_name || 'My Custom Playlist',
        url: playlist.external_urls.spotify,
        trackCount: recs.tracks.length
    };
}

async function getSeedGenres() {
    const genres = await spotifyApi.getFavoriteGenres();
    return genres.slice(0, 5).join(',');
}
