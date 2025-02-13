import { spotifyApi } from './spotify-api.js';
import { generateRecommendations } from './recommendations.js';

const TEST_MODE = false;
let quizInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    let questions = [
        {
            question: "what's your age?",
            options: [
                { text: "under 18", value: "under18" },
                { text: "18 or over", value: "over18" },
            ],
            id: "age",
            bg: "quiz_age"
        },
        {
            question: "how would you describe yourself? select as many as apply",
            options: [
                { text: "energetic, enthusiastic", value: "energetic" },
                { text: "calm, relaxed", value: "calm" },
                { text: "focused, direct", value: "focused" },
                { text: "simple, practical", value: "simple" },
                { text: "flamboyant, loud", value: "flamboyant" },
                { text: "cool, quiet", value: "cool" },
                { text: "shy, demure", value: "shy" },
                { text: "loving, fantastical", value: "loving" },
                { text: "harsh, critic", value: "harsh" },
                { text: "impatient, brash", value: "impatient" },
            ],
            id: "personality",
            bg: "quiz_personality",
            multiple: true
        },
        {
            question: "what do you do in your free time?",
            options: [
                { text: "creative hobbies", value: "creative" },
                { text: "listen to music", value: "music" },
                { text: "relax with pets/kids", value: "relax" },
                { text: "scroll social media", value: "social" },
                { text: "physical activities", value: "physical" },
                { text: "gaming", value: "gaming" },
                { text: "gardening/DIY", value: "gardening" },
                { text: "meditation/Yoga", value: "meditation" }
            ],
            id: "free_time",
            bg: "quiz_hobbies"
        },
        {
            question: "what's your playlist for?",
            options: [
                { text: "dancing", value: "dancing" },
                { text: "singing along", value: "singing" },
                { text: "feeling sad", value: "sad" },
                { text: "exercising", value: "exercise" },
                { text: "relaxing", value: "relaxing" },
                { text: "background noise", value: "background" }
            ],
            id: "purpose",
            bg: "quiz_purpose"
        },
        {
            question: "preferred time of day?",
            options: [
                { text: "morning", value: "morning" },
                { text: "work/school", value: "work" },
                { text: "evening", value: "evening" },
                { text: "late night", value: "late" }
            ],
            id: "time",
            bg: "quiz_time"
        },
        {
            question: "spotify tells me you listen to these genres a lot. do you want to exclude any?",
            id: "exclude_genres",
            bg: "quiz-genres",
            type: "genres",
            multiple: true
        },
        {
            question: "do you want to include any of these artists?",
            id: "include_artists",
            bg: "quiz-artists",
            type: "artists",
            multiple: true
        },
        {
            question: "name your playlist:",
            id: "playlist_name",
            bg: "quiz-name",
            type: "text"
        }
    ];

    let currentQuestionIndex = 0;
    let answers = {};
    let dynamicQuestions = [];

    const questionContainer = document.getElementById('question-container');
    const nextButton = document.getElementById('next-question');
    const prevButton = document.getElementById('prev-question');
    const progressFill = document.querySelector('.progress-fill');

    function showSection(sectionId) {
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.add('hidden');
        });

        document.getElementById(`${sectionId}-section`).classList.remove('hidden');

        document.body.setAttribute('data-section', sectionId);
    }

    async function initQuiz() {
        try {
            const accessToken = localStorage.getItem('spotify_access_token');
            if (accessToken) {
                spotifyApi.setAccessToken(accessToken);
            }

            document.getElementById('start-quiz').addEventListener('click', startQuiz);
            nextButton.addEventListener('click', goToNextQuestion);
            prevButton.addEventListener('click', goToPreviousQuestion);

            quizInitialized = true;
        } catch (error) {
            console.error('Quiz initialization error:', error);
            showSection('error');
            document.getElementById('error-message').textContent = 'Failed to initialize quiz';
        }
    }

    async function startQuiz() {
        if (!quizInitialized) {
            showSection('error');
            document.getElementById('error-message').textContent = 'Quiz not initialized';
            return;
        }

        try {
            if (TEST_MODE) {
                dynamicQuestions = [
                    createGenreQuestion(['pop', 'rock', 'jazz']),
                    createArtistQuestion([
                        { name: 'Test Artist 1', id: '1', genres: ['pop'] }, // Add mock genre
                        { name: 'Test Artist 2', id: '2', genres: ['rock'] }
                    ]),
                    //createNameQuestion()
                ];
            } else {
                // Load actual Spotify data
                const genres = await spotifyApi.getFavoriteGenres(8);
                const artists = await spotifyApi.getTopArtists(5);
                console.log("Fetched genres:", genres);
                console.log("Fetched artists:", artists);
                dynamicQuestions = [
                    createGenreQuestion(genres),
                    createArtistQuestion(artists.items),
                    //createNameQuestion()
                ];
            }

            const staticQuestions = questions.slice(0, 5); // static questions
            //let nameQuestion = questions[questions.length - 1]; // Last question (name input)
            questions = [
                ...staticQuestions,
                ...dynamicQuestions,
                //nameQuestion
            ];

            showSection('quiz');
            currentQuestionIndex = 0;
            loadQuestion(currentQuestionIndex);
        } catch (error) {
            console.error('Failed to load data:', error);
            showSection('error');
            document.getElementById('error-message').textContent =
                TEST_MODE ? 'Test mode error' : 'Failed to load your Spotify data';
        }
    }

    function createGenreQuestion(genres) {
        const validGenres = Array.isArray(genres) ? genres : [];
        return {
            question: "Exclude any genres?",
            options: (validGenres.length > 0 ? validGenres : ['pop', 'rock'])
                .map(g => ({ text: g, value: g })),
            id: "exclude_genres",
            bg: "quiz-genres",
            multiple: true
        };
    }

    function createArtistQuestion(artists) {
        return {
            question: "Include any artists?",
            options: artists.map(a => ({ text: a.name, value: a.id })),
            id: "include_artists",
            bg: "quiz-artists",
            multiple: true
        };
    }

    // function createNameQuestion() {
    //     return {
    //         question: "name your playlist:",
    //         id: "playlist_name",
    //         bg: "quiz-name",
    //         type: "text"
    //     };
    // }


    function loadQuestion(index) {

        if (!questions || !questions[index]) {
            console.error("Questions array or current question is undefined.");
            return;
        }
        console.log(questions);
        console.log(questions[index]);

        const question = questions[index];

        document.body.setAttribute('data-section', question.bg);

        questionContainer.innerHTML = '';

        if (question.type === "text") {
            questionContainer.innerHTML = `
                        <h2>${question.question}</h2>
                        <input type="text" id="playlist-name-input" class="playlist-name-input">
                    `;
        } else {

            progressFill.style.width = `${((index + 1) / questions.length) * 100}%`;

            const questionBox = document.createElement('div');
            questionBox.className = 'question-box';
            questionBox.dataset.question = question.id;

            questionBox.innerHTML = `
                    <h2 class="question-text">${question.question}</h2>
                    <div class="options-container">
                        ${question.options.map(option => `
                            <button class="option-button" 
                                    data-value="${option.value}"
                                    data-multiple="${question.multiple || 'false'}">
                                ${option.text}
                            </button>
                        `).join('')}
                    </div>
                `;

            if (!question.options || !Array.isArray(question.options)) {
                console.error('Invalid options for question:', question);
                return;
            }

            questionContainer.appendChild(questionBox);
            addOptionListeners(question.multiple || false);
            updateNavigation(index);
        }
    }

    function handleInputQuestion() {
        const input = document.getElementById('playlist-name-input');
        answers.playlist_name = input.value.trim();
    }

    function addOptionListeners(multiple) {
        document.querySelectorAll('.option-button').forEach(button => {
            button.addEventListener('click', () => {
                if (multiple) {
                    button.classList.toggle('selected');
                    updateMultiAnswer(button);
                } else {
                    document.querySelectorAll('.option-button').forEach(b => b.classList.remove('selected'));
                    button.classList.add('selected');
                    updateSingleAnswer(button);
                }
            });
        });
    }

    function updateSingleAnswer(button) {
        const questionId = button.closest('.question-box').dataset.question;
        answers[questionId] = button.dataset.value;
    }

    function updateMultiAnswer(button) {
        const questionId = button.closest('.question-box').dataset.question;
        const selected = Array.from(document.querySelectorAll('.option-button.selected'))
            .map(b => b.dataset.value);
        answers[questionId] = selected;
    }

    function updateNavigation(index) {
        prevButton.classList.toggle('hidden', index === 0);
        nextButton.textContent = index === questions.length - 1 ? 'Finish' : 'Next';
    }

    function goToNextQuestion() {

        if (questions[currentQuestionIndex].type === "text") {
            handleInputQuestion();
        }
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            loadQuestion(currentQuestionIndex);
        } else {
            submitAnswers();
        }
    }

    function goToPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion(currentQuestionIndex);
        }
    }

    function submitAnswers() {
        showSection('loading');
        generateRecommendations(answers).then(playlistData => {
            showSection('results');
            displayPlaylist(playlistData);
        }).catch(error => {
            showSection('error');
            document.getElementById('error-message').textContent = error.message;
        });
    }

    function showSection(sectionId) {
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`${sectionId}-section`).classList.remove('hidden');
    }

    initQuiz();
});