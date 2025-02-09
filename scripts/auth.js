const SPOTIFY_CLIENT_ID = 'your-client-id';
const REDIRECT_URI = 'http://localhost:3000/callback'; // Update for production

function login() {
    const scopes = [
        'user-read-private',
        'user-read-email',
        'user-top-read',
        'playlist-modify-public'
    ].join(' ');

    window.location = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}&response_type=token`;
}