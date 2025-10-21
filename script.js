const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');

// DOM elementlari
const aboutTextContainer = document.querySelector('.about-text');
const aboutStatsContainer = document.getElementById('about-stats');
const skillsGridContainer = document.getElementById('skills-grid');
const projectsGridContainer = document.getElementById('projects-grid');
const contactContentContainer = document.getElementById('contact-content');


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
                    const level = bar.getAttribute('data-level');
                    bar.style.width = level + '%';
                });
                observer.unobserve(skillsSection); // Animationdan keyin kuzatishni to'xtatish
            }
        });
    }, {
        threshold: 0.1
    });

    observer.observe(skillsSection);
};

// --------------------------------------------------------
// DATA.JSON DAN SAHIFANI TO'LDIRISH MANTIQI
// --------------------------------------------------------

const loadDataAndRenderPage = async () => {
    let data;
    try {
        const response = await fetch('./data.json'); 
        
        if (!response.ok) {
            throw new Error(`HTTP Xato: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
        
        // 1. About sectionni to'ldirish
        if (data.about) {
            aboutTextContainer.innerHTML = data.about.text.map(p => `<p>${p}</p>`).join('');
            aboutStatsContainer.innerHTML = data.about.stats.map(stat => `
                <div class="stat-card">
                    <h3>${stat.value}</h3>
                    <p>${stat.label}</p>
                </div>
            `).join('');
        }

        // 2. Skills sectionni to'ldirish
        if (data.skills) {
            skillsGridContainer.innerHTML = data.skills.map(skill => {
                const isSpecial = skill.isSpecial;
                const levelDisplay = isSpecial ? skill.level : `${skill.level}%`;
                const levelValue = isSpecial ? 100 : skill.level; // Maxsus kartani 100% deb tasavvur qilamiz
                
                return `
                    <div class="skill-card ${isSpecial ? 'special-card' : ''}">
                        <div class="skill-header">
                            <h3>${skill.name}</h3>
                            ${isSpecial ? `<div class="vibe-badge"><i class="fas fa-hand-peace"></i> ${levelDisplay}</div>` : `<span>${levelDisplay}</span>`}
                        </div>
                        <div class="skill-bar">
                            <div class="skill-progress" data-level="${levelValue}"></div>
                        </div>
                        ${isSpecial ? `<p class="mt-2 text-center text-gray-400">Bu mening kodlash falsafam. Tezkorlik va sifat. 🚀</p>` : ''}
                    </div>
                `;
            }).join('');
        }
        
        // 3. Projects sectionni to'ldirish
        if (data.projects) {
            projectsGridContainer.innerHTML = data.projects.map(project => `
                <div class="project-card">
                    <div class="project-inner">
                        <div class="project-front">
                            <div class="project-image">
                                <img src="${project.image}" alt="${project.title} loyihasi">
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
                            <p>${project.detailedDescription}</p>
                            <div class="project-links">
                                <a href="${project.url}" target="_blank" class="project-link">
                                    <i class="fas fa-eye"></i> Ko'rish
                                </a>
                                <a href="mailto:example@domain.com" class="project-link">
                                    <i class="fas fa-code"></i> Kod (Maxfiy)
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // 4. Contact sectionni to'ldirish
        if (data.contact) {
            contactContentContainer.innerHTML = `
                <p class="contact-description">${data.contact.description}</p>
                <a href="${data.contact.telegram.url}" target="_blank" class="telegram-button">
                    <i class="fab fa-telegram-plane"></i> ${data.contact.telegram.username}
                </a>
            `;
        }

        // Ma'lumotlar yuklangandan so'ng skill barlarni animatsiya qilish
        animateSkillBars();
        handleProjectImageErrors();
        
    } catch (error) {
        console.error('Data yuklashda fatal xato:', error);
        // Agar ma'lumot yuklanmasa, foydalanuvchiga xabar berish (ixtiyoriy)
        aboutTextContainer.innerHTML = `<p class="text-red-500">Kechirasiz, ma'lumotlarni yuklab bo'lmadi. Iltimos, data.json faylini tekshiring. Xato: ${error.message}</p>`;
        // Chatbotga xato xabarini ko'rsatish uchun uni o'chirmaymiz, ammo ma'lumotlarni yuklay olmaganimizni bilishimiz kerak.
    }
    return data;
};


// --------------------------------------------------------
// CHATBOT MANTIQI
// --------------------------------------------------------

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendMessageButton = document.getElementById('sendMessage');
let isChatbotOpen = false; 

if (chatbotToggle && chatbotWindow && closeChatbot && chatbotMessages && chatbotInput && sendMessageButton) {
    
    chatbotToggle.addEventListener('click', () => {
        isChatbotOpen = !isChatbotOpen;
        chatbotWindow.classList.toggle('active', isChatbotOpen);
        chatbotToggle.classList.toggle('active', isChatbotOpen);
        if (isChatbotOpen) {
            chatbotInput.focus();
        }
    });

    closeChatbot.addEventListener('click', () => {
        isChatbotOpen = false;
        chatbotWindow.classList.remove('active');
        chatbotToggle.classList.remove('active');
    });

    sendMessageButton.addEventListener('click', () => {
        handleUserInput();
    });

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
}

const addMessage = (text, sender) => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.innerHTML = text; 
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; 
    return messageDiv;
};

const showTypingIndicator = () => {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'typing-indicator');
    typingDiv.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return typingDiv;
};

const removeTypingIndicator = (indicatorDiv) => {
    if (indicatorDiv) {
        indicatorDiv.remove();
    }
};

const handleUserInput = async () => {
    const userMessage = chatbotInput.value.trim();
    if (userMessage === '') return;

    addMessage(userMessage, 'user');
    chatbotInput.value = '';
    
    sendMessageButton.disabled = true;
    chatbotInput.disabled = true;

    const typingIndicator = showTypingIndicator();

    try {
        const botResponseText = await fetchGeminiResponse(userMessage);
        removeTypingIndicator(typingIndicator);
        addMessage(botResponseText, 'bot');
        
    } catch (error) {
        console.error('Chatbot xatosi:', error);
        removeTypingIndicator(typingIndicator);
        addMessage(`Kechirasiz, xatolik yuz berdi: ${error.message}`, 'bot');
    }
    
    sendMessageButton.disabled = false;
    chatbotInput.disabled = false;
    chatbotInput.focus();
};

// --------------------------------------------------------
// XAVFSIZ API CHAQIRUV FUNKSIYASI
// --------------------------------------------------------

const fetchGeminiResponse = async (userMessage) => {
    
    // 1. data.json ma'lumotlarini olish (Serverga yuborish uchun)
    let data;
    try {
        // ./ dan foydalanamiz, bu fayl yo'lining aniq ekanligini ta'minlaydi
        const response = await fetch('./data.json'); 
        
        if (!response.ok) {
            throw new Error(`data.json yuklashda HTTP xato: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
        
    } catch (error) {
        // Yuklashdagi xatoni ushlab, uni Serverless Funksiyaga yubormasdan to'xtatamiz
        throw new Error(`Ma'lumotlar yuklashda xato. data.json faylini tekshiring. Xato: ${error.message}`); 
    }

    let dataJson;
    try {
        // Ma'lumotlarni Serverless Funksiyaga yuborish uchun formatlash
        
        const projectsList = data.projects 
            ? data.projects.map(project => `- ${project.title}: ${project.url} (${project.description})`).join('\n') 
            : 'Loyihalar haqida ma\'lumot yo\'q.';

        const skillsList = data.skills 
            ? data.skills.map(skill => `${skill.name} (${skill.level}${skill.isSpecial ? '' : '%'})`).join(', ') 
            : 'Ko\'nikmalar ro\'yxati yo\'q.';
            
        const contactInfo = `
            Telegram: ${data.contact?.telegram?.username || 'Noma\'lum'}
            Email: ${data.contact?.email || 'Noma\'lum'}
        `.trim().replace(/\n\s+/g, '\n');

        
        const profileDataToSend = {
            ISM: 'Dilshod Sayfiddinov',
            LAVOZIM: 'Frontend Developer',
            TAJRIBA: data.about?.stats?.[0]?.value ? `${data.about.stats[0].value} Oylik Tajriba` : 'Noma\'lum',
            VIBE_CODING: data.skills?.find(skill => skill.isSpecial)?.level || 'Noma\'lum',
            KO_NIKMALAR: skillsList,
            LOYIHALAR: projectsList,
            BOG_LANISH: contactInfo
        };

        dataJson = JSON.stringify(profileDataToSend, null, 2); 
        
    } catch (error) {
        throw new Error(`Ma'lumotlarni serverga tayyorlashda xato yuz berdi: ${error.message}`);
    }
    
    // 2. O'zimizning Serverless Function'ga so'rov yuboramiz
    const apiResponse = await fetch('/api/chat', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userMessage: userMessage, 
            dataJson: dataJson      
        })
    });
    
    if (!apiResponse.ok) {
        let errorData = {};
        try {
            errorData = await apiResponse.json();
        } catch (e) {
            throw new Error(`Server API so'rovi muvaffaqiyatsiz: ${apiResponse.status}.`);
        }
        
        throw new Error(`Server API xatosi: ${apiResponse.status} - ${errorData.error || errorData.message || 'Noma\'lum xato'}`);
    }
    
    const apiData = await apiResponse.json();
    
    if (apiData.response) {
        return apiData.response; 
    } else {
        throw new Error(apiData.error || 'Serverdan kutilgan javob olinmadi');
    }
};


// --------------------------------------------------------
// Qolgan Yordamchi Funksiyalar
// --------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // Sahifani data.json dan ma'lumotlar bilan to'ldirish
    await loadDataAndRenderPage(); 
    
    // Loading screen logic
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainContent.style.display = 'block';
                animateSkillBars();
            }, 500); 
        }, 500); 
    });
    
});


const addTypingIndicatorStyles = () => {
    // ... (CSS mantiqini qo'shish) ...
    const style = document.createElement('style');
    style.innerHTML = `
        .typing-indicator {
            background-color: var(--darker-bg) !important;
            color: var(--text-light) !important;
        }
        .typing-dots {
            display: inline-flex;
            gap: 4px;
            align-items: center;
            height: 100%;
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
};

const handleProjectImageErrors = () => {
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
                font-size: 0.9rem;
                border-radius: 8px;
                padding: 10px;
                text-align: center;
            `;
            placeholder.textContent = this.closest('.project-card').querySelector('h3').textContent;
            parent.appendChild(placeholder);
        });
    });
}

// Initial calls
addTypingIndicatorStyles();