// Data storage (in production, this would be in a database)
let users = [];
let currentUser = null;
let events = [];
let rsvps = [];
let fundGoals = [];
let contributions = [];
let messages = [];

// Initialize app
function initApp() {
    updateUserInfo();
    populateEventSelectors();
    renderUserList();
    updateDashboard();
}

// Tab functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    // Fix: Use proper event parameter instead of global event
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Update content when switching tabs
    if (tabName === 'events') renderEventsList();
    if (tabName === 'wedding') renderRSVPList();
    if (tabName === 'funding') renderFundGoals();
    if (tabName === 'messages') renderMessages();
    if (tabName === 'dashboard') updateDashboard();
}

// Account Management
function createAccount() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const partner = document.getElementById('partnerName').value;
    const type = document.getElementById('accountType').value;
    
    if (!name || !email) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        alert('Email already exists');
        return;
    }
    
    const user = {
        id: Date.now(),
        name: name,
        email: email,
        partner: partner,
        type: type,
        createdAt: new Date().toLocaleDateString()
    };
    
    users.push(user);
    currentUser = user;
    
    // Clear form
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('partnerName').value = '';
    
    updateUserInfo();
    renderUserList();
    populateEventSelectors();
    alert('Account created successfully!');
}

function loginUser() {
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
        alert('Please enter an email');
        return;
    }
    
    const user = users.find(u => u.email === email);
    
    if (user) {
        currentUser = user;
        updateUserInfo();
        populateEventSelectors();
        alert('Logged in successfully!');
        document.getElementById('loginEmail').value = '';
    } else {
        alert('User not found');
    }
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (currentUser) {
        userInfo.innerHTML = `
            <h3>Welcome, ${currentUser.name}!</h3>
            <p>Account Type: ${currentUser.type}</p>
            ${currentUser.partner ? `<p>Partner: ${currentUser.partner}</p>` : ''}
            <button class="btn btn-secondary" onclick="logout()">Logout</button>
        `;
    } else {
        userInfo.innerHTML = `
            <h3>Welcome back!</h3>
            <p>Please create an account or log in to get started</p>
        `;
    }
}

function logout() {
    currentUser = null;
    updateUserInfo();
    // Clear all dynamic content
    populateEventSelectors();
    renderEventsList();
    renderRSVPList();
    renderFundGoals();
    renderMessages();
    updateDashboard();
    alert('Logged out successfully!');
}

function renderUserList() {
    const userList = document.getElementById('userList');
    userList.innerHTML = users.map(user => `
        <div class="card">
            <strong>${user.name}</strong><br>
            <small>${user.email} - ${user.type}</small>
        </div>
    `).join('');
}

// Event Management
function createEvent() {
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    const type = document.getElementById('eventType').value;
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const location = document.getElementById('eventLocation').value;
    const description = document.getElementById('eventDescription').value;
    
    if (!title || !date) {
        alert('Please fill in required fields');
        return;
    }
    
    const event = {
        id: Date.now(),
        userId: currentUser.id,
        type: type,
        title: title,
        date: date,
        location: location,
        description: description,
        createdBy: currentUser.name
    };
    
    events.push(event);
    
    // Clear form
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventDescription').value = '';
    
    renderEventsList();
    populateEventSelectors();
    alert('Event created successfully!');
}

function renderEventsList() {
    const eventsList = document.getElementById('eventsList');
    if (!currentUser) {
        eventsList.innerHTML = '<p>Please log in to view your events.</p>';
        return;
    }
    
    const userEvents = events.filter(e => e.userId === currentUser.id);
    
    eventsList.innerHTML = userEvents.map(event => `
        <div class="card">
            <h4>${event.title}</h4>
            <p><strong>Type:</strong> ${event.type}</p>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> ${event.location || 'No location specified'}</p>
            <p>${event.description || 'No description provided'}</p>
            <button class="btn btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
        </div>
    `).join('') || '<p>No events created yet.</p>';
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        events = events.filter(e => e.id !== eventId);
        // Also remove related RSVPs, fund goals, and contributions
        rsvps = rsvps.filter(r => r.eventId !== eventId);
        fundGoals = fundGoals.filter(f => f.eventId !== eventId);
        contributions = contributions.filter(c => c.eventId !== eventId);
        
        renderEventsList();
        populateEventSelectors();
        renderRSVPList();
        renderFundGoals();
        updateDashboard();
    }
}

function populateEventSelectors() {
    const selectors = ['rsvpEventSelect', 'fundEventSelect'];
    const userEvents = currentUser ? events.filter(e => e.userId === currentUser.id) : [];
    
    selectors.forEach(selectorId => {
        const selector = document.getElementById(selectorId);
        if (selector) {
            selector.innerHTML = userEvents.map(event => 
                `<option value="${event.id}">${event.title}</option>`
            ).join('') || '<option value="">No events available</option>';
        }
    });
    
    // Populate message recipient selector with couples
    const messageRecipient = document.getElementById('messageRecipient');
    if (messageRecipient) {
        const couples = users.filter(u => u.type === 'couple');
        messageRecipient.innerHTML = couples.map(user => 
            `<option value="${user.id}">${user.name}${user.partner ? ' & ' + user.partner : ''}</option>`
        ).join('') || '<option value="">No couples available</option>';
    }
}

// RSVP Management
function sendRSVP() {
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    const guestName = document.getElementById('guestName').value;
    const guestEmail = document.getElementById('guestEmail').value;
    const eventId = document.getElementById('rsvpEventSelect').value;
    
    if (!guestName || !guestEmail || !eventId) {
        alert('Please fill in all fields');
        return;
    }
    
    alert(`RSVP invitation sent to ${guestName} (${guestEmail})`);
    
    // Clear form
    document.getElementById('guestName').value = '';
    document.getElementById('guestEmail').value = '';
}

function respondRSVP() {
    const respondentName = document.getElementById('respondentName').value;
    const response = document.getElementById('rsvpResponse').value;
    const guestCount = document.getElementById('guestCount').value;
    const eventId = document.getElementById('rsvpEventSelect').value;
    
    if (!respondentName || !eventId) {
        alert('Please fill in all fields');
        return;
    }
    
    const rsvp = {
        id: Date.now(),
        eventId: parseInt(eventId),
        guestName: respondentName,
        response: response,
        guestCount: parseInt(guestCount),
        respondedAt: new Date().toLocaleDateString()
    };
    
    rsvps.push(rsvp);
    
    // Clear form
    document.getElementById('respondentName').value = '';
    document.getElementById('guestCount').value = '1';
    
    renderRSVPList();
    updateDashboard();
    alert('RSVP response submitted!');
}

function renderRSVPList() {
    const rsvpList = document.getElementById('rsvpList');
    if (!currentUser) {
        rsvpList.innerHTML = '<p>Please log in to view RSVPs.</p>';
        return;
    }
    
    const eventRSVPs = rsvps.filter(r => {
        const event = events.find(e => e.id === r.eventId);
        return event && event.userId === currentUser.id;
    });
    
    rsvpList.innerHTML = eventRSVPs.map(rsvp => {
        const event = events.find(e => e.id === rsvp.eventId);
        return `
            <div class="rsvp-card ${rsvp.response}">
                <h4>${rsvp.guestName}</h4>
                <p><strong>Event:</strong> ${event?.title || 'Unknown Event'}</p>
                <p><strong>Guests:</strong> ${rsvp.guestCount}</p>
                <span class="status-badge status-${rsvp.response}">${rsvp.response}</span>
                <p><small>Responded: ${rsvp.respondedAt}</small></p>
            </div>
        `;
    }).join('') || '<p>No RSVP responses yet.</p>';
}

// Fund Goals Management
function setFundGoal() {
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    const eventId = document.getElementById('fundEventSelect').value;
    const goal = document.getElementById('fundGoal').value;
    const description = document.getElementById('fundDescription').value;
    
    if (!eventId || !goal) {
        alert('Please fill in required fields');
        return;
    }
    
    // Check if fund goal already exists for this event
    if (fundGoals.find(f => f.eventId === parseInt(eventId) && f.userId === currentUser.id)) {
        alert('Fund goal already exists for this event');
        return;
    }
    
    const fundGoal = {
        id: Date.now(),
        eventId: parseInt(eventId),
        userId: currentUser.id,
        goal: parseFloat(goal),
        description: description,
        raised: 0,
        createdAt: new Date().toLocaleDateString()
    };
    
    fundGoals.push(fundGoal);
    
    // Clear form
    document.getElementById('fundGoal').value = '';
    document.getElementById('fundDescription').value = '';
    
    renderFundGoals();
    updateDashboard();
    alert('Fund goal set successfully!');
}

function makeContribution() {
    const contributorName = document.getElementById('contributorName').value;
    const amount = document.getElementById('contributionAmount').value;
    const message = document.getElementById('contributionMessage').value;
    const eventId = document.getElementById('fundEventSelect').value;
    
    if (!contributorName || !amount || !eventId) {
        alert('Please fill in required fields');
        return;
    }
    
    const contributionAmount = parseFloat(amount);
    if (contributionAmount <= 0) {
        alert('Please enter a valid contribution amount');
        return;
    }
    
    const contribution = {
        id: Date.now(),
        eventId: parseInt(eventId),
        contributorName: contributorName,
        amount: contributionAmount,
        message: message,
        contributedAt: new Date().toLocaleDateString()
    };
    
    contributions.push(contribution);
    
    // Update the fund goal raised amount
    const fundGoal = fundGoals.find(f => f.eventId === parseInt(eventId));
    if (fundGoal) {
        fundGoal.raised += contributionAmount;
    }
    
    // Clear form
    document.getElementById('contributorName').value = '';
    document.getElementById('contributionAmount').value = '';
    document.getElementById('contributionMessage').value = '';
    
    renderFundGoals();
    updateDashboard();
    alert('Contribution made successfully!');
}

function renderFundGoals() {
    const fundGoalsList = document.getElementById('fundGoalsList');
    if (!currentUser) {
        fundGoalsList.innerHTML = '<p>Please log in to view fund goals.</p>';
        return;
    }
    
    const userFundGoals = fundGoals.filter(f => f.userId === currentUser.id);
    
    fundGoalsList.innerHTML = userFundGoals.map(fundGoal => {
        const event = events.find(e => e.id === fundGoal.eventId);
        const percentage = Math.min((fundGoal.raised / fundGoal.goal) * 100, 100);
        const eventContributions = contributions.filter(c => c.eventId === fundGoal.eventId);
        
        return `
            <div class="card">
                <h4>${event?.title || 'Unknown Event'}</h4>
                <p>${fundGoal.description}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <p><strong>$${fundGoal.raised.toFixed(2)} of $${fundGoal.goal.toFixed(2)} (${percentage.toFixed(1)}%)</strong></p>
                
                ${eventContributions.length > 0 ? `
                    <h5>Recent Contributions:</h5>
                    ${eventContributions.slice(-3).map(c => `
                        <div style="background: #f8f9fa; padding: 8px; margin: 5px 0; border-radius: 5px;">
                            <strong>${c.contributorName}</strong> - $${c.amount.toFixed(2)}
                            ${c.message ? `<br><em>"${c.message}"</em>` : ''}
                        </div>
                    `).join('')}
                ` : '<p><em>No contributions yet.</em></p>'}
            </div>
        `;
    }).join('') || '<p>No fund goals set yet.</p>';
}

// Messages Management
function sendMessage() {
    const sender = document.getElementById('messageSender').value;
    const recipientId = document.getElementById('messageRecipient').value;
    const content = document.getElementById('messageContent').value;
    
    if (!sender || !recipientId || !content) {
        alert('Please fill in all fields');
        return;
    }
    
    const message = {
        id: Date.now(),
        senderId: null, // Anonymous sender for contributors
        senderName: sender,
        recipientId: parseInt(recipientId),
        content: content,
        sentAt: new Date().toLocaleDateString(),
        isReply: false
    };
    
    messages.push(message);
    
    // Clear form
    document.getElementById('messageSender').value = '';
    document.getElementById('messageContent').value = '';
    
    renderMessages();
    updateDashboard();
    alert('Message sent successfully!');
}

function replyMessage() {
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    const replyContent = document.getElementById('replyContent').value;
    
    if (!replyContent) {
        alert('Please enter a reply message');
        return;
    }
    
    // Get the last message sent to current user
    const lastMessage = messages.filter(m => m.recipientId === currentUser.id).pop();
    
    if (!lastMessage) {
        alert('No messages to reply to');
        return;
    }
    
    const reply = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: null, // Reply to contributor (anonymous)
        recipientName: lastMessage.senderName,
        content: replyContent,
        sentAt: new Date().toLocaleDateString(),
        isReply: true,
        originalMessageId: lastMessage.id
    };
    
    messages.push(reply);
    
    // Clear form
    document.getElementById('replyContent').value = '';
    
    renderMessages();
    updateDashboard();
    alert('Reply sent successfully!');
}

function renderMessages() {
    const messageThread = document.getElementById('messageThread');
    if (!currentUser) {
        messageThread.innerHTML = '<p>Please log in to view messages.</p>';
        return;
    }
    
    const userMessages = messages.filter(m => 
        m.recipientId === currentUser.id || m.senderId === currentUser.id
    );
    
    messageThread.innerHTML = userMessages.map(message => `
        <div class="message ${message.senderId === currentUser.id ? 'sent' : 'received'}">
            <strong>${message.senderName}${message.recipientName ? ' → ' + message.recipientName : ''}</strong>
            <p>${message.content}</p>
            <small>${message.sentAt}</small>
        </div>
    `).join('') || '<p>No messages yet.</p>';
    
    // Scroll to bottom
    messageThread.scrollTop = messageThread.scrollHeight;
}

// Dashboard Management
function updateDashboard() {
    // Update stats
    const totalEventsEl = document.getElementById('totalEvents');
    const totalRSVPsEl = document.getElementById('totalRSVPs');
    const totalContributionsEl = document.getElementById('totalContributions');
    const totalMessagesEl = document.getElementById('totalMessages');
    
    if (currentUser) {
        const userEvents = events.filter(e => e.userId === currentUser.id);
        const userRSVPs = rsvps.filter(r => {
            const event = events.find(e => e.id === r.eventId);
            return event && event.userId === currentUser.id;
        });
        const userContributions = contributions.filter(c => {
            const event = events.find(e => e.id === c.eventId);
            return event && event.userId === currentUser.id;
        });
        const userMessages = messages.filter(m => m.recipientId === currentUser.id || m.senderId === currentUser.id);
        
        const totalRaised = userContributions.reduce((sum, c) => sum + c.amount, 0);
        
        if (totalEventsEl) totalEventsEl.textContent = userEvents.length;
        if (totalRSVPsEl) totalRSVPsEl.textContent = userRSVPs.length;
        if (totalContributionsEl) totalContributionsEl.textContent = `$${totalRaised.toFixed(2)}`;
        if (totalMessagesEl) totalMessagesEl.textContent = userMessages.length;
    } else {
        if (totalEventsEl) totalEventsEl.textContent = '0';
        if (totalRSVPsEl) totalRSVPsEl.textContent = '0';
        if (totalContributionsEl) totalContributionsEl.textContent = '$0';
        if (totalMessagesEl) totalMessagesEl.textContent = '0';
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', initApp);