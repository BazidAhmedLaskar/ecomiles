// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth()) {
        return;
    }
    
    // Initialize dashboard
    initializeDashboard();
    
    // Setup logout functionality
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

async function initializeDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update user info in header
    updateUserInfo(user);
    
    // Load and display user stats
    await loadUserStats(user.uid);
    
    // Load recent journeys
    await loadRecentJourneys(user.uid);
    
    // Initialize weekly chart
    initializeWeeklyChart();
}

function updateUserInfo(user) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    
    welcomeMessage.textContent = `Hi, ${user.name || 'there'} 👋`;
    userEmail.textContent = user.email;
    
    if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.style.display = 'block';
    } else {
        userAvatar.style.display = 'none';
    }
}

async function loadUserStats(userId) {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            updateStatCards(userData);
        } else {
            // Initialize with zero stats
            updateStatCards({
                points: 0,
                totalDistance: 0,
                roadTaxSaved: 0
            });
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        // Show default stats on error
        updateStatCards({
            points: 0,
            totalDistance: 0,
            roadTaxSaved: 0
        });
    }
}

function updateStatCards(userData) {
    const totalPoints = userData.points || 0;
    const totalDistance = userData.totalDistance || 0;
    const roadTaxSaved = userData.roadTaxSaved || 0;
    
    // Calculate CO2 saved (1 km = 0.21 kg CO2)
    const co2Saved = (totalDistance * 0.21).toFixed(1);
    
    // Update DOM elements
    document.getElementById('totalPoints').textContent = totalPoints.toLocaleString();
    document.getElementById('totalDistance').textContent = `${totalDistance.toFixed(1)} km`;
    document.getElementById('co2Saved').textContent = `${co2Saved} kg`;
    document.getElementById('roadTaxSaved').textContent = `₹${roadTaxSaved.toFixed(0)}`;
}

async function loadRecentJourneys(userId) {
    try {
        const journeysRef = db.collection('journeys')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(5);
        
        const journeysSnapshot = await journeysRef.get();
        const journeysList = document.getElementById('journeysList');
        
        if (journeysSnapshot.empty) {
            journeysList.innerHTML = `
                <p style="text-align: center; color: #666; padding: 40px;">
                    No journeys yet. <a href="journey.html">Add your first journey!</a>
                </p>
            `;
            return;
        }
        
        let journeysHtml = '';
        journeysSnapshot.forEach(doc => {
            const journey = doc.data();
            const date = journey.timestamp ? journey.timestamp.toDate() : new Date();
            const modeEmoji = getModeEmoji(journey.mode);
            
            journeysHtml += `
                <div class="journey-item" style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">
                            ${modeEmoji} ${journey.mode.charAt(0).toUpperCase() + journey.mode.slice(1)}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: #28a745; font-size: 1.1rem;">
                            +${journey.points} points
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            ${journey.distance.toFixed(1)} km
                        </div>
                    </div>
                </div>
            `;
        });
        
        journeysList.innerHTML = journeysHtml;
        
    } catch (error) {
        console.error('Error loading recent journeys:', error);
        document.getElementById('journeysList').innerHTML = `
            <p style="text-align: center; color: #666; padding: 40px;">
                Unable to load journeys. Please try refreshing the page.
            </p>
        `;
    }
}

function getModeEmoji(mode) {
    const emojiMap = {
        'walk': '🚶',
        'cycle': '🚴',
        'bus': '🚌',
        'carpool': '🚘',
        'train': '🚆',
        'metro': '🚇'
    };
    return emojiMap[mode] || '🚶';
}

async function initializeWeeklyChart() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Get last 7 days of data
        const weeklyData = await getWeeklyJourneyData(user.uid);
        
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        
        // Get labels for last 7 days
        const labels = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'EcoPoints Earned',
                    data: weeklyData,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#666'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error initializing weekly chart:', error);
        // Hide chart on error
        document.querySelector('.chart-container').style.display = 'none';
    }
}

async function getWeeklyJourneyData(userId) {
    try {
        // Get date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        const journeysRef = db.collection('journeys')
            .where('userId', '==', userId)
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(sevenDaysAgo))
            .orderBy('timestamp', 'asc');
        
        const journeysSnapshot = await journeysRef.get();
        
        // Initialize array for 7 days with 0 points
        const weeklyPoints = new Array(7).fill(0);
        const today = new Date();
        
        journeysSnapshot.forEach(doc => {
            const journey = doc.data();
            const journeyDate = journey.timestamp.toDate();
            
            // Calculate which day index this journey belongs to (0-6, where 6 is today)
            const diffTime = today.getTime() - journeyDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 0 && diffDays <= 6) {
                const dayIndex = 6 - diffDays;
                weeklyPoints[dayIndex] += journey.points || 0;
            }
        });
        
        return weeklyPoints;
        
    } catch (error) {
        console.error('Error getting weekly journey data:', error);
        return new Array(7).fill(0);
    }
}
