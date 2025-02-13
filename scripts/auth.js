import { spotifyApi } from './spotify-api.js';
import { CLIENT_ID } from '../config.js';

function showSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`${sectionId}-section`).classList.remove('hidden');
    document.body.setAttribute('data-section', sectionId);
}

const config = {
    clientId: CLIENT_ID,
    redirectUri: 'http://127.0.0.1:5500', // Using localhost with live server default port
    scope: [
        'user-read-private',
        'user-read-email',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-top-read'
    ].join(' ')
};

//state verification:
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(length)))
        .map(x => possible[x % possible.length])
        .join('');
}

function login() {
    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    const args = new URLSearchParams({
        response_type: 'token',
        client_id: config.clientId,
        scope: config.scope,
        redirect_uri: config.redirectUri,
        state: state
    });

    window.location = 'https://accounts.spotify.com/authorize?' + args;
}

function handleRedirect() {
    const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce((initial, item) => {
            const parts = item.split('=');
            initial[parts[0]] = decodeURIComponent(parts[1]);
            return initial;
        }, {});

    window.location.hash = '';

    if (hash.access_token) {
        const state = localStorage.getItem('spotify_auth_state');
        console.log('Stored state:', state);
        console.log('Returned state:', hash.state);

        if (hash.state && hash.state !== state) {
            console.error('State mismatch!');
            return;
        }

        localStorage.setItem('spotify_access_token', hash.access_token);

        import('./spotify-api.js').then(module => {
            module.spotifyApi.setAccessToken(hash.access_token);
        });

        showSection('intro');
    }
}

function checkAuth() {
    const accessToken = localStorage.getItem('spotify_access_token');
    if (accessToken) {
        try {
            if (!spotifyApi) {
                console.error('spotifyApi is not defined');
                return false;
            }
            spotifyApi.setAccessToken(accessToken);
            return true;
        } catch (error) {
            console.error('Failed to set access token:', error);
            return false;
        }
    }
    return false;
}

function initAuth() {
    document.getElementById('login-button')?.addEventListener('click', login);

    if (window.location.hash) {
        handleRedirect();
    } else if (!checkAuth()) {
        showSection('welcome');
    }
}

document.addEventListener('DOMContentLoaded', initAuth);

export { login, checkAuth };
