// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;

    initializeDashboard();
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

async function initializeDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    updateUserInfo(user);
    await loadUserStats(user.uid);
    await loadRecentJourneys(user.uid);
    await initializeWeeklyChart(user.uid);
}

function updateUserInfo(user) {
    document.getElementById('welcomeMessage').textContent = `Hi, ${user.name || 'User'} 👋`;
    document.getElementById('userEmail').textContent = user.email;

    const avatar = document.getElementById('userAvatar');
    if (user.photoURL) {
        avatar.src = user.photoURL;
        avatar.style.display = 'block';
    } else {
        avatar.style.display = 'none';
    }
}

async function loadUserStats(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        const data = doc.exists ? doc.data() : { points: 0, totalDistance: 0, roadTaxSaved: 0 };
        updateStatCards(data);
    } catch (err) {
        console.error('Error loading stats:', err);
        updateStatCards({ points: 0, totalDistance: 0, roadTaxSaved: 0 });
    }
}

function updateStatCards(data) {
    document.getElementById('totalPoints').textContent = data.points?.toLocaleString() || '0';
    document.getElementById('totalDistance').textContent = `${(data.totalDistance || 0).toFixed(1)} km`;
    document.getElementById('co2Saved').textContent = `${((data.totalDistance || 0) * 0.21).toFixed(1)} kg`;
    document.getElementById('roadTaxSaved').textContent = `₹${(data.roadTaxSaved || 0).toFixed(0)}`;
}

async function loadRecentJourneys(uid) {
    const list = document.getElementById('journeysList');
    try {
        const snapshot = await db.collection('journeys')
            .where('userId', '==', uid)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            list.innerHTML = `<p style="text-align:center;color:#666;padding:40px;">
                No journeys yet. <a href="journey.html">Add one</a>
            </p>`;
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const j = doc.data();
            const date = j.timestamp?.toDate() || new Date();
            const emoji = getModeEmoji(j.mode);

            html += `
            <div class="journey-item" style="background:#fff;padding:20px;margin:10px 0;border-radius:8px;box-shadow:0 1px 8px rgba(0,0,0,0.08);display:flex;justify-content:space-between;">
                <div>
                    <div style="font-weight:600">${emoji} ${capitalize(j.mode)}</div>
                    <div style="font-size:0.9rem;color:#888">${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-weight:700;color:#28a745">+${j.points} points</div>
                    <div style="font-size:0.9rem;color:#666">${j.distance.toFixed(1)} km</div>
                </div>
            </div>`;
        });

        list.innerHTML = html;
    } catch (err) {
        console.error('Journey load failed:', err);
        list.innerHTML = `<p style="text-align:center;color:#666;padding:30px;">Could not load journeys.</p>`;
    }
}

function getModeEmoji(mode) {
    return {
        walk: '🚶', cycle: '🚴', bus: '🚌',
        carpool: '🚘', train: '🚆', metro: '🚇'
    }[mode] || '🚶';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function initializeWeeklyChart(uid) {
    const canvas = document.getElementById('weeklyChart');
    const container = document.querySelector('.chart-container');
    try {
        const data = await getWeeklyJourneyData(uid);

        const labels = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('en-IN', { weekday: 'short' });
        });

        new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'EcoPoints',
                    data,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40,167,69,0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#444' },
                        grid: { color: '#eee' }
                    },
                    x: {
                        ticks: { color: '#444' },
                        grid: { display: false }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Chart error:', err);
        container.innerHTML = `<p style="text-align:center;color:#999">No journey data available for chart.</p>`;
    }
}

async function getWeeklyJourneyData(uid) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const result = Array(7).fill(0);
    try {
        const snap = await db.collection('journeys')
            .where('userId', '==', uid)
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(weekAgo))
            .orderBy('timestamp', 'asc')
            .get();

        const today = new Date();
        snap.forEach(doc => {
            const j = doc.data();
            const ts = j.timestamp?.toDate();
            const diff = Math.floor((today - ts) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 7) result[6 - diff] += j.points || 0;
        });
    } catch (e) {
        console.error('Weekly data error:', e);
    }
    return result;
}
