const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const animateSkillBars = () => {
    const skillBars = document.querySelectorAll('.skill-progress');
    const skillsSection = document.querySelector('.skills');
    
    if (!skillsSection || !skillBars.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                skillBars.forEach(bar => {
                    const width = bar.getAttribute('data-width');
                    if (width) {
                        bar.style.width = width + '%';
                    }
                });
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(skillsSection);
};

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendMessage = document.getElementById('sendMessage');

const GEMINI_API_KEY = 'AIzaSyDFDKwoblxAmd7DOwVEQppqvbNehq9QWYo'; // Apiga tegingan ko't

if (chatbotToggle && chatbotWindow && closeChatbot) {
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('active');
    });

    closeChatbot.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });
}

const sendChatMessage = async () => {
    if (!chatbotInput || !chatbotMessages) return;

    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    chatbotInput.value = '';

    const typingIndicator = addTypingIndicator();

    try {
        const response = await fetchGeminiResponse(message);
        typingIndicator.remove();
        addMessage(response, 'bot');
    } catch (error) {
        typingIndicator.remove();
        addMessage('Kechirasiz, xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.', 'bot');
        console.error('Chatbot error:', error);
    }
};

const addMessage = (text, sender) => {
    if (!chatbotMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
};

const addTypingIndicator = () => {
    if (!chatbotMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'typing');
    typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return typingDiv;
};

const fetchGeminiResponse = async (userMessage) => {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API kaliti topilmadi');
    }

    let data;
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`data.json yuklashda xato: ${response.status}`);
        }
        data = await response.json();
    } catch (error) {
        throw new Error(`data.json yuklashda xato: ${error.message}`);
    }

    const prompt = `
    Siz Dilshod Sayfiddinov haqida ma'lumot beruvchi AI yordamchisisiz. 
    Faqat quyidagi ma'lumotlar asosida javob bering:

    ISM: Dilshod Sayfiddinov
    LAVOZIM: Frontend Developer
    TAJRIBA: ${data.about?.stats[0]?.value || 'Noma\'lum'} oylik tajriba
    VIBE CODING: ${data.skills?.find(skill => skill.isSpecial)?.level || 'Noma\'lum'} mustaqil ravishda Vibe Coding bilan shug'ullangan
    KO'NIKMALAR: ${data.skills?.map(skill => `${skill.name} (${skill.level}${skill.isSpecial ? '' : '%'})`).join(', ') || 'Noma\'lum'}
    LOYIHALAR:
    ${data.projects?.map(project => `- ${project.title}: ${project.url}`).join('\n') || 'Noma\'lum'}
    BOG'LANISH: Telegram - ${data.contact?.telegram?.username || 'Noma\'lum'}

    Savolga javob bering, lekin faqat yuqoridagi ma'lumotlar doirasida qoling. 
    Agar savol ushbu ma'lumotlar doirasida bo'lmasa, "Kechirasiz, men faqat Dilshod haqidagi ma'lumotlar bilan chegaralanganman" deb javob bering.

    Savol: ${userMessage}
    `;

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!apiResponse.ok) {
        throw new Error(`API so'rovi muvaffaqiyatsiz: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    
    if (apiData.candidates && apiData.candidates[0] && apiData.candidates[0].content && apiData.candidates[0].content.parts && apiData.candidates[0].content.parts[0]) {
        return apiData.candidates[0].content.parts[0].text;
    } else {
        throw new Error('API javobi kutilgan formatda emas');
    }
};

if (sendMessage && chatbotInput) {
    sendMessage.addEventListener('click', sendChatMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.backdropFilter = 'blur(15px)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.9)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    if (!loadingScreen || !mainContent) {
        console.error('Loading screen yoki main content elementi topilmadi');
        return;
    }

    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`data.json yuklashda xato: ${response.status}`);
        }
        const data = await response.json();

        // About Section
        const aboutText = document.querySelector('.about-text');
        if (aboutText && data.about?.text) {
            data.about.text.forEach(text => {
                const p = document.createElement('p');
                p.innerHTML = text;
                aboutText.appendChild(p);
            });
        }

        const aboutStats = document.getElementById('about-stats');
        if (aboutStats && data.about?.stats) {
            data.about.stats.forEach(stat => {
                const statCard = document.createElement('div');
                statCard.classList.add('stat-card');
                statCard.innerHTML = `
                    <h3>${stat.value}</h3>
                    <p>${stat.label}</p>
                `;
                aboutStats.appendChild(statCard);
            });
        }

        // Skills Section
        const skillsGrid = document.getElementById('skills-grid');
        if (skillsGrid && data.skills) {
            data.skills.forEach(skill => {
                const skillCard = document.createElement('div');
                skillCard.classList.add('skill-card');
                if (skill.isSpecial) {
                    skillCard.classList.add('special-card');
                    skillCard.innerHTML = `
                        <div class="skill-header">
                            <h3>${skill.name}</h3>
                            <span>${skill.level}</span>
                        </div>
                        <div class="vibe-badge">
                            <i class="fas fa-star"></i>
                            <span>2 Yillik Tajriba</span>
                        </div>
                    `;
                } else {
                    skillCard.innerHTML = `
                        <div class="skill-header">
                            <h3>${skill.name}</h3>
                            <span>${skill.level}%</span>
                        </div>
                        <div class="skill-bar">
                            <div class="skill-progress" data-width="${skill.level}"></div>
                        </div>
                    `;
                }
                skillsGrid.appendChild(skillCard);
            });
        }

        // Projects Section
        const projectsGrid = document.getElementById('projects-grid');
        if (projectsGrid && data.projects) {
            data.projects.forEach(project => {
                const projectCard = document.createElement('div');
                projectCard.classList.add('project-card');
                projectCard.innerHTML = `
                    <div class="project-inner">
                        <div class="project-front">
                            <div class="project-image">
                                <img src="${project.image}" alt="${project.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWYxZjJmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPi${btoa(project.title)}</3RleHQ+PC9zdmc+'">
                            </div>
                            <div class="project-info">
                                <h3>${project.title}</h3>
                                <p>${project.description}</p>
                                <div class="project-tech">
                                    ${project.technologies.map(tech => `<span>${tech}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="project-back">
                            <h3>${project.title}</h3>
                            <p>${project.detailedDescription}</p>
                            <div class="project-links">
                                <a href="${project.url}" target="_blank" class="project-link">
                                    <i class="fas fa-external-link-alt"></i>
                                    Ko'rish
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                projectsGrid.appendChild(projectCard);
            });
        }

        // Contact Section
        const contactContent = document.getElementById('contact-content');
        if (contactContent && data.contact) {
            contactContent.innerHTML = `
                <p class="contact-description">${data.contact.description}</p>
                <a href="${data.contact.telegram.url}" target="_blank" class="telegram-button">
                    <i class="fab fa-telegram"></i>
                    Telegram: ${data.contact.telegram.username}
                </a>
            `;
        }

        // Hide loading screen and show main content
        loadingScreen.style.display = 'none';
        mainContent.style.display = 'block';
        animateSkillBars();
    } catch (error) {
        console.error('Ma\'lumotlarni yuklashda xatolik:', error);
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <img src="./images/favicon.png" alt="Dilshod Logo" class="loading-logo">
                <p>Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.</p>
            </div>
        `;
    }

    // Add styles for typing indicator
    const style = document.createElement('style');
    style.textContent = `
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        .typing-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--neon-green);
            animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Handle project image errors
    document.querySelectorAll('.project-image img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const parent = this.parentElement;
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1f1f2f, #2d2d44);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.2rem;
                text-align: center;
                padding: 1rem;
            `;
            placeholder.textContent = this.alt;
            parent.appendChild(placeholder);
        });
    });
});
