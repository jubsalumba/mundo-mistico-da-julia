/* ==========================================================================
   0. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    deleteDoc, 
    updateDoc, 
    arrayUnion, 
    arrayRemove, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBsEnFacKXwcC6TTmkPvqKAaVvyvKzc9BU",
    authDomain: "mundomisticodajubs.firebaseapp.com",
    projectId: "mundomisticodajubs",
    storageBucket: "mundomisticodajubs.firebasestorage.app",
    messagingSenderId: "431665976496",
    appId: "1:431665976496:web:1924e0b1bc8d1741685775",
    measurementId: "G-9H6JDSSS3B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let isSignUpMode = false;

// CAMINHO PADRÃO DA IMAGEM SEM BARRA NO INÍCIO PARA COMPATIBILIDADE COM GITHUB PAGES
const DEFAULT_AVATAR = "./img/perfil.jpeg";

/* ==========================================================================
   1. SELEÇÃO DE ELEMENTOS DO DOM
   ========================================================================== */
const modeToggle = document.querySelector('#themeToggle, .mode');
const morcegin = document.querySelector('.morcegin');
const sidebar = document.querySelector('.sidebar');
const sidebarToggleBtn = document.querySelector('#sidebarToggle, .toggle-btn');
const sidebarEditProfileBtn = document.querySelector('#sidebarEditProfileBtn');

const searchInput = document.querySelector('#searchInput, .search-txt');
const searchBtn = document.querySelector('#searchBtn, .search-btn');

const profileName = document.querySelector('#profileName, .profile-card h3');
const profileHandle = document.querySelector('#profileHandle');
const profileBio = document.querySelector('#profileBio, .profile-bio');
const profileImg = document.querySelector('#profileImg');
const changeAvatarBtn = document.querySelector('#changeAvatarBtn');
const avatarFileInput = document.querySelector('#avatarFileInput');

const musicList = document.querySelector('#musicList');
const readingList = document.querySelector('#readingList');
const moviesList = document.querySelector('#moviesList');

const openEditModalBtn = document.querySelector('#openEditModalBtn, .btn-edit-profile');
const profileModalOverlay = document.querySelector('#profileModalOverlay, .profile-modal-overlay');
const closeModalBtn = document.querySelector('#closeModalBtn');
const cancelModalBtn = document.querySelector('#cancelModalBtn');
const editProfileForm = document.querySelector('#editProfileForm');

const editNameInput = document.querySelector('#editName');
const editHandleInput = document.querySelector('#editHandle');
const editBioInput = document.querySelector('#editBio');
const editMusicInput = document.querySelector('#editMusic');
const editReadingInput = document.querySelector('#editReading');
const editMoviesInput = document.querySelector('#editMovies');

const journalTitleInput = document.querySelector('#journalTitle, .journal-title-input');
const journalContentTextarea = document.querySelector('#journalContent, .journal-content-textarea');
const journalDateSpan = document.querySelector('#journalDate');
const btnSaveJournal = document.querySelector('#saveJournalBtn, .btn-save-journal');
const btnDeleteJournal = document.querySelector('#deleteJournalBtn, .btn-delete-journal');
const btnNewPage = document.querySelector('#addJournalPageBtn, .btn-new-page');
const journalPagesList = document.querySelector('#journalPagesList, .journal-pages-list');

const btnRefreshAffirmations = document.querySelector('#nextAffirmationSetBtn, .btn-refresh-affirmations');
const lightAffirmationsList = document.querySelector('#lightAffirmationsList, .affirmations-list');

const toastNotification = document.querySelector('#toastNotification');
const toastMessage = document.querySelector('#toastMessage');

// Auth DOM
const authModalOverlay = document.querySelector('#authModalOverlay');
const authForm = document.querySelector('#authForm');
const authEmail = document.querySelector('#authEmail');
const authPassword = document.querySelector('#authPassword');
const authModalTitle = document.querySelector('#authModalTitle');
const submitAuthBtn = document.querySelector('#submitAuthBtn');
const toggleAuthModeBtn = document.querySelector('#toggleAuthModeBtn');
const closeAuthModalBtn = document.querySelector('#closeAuthModalBtn');
const googleAuthBtn = document.querySelector('#googleAuthBtn');

// Comentários DOM
const commentInput = document.querySelector('#commentInput');
const postCommentBtn = document.querySelector('#postCommentBtn');
const commentsList = document.querySelector('#commentsList');


/* ==========================================================================
   2. SISTEMA DE NOTIFICAÇÃO (TOAST)
   ========================================================================== */
function showToast(message) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotification.classList.add('show');
    
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}


/* ==========================================================================
   3. SIDEBAR E MODO ESCURO / CLARO
   ========================================================================== */
if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

if (sidebarEditProfileBtn) {
    sidebarEditProfileBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) sidebar.classList.remove('active');
        openProfileModal();
    });
}

if (modeToggle) {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        modeToggle.classList.replace('fa-moon', 'fa-sun');
        if (morcegin) morcegin.classList.add('morcegin-dark');
    }

    modeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');

        if (isDark) {
            modeToggle.classList.replace('fa-moon', 'fa-sun');
            if (morcegin) morcegin.classList.add('morcegin-dark');
            localStorage.setItem('theme', 'dark');
        } else {
            modeToggle.classList.replace('fa-sun', 'fa-moon');
            if (morcegin) morcegin.classList.remove('morcegin-dark');
            localStorage.setItem('theme', 'light');
        }
    });
}


/* ==========================================================================
   4. SISTEMA DE BUSCA
   ========================================================================== */
function performSearch() {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const targets = document.querySelectorAll('section, h1, h2, h3, h4, .bc-card, .mentor-card, .info-block, .video-card');
    let foundElement = null;

    for (let el of targets) {
        if (el.textContent.toLowerCase().includes(query)) {
            foundElement = el;
            break;
        }
    }

    if (foundElement) {
        foundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        foundElement.classList.add('highlight-search');

        setTimeout(() => {
            foundElement.classList.remove('highlight-search');
        }, 2500);

        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    } else {
        showToast(`Nenhum resultado encontrado para: "${query}"`);
    }
}

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}


/* ==========================================================================
   5. AUTENTICAÇÃO
   ========================================================================== */
function openAuthModal() {
    if (authModalOverlay) authModalOverlay.classList.add('active');
}

function closeAuthModal() {
    if (authModalOverlay) authModalOverlay.classList.remove('active');
}

if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeAuthModal);

if (toggleAuthModeBtn) {
    toggleAuthModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        if (authModalTitle) authModalTitle.textContent = isSignUpMode ? "Criar Conta Mística" : "Acessar Conta Mística";
        if (submitAuthBtn) submitAuthBtn.textContent = isSignUpMode ? "Cadastrar" : "Entrar";
        toggleAuthModeBtn.textContent = isSignUpMode ? "Já tem conta? Faça Login" : "Não tem conta? Cadastre-se";
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = authEmail.value;
        const password = authPassword.value;

        try {
            if (isSignUpMode) {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                await saveDefaultUserData(res.user);
                showToast("Conta criada com sucesso!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                showToast("Login realizado com sucesso!");
            }
            closeAuthModal();
        } catch (err) {
            showToast(`Erro: ${err.message}`);
        }
    });
}

if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const res = await signInWithPopup(auth, provider);
            const userDoc = await getDoc(doc(db, "users", res.user.uid));
            if (!userDoc.exists()) {
                await saveDefaultUserData(res.user);
            }
            closeAuthModal();
            showToast("Conectado via Google!");
        } catch (err) {
            showToast(`Erro Google: ${err.message}`);
        }
    });
}

async function saveDefaultUserData(user) {
    const defaultData = {
        name: user.displayName || "Iniciado Místico",
        handle: `@${user.uid.substring(0, 6)}`,
        bio: "Explorando os caminhos da imaginação...",
        avatar: user.photoURL || DEFAULT_AVATAR,
        music: ["Neville Goddard - Palestras", "Frequência 432Hz - Elevação"],
        reading: ["O Sentimento é o Segredo - Neville Goddard"],
        movies: ["Matrix", "Interestelar"]
    };
    await setDoc(doc(db, "users", user.uid), defaultData);
}

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        await loadUserDataCloud(user.uid);
        await loadJournalCloud(user.uid);
    } else {
        loadUserProfileLocal();
        loadJournalLocal();
    }
});


/* ==========================================================================
   6. PERFIL DE USUÁRIO
   ========================================================================== */
async function loadUserDataCloud(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (profileName) profileName.textContent = data.name;
            if (profileHandle) profileHandle.textContent = data.handle;
            if (profileBio) profileBio.textContent = data.bio;
            if (profileImg) profileImg.src = data.avatar || DEFAULT_AVATAR;

            if (musicList) renderListItems(musicList, data.music || [], 'fa-heart');
            if (readingList) renderListItems(readingList, data.reading || [], 'fa-bookmark');
            if (moviesList) renderListItems(moviesList, data.movies || [], 'fa-star');
        }
    } catch (err) {
        console.error("Erro ao carregar do Firestore:", err);
        loadUserProfileLocal();
    }
}

function loadUserProfileLocal() {
    const savedData = JSON.parse(localStorage.getItem('user_profile_data'));
    if (!savedData) {
        if (profileImg) profileImg.src = DEFAULT_AVATAR;
        return;
    }

    if (savedData.name && profileName) profileName.textContent = savedData.name;
    if (savedData.handle && profileHandle) profileHandle.textContent = savedData.handle;
    if (savedData.bio && profileBio) profileBio.textContent = savedData.bio;
    if (profileImg) profileImg.src = savedData.avatar || DEFAULT_AVATAR;

    if (savedData.music && musicList) renderListItems(musicList, savedData.music, 'fa-heart');
    if (savedData.reading && readingList) renderListItems(readingList, savedData.reading, 'fa-bookmark');
    if (savedData.movies && moviesList) renderListItems(moviesList, savedData.movies, 'fa-star');
}

function renderListItems(container, itemsArray, iconClass) {
    container.innerHTML = '';
    itemsArray.forEach(item => {
        const parts = item.split('-');
        const title = parts[0] ? parts[0].trim() : item;
        const sub = parts[1] ? parts[1].trim() : '';

        const li = document.createElement('li');
        li.innerHTML = `
            <i class="fa-solid ${iconClass}"></i>
            <div><strong>${title}</strong>${sub ? ` — <em>${sub}</em>` : ''}</div>
        `;
        container.appendChild(li);
    });
}

function getArrayFromListContainer(container) {
    const items = [];
    if (!container) return items;
    container.querySelectorAll('li').forEach(li => {
        const strong = li.querySelector('strong');
        const em = li.querySelector('em');
        if (strong) {
            let text = strong.textContent.trim();
            if (em) text += ` - ${em.textContent.trim()}`;
            items.push(text);
        }
    });
    return items;
}

// PERMITE ABRIR O MODAL MESMO SEM LOGIN (SALVA NO LOCALSTORAGE)
function openProfileModal() {
    if (!profileModalOverlay) return;

    if (editNameInput && profileName) editNameInput.value = profileName.textContent.trim();
    if (editHandleInput && profileHandle) editHandleInput.value = profileHandle.textContent.trim();
    if (editBioInput && profileBio) editBioInput.value = profileBio.textContent.trim();

    if (editMusicInput && musicList) editMusicInput.value = getArrayFromListContainer(musicList).join('\n');
    if (editReadingInput && readingList) editReadingInput.value = getArrayFromListContainer(readingList).join('\n');
    if (editMoviesInput && moviesList) editMoviesInput.value = getArrayFromListContainer(moviesList).join('\n');

    profileModalOverlay.classList.add('active');
}

function closeProfileModal() {
    if (profileModalOverlay) profileModalOverlay.classList.remove('active');
}

if (openEditModalBtn) openEditModalBtn.addEventListener('click', openProfileModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeProfileModal);
if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeProfileModal);

// ALTERAR FOTO DE PERFIL LOCALMENTE (BASE64)
if (changeAvatarBtn && avatarFileInput) {
    changeAvatarBtn.addEventListener('click', () => avatarFileInput.click());
}

if (avatarFileInput && profileImg) {
    avatarFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast("A imagem deve ter no máximo 2MB!");
                return;
            }
            const reader = new FileReader();
            reader.onload = function (event) {
                profileImg.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newName = editNameInput.value.trim();
        const newHandle = editHandleInput.value.trim();
        const newBio = editBioInput.value.trim();

        const musicArr = editMusicInput.value.split('\n').filter(line => line.trim() !== '');
        const readingArr = editReadingInput.value.split('\n').filter(line => line.trim() !== '');
        const moviesArr = editMoviesInput.value.split('\n').filter(line => line.trim() !== '');

        const profileData = {
            name: newName,
            handle: newHandle.startsWith('@') ? newHandle : `@${newHandle}`,
            bio: newBio,
            avatar: profileImg ? profileImg.src : DEFAULT_AVATAR,
            music: musicArr,
            reading: readingArr,
            movies: moviesArr
        };

        if (currentUser) {
            try {
                await setDoc(doc(db, "users", currentUser.uid), profileData, { merge: true });
                await loadUserDataCloud(currentUser.uid);
            } catch (err) {
                console.error("Erro ao salvar no Firebase, salvando localmente:", err);
                localStorage.setItem('user_profile_data', JSON.stringify(profileData));
                loadUserProfileLocal();
            }
        } else {
            localStorage.setItem('user_profile_data', JSON.stringify(profileData));
            loadUserProfileLocal();
        }

        closeProfileModal();
        showToast("Perfil atualizado com sucesso!");
    });
}


/* ==========================================================================
   7. DIÁRIO MÍSTICO
   ========================================================================== */
let journalEntries = [];
let activePageIndex = 0;

function updateJournalDate() {
    if (!journalDateSpan) return;
    const now = new Date();
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    journalDateSpan.innerHTML = `<i class="fa-regular fa-calendar"></i> ${now.toLocaleDateString('pt-BR', options)}`;
}

async function loadJournalCloud(uid) {
    try {
        const journalRef = doc(db, "journals", uid);
        const snap = await getDoc(journalRef);

        if (snap.exists()) {
            journalEntries = snap.data().entries || [];
        } else {
            journalEntries = [{ title: "Minha Primeira Leitura", content: "Senti uma conexão mágica hoje..." }];
            await setDoc(journalRef, { entries: journalEntries });
        }
        loadJournalEntry(0);
    } catch (err) {
        loadJournalLocal();
    }
}

function loadJournalLocal() {
    const savedJournal = JSON.parse(localStorage.getItem('mystic_journal'));
    if (savedJournal && savedJournal.length > 0) {
        journalEntries = savedJournal;
    } else {
        journalEntries = [{ title: "Minha Primeira Leitura", content: "Senti uma conexão mágica hoje..." }];
    }
    loadJournalEntry(0);
}

function renderJournalList() {
    if (!journalPagesList) return;
    journalPagesList.innerHTML = '';

    journalEntries.forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = index === activePageIndex ? 'active' : '';
        li.innerHTML = `<i class="fa-solid fa-book-open"></i> <span>${entry.title || 'Página Sem Título'}</span>`;
        li.addEventListener('click', () => loadJournalEntry(index));
        journalPagesList.appendChild(li);
    });
}

function loadJournalEntry(index) {
    activePageIndex = index;
    if (journalEntries[index]) {
        if (journalTitleInput) journalTitleInput.value = journalEntries[index].title;
        if (journalContentTextarea) journalContentTextarea.value = journalEntries[index].content;
    }
    renderJournalList();
}

if (btnSaveJournal) {
    btnSaveJournal.addEventListener('click', async () => {
        if (journalEntries.length === 0) {
            journalEntries.push({ title: "", content: "" });
            activePageIndex = 0;
        }

        journalEntries[activePageIndex] = {
            title: journalTitleInput ? journalTitleInput.value.trim() || "Página Sem Título" : "Página Sem Título",
            content: journalContentTextarea ? journalContentTextarea.value.trim() : ""
        };

        if (currentUser) {
            await setDoc(doc(db, "journals", currentUser.uid), { entries: journalEntries });
        } else {
            localStorage.setItem('mystic_journal', JSON.stringify(journalEntries));
        }
        renderJournalList();
        showToast("Diário salvo com sucesso!");
    });
}

if (btnNewPage) {
    btnNewPage.addEventListener('click', () => {
        journalEntries.push({ title: "Nova Página", content: "" });
        activePageIndex = journalEntries.length - 1;
        loadJournalEntry(activePageIndex);
        showToast("Nova página adicionada!");
    });
}

if (btnDeleteJournal) {
    btnDeleteJournal.addEventListener('click', async () => {
        if (journalEntries.length <= 1) {
            showToast("Você deve manter pelo menos uma página.");
            return;
        }
        journalEntries.splice(activePageIndex, 1);
        activePageIndex = 0;

        if (currentUser) {
            await setDoc(doc(db, "journals", currentUser.uid), { entries: journalEntries });
        } else {
            localStorage.setItem('mystic_journal', JSON.stringify(journalEntries));
        }
        loadJournalEntry(0);
        showToast("Página excluída.");
    });
}


/* ==========================================================================
   8. COMENTÁRIOS DA COMUNIDADE
   ========================================================================== */
if (postCommentBtn) {
    postCommentBtn.addEventListener('click', async () => {
        if (!currentUser) {
            showToast("Faça login para publicar comentários!");
            openAuthModal();
            return;
        }

        const text = commentInput.value.trim();
        if (!text) return;

        try {
            await addDoc(collection(db, "comments"), {
                authorId: currentUser.uid,
                authorName: profileName ? profileName.textContent : "Místico",
                authorAvatar: profileImg ? profileImg.src : DEFAULT_AVATAR,
                text: text,
                createdAt: serverTimestamp(),
                likes: []
            });
            commentInput.value = '';
            showToast("Comentário publicado!");
        } catch (err) {
            showToast("Erro ao publicar comentário.");
        }
    });
}

function listenToComments() {
    if (!commentsList) return;

    const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        commentsList.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const commentId = docSnap.id;
            const isOwner = currentUser && currentUser.uid === data.authorId;
            const likesCount = data.likes ? data.likes.length : 0;
            const hasLiked = currentUser && data.likes && data.likes.includes(currentUser.uid);

            const commentCard = document.createElement('div');
            commentCard.className = 'video-card';
            commentCard.style.cssText = 'padding: 2rem; position: relative; border-radius: 15px; margin-bottom: 1.5rem;';

            commentCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1rem;">
                    <img src="${data.authorAvatar || DEFAULT_AVATAR}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <strong style="font-size: 1.6rem; color: var(--text-color, #fff);">${data.authorName}</strong>
                    </div>
                </div>
                <p style="font-size: 1.5rem; line-height: 1.5; color: var(--text-color, #fff); margin-bottom: 1.5rem;">${data.text}</p>
                <div style="display: flex; gap: 1.5rem; align-items: center;">
                    <button class="btn-like" style="background: transparent; border: none; color: ${hasLiked ? '#ffef3e' : 'inherit'}; cursor: pointer; font-size: 1.4rem;">
                        <i class="fa-solid fa-heart"></i> ${likesCount}
                    </button>
                    ${isOwner ? `<button class="btn-delete-comment" style="background: transparent; border: none; color: #ffb3b3; cursor: pointer; font-size: 1.4rem;"><i class="fa-solid fa-trash"></i> Excluir</button>` : ''}
                </div>
            `;

            const likeBtn = commentCard.querySelector('.btn-like');
            likeBtn.addEventListener('click', async () => {
                if (!currentUser) return openAuthModal();
                const docRef = doc(db, "comments", commentId);
                if (hasLiked) {
                    await updateDoc(docRef, { likes: arrayRemove(currentUser.uid) });
                } else {
                    await updateDoc(docRef, { likes: arrayUnion(currentUser.uid) });
                }
            });

            if (isOwner) {
                const deleteBtn = commentCard.querySelector('.btn-delete-comment');
                deleteBtn.addEventListener('click', async () => {
                    await deleteDoc(doc(db, "comments", commentId));
                    showToast("Comentário excluído.");
                });
            }

            commentsList.appendChild(commentCard);
        });
    }, (err) => {
        console.warn("Sem permissão ou erro ao carregar comentários:", err);
    });
}


/* ==========================================================================
   9. GERADOR DE AFIRMAÇÕES
   ========================================================================== */
const databaseAffirmations = [
    "Eu sou a presença divina em perfeita manifestação física.",
    "Eu vivo a partir da consciência de que já sou aquilo que desejo ser.",
    "Minha imaginação é a própria força criadora do Universo.",
    "Tudo o que eu assumo como verdadeiro torna-se minha realidade visível.",
    "Eu habito o estado do meu desejo cumprido com fé inabalável.",
    "A abundância e a prosperidade fluem para mim de formas ilimitadas.",
    "Eu sou um ímã irresistível para a riqueza e a fartura.",
    "Eu sou profundamente amado, respeitado e valorizado por todos.",
    "Meu corpo é um templo sagrado de saúde, energia e vitalidade.",
    "Eu sou seguro, confiante e capaz de realizar qualquer feito."
];

function generateRandomAffirmations() {
    if (!lightAffirmationsList) return;
    const shuffled = [...databaseAffirmations].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    lightAffirmationsList.innerHTML = '';
    selected.forEach(text => {
        const li = document.createElement('li');
        li.textContent = `"${text}"`;
        lightAffirmationsList.appendChild(li);
    });
}

if (btnRefreshAffirmations) {
    btnRefreshAffirmations.addEventListener('click', () => {
        generateRandomAffirmations();
        showToast("Novas afirmações geradas!");
    });
}


/* ==========================================================================
   10. INICIALIZAÇÃO GERAL
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    updateJournalDate();
    generateRandomAffirmations();
    listenToComments();
});
