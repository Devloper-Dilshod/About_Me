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
                    const level = bar.getAttribute('data-level');
                    bar.style.width = level + '%';
                });
                observer.unobserve(skillsSection); // Stop observing after animation
            }
        });
    }, {
        threshold: 0.1
    });

    observer.observe(skillsSection);
};


// --------------------------------------------------------
// YANGILANGAN CHATBOT MANTIQI (API KEY XAVFSIZLIGI UCHUN)
// --------------------------------------------------------

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const closeChatbot = document.getElementById('closeChatbot');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const sendMessageButton = document.getElementById('sendMessage');
let isChatbotOpen = false; // Chatbot holatini kuzatish

if (chatbotToggle && chatbotWindow && closeChatbot && chatbotMessages && chatbotInput && sendMessageButton) {
    
    chatbotToggle.addEventListener('click', () => {
        isChatbotOpen = !isChatbotOpen;
        chatbotWindow.classList.toggle('active', isChatbotOpen);
        chatbotToggle.classList.toggle('active', isChatbotOpen);
        // Oynani ochganda input fokusni berish
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
    messageDiv.innerHTML = text; // HTMLni qo'llab-quvvatlaydi, masalan, yozish animatsiyasi
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; // Pastga tushirish
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

    // 1. Foydalanuvchi xabarini ko'rsatish
    addMessage(userMessage, 'user');
    chatbotInput.value = '';
    
    // Yuborish tugmasi va inputni vaqtincha o'chirish
    sendMessageButton.disabled = true;
    chatbotInput.disabled = true;

    // 2. Yozish indikatorini ko'rsatish
    const typingIndicator = showTypingIndicator();

    try {
        // 3. Javobni serverless funksiyadan olish
        const botResponseText = await fetchGeminiResponse(userMessage);

        // 4. Yozish indikatorini olib tashlash va javobni ko'rsatish
        removeTypingIndicator(typingIndicator);
        addMessage(botResponseText, 'bot');
        
    } catch (error) {
        console.error('Chatbot xatosi:', error);
        removeTypingIndicator(typingIndicator);
        addMessage(`Kechirasiz, xatolik yuz berdi: ${error.message}`, 'bot');
    }
    
    // Yuborish tugmasi va inputni yana ishga tushirish
    sendMessageButton.disabled = false;
    chatbotInput.disabled = false;
    chatbotInput.focus();
};

// --------------------------------------------------------
// XAVFSIZ API CHAQIRUV FUNKSIYASI (API KEY YO'Q)
// --------------------------------------------------------

const fetchGeminiResponse = async (userMessage) => {
    
    // 1. data.json ma'lumotlarini olish (Serverga yuborish uchun)
    let dataJson;
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`data.json yuklashda xato: ${response.status}`);
        }
        const data = await response.json();
        
        // Serverdagi Prompt uchun ma'lumotni formatlash (data.json tarkibiga asoslanib)
        
        // Loyihalarni formatlash
        const projectsList = data.projects 
            ? data.projects.map(project => `- ${project.title}: ${project.url} (${project.description})`).join('\n') 
            : 'Loyihalar haqida ma\'lumot yo\'q.';

        // Ko'nikmalarni formatlash
        const skillsList = data.skills 
            ? data.skills.map(skill => `${skill.name} (${skill.level}${skill.isSpecial ? '' : '%'})`).join(', ') 
            : 'Ko\'nikmalar ro\'yxati yo\'q.';
            
        // Kontakt ma'lumotlarini formatlash
        const contactInfo = `
            Telegram: ${data.contact?.telegram?.username || 'Noma\'lum'}
            Email: ${data.contact?.email || 'Noma\'lum'}
        `.trim().replace(/\n\s+/g, '\n');

        
        const profileDataToSend = {
            ISM: 'Dilshod Sayfiddinov',
            LAVOZIM: 'Frontend Developer',
            // .stats arraydan 0-elementni olishga harakat qilamiz
            TAJRIBA: data.about?.stats?.[0]?.value ? `${data.about.stats[0].value} Oylik Tajriba` : 'Noma\'lum',
            VIBE_CODING: data.skills?.find(skill => skill.isSpecial)?.level || 'Noma\'lum',
            KO_NIKMALAR: skillsList,
            LOYIHALAR: projectsList,
            BOG_LANISH: contactInfo
        };

        // Bu JSON stringini serverga yuboramiz. Server buni qayta obyektga aylantiradi.
        dataJson = JSON.stringify(profileDataToSend, null, 2); 
        
    } catch (error) {
        throw new Error(`Ma'lumotlarni tayyorlashda xato: ${error.message}`);
    }
    
    // 2. O'zimizning Serverless Function'ga (Vercel API Route) so'rov yuboramiz
    // API kaliti ushbu qismda ishlatilmaydi, u serverda xavfsiz qoladi.
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
        // Xatolik ma'lumotlarini olishga harakat qilish
        let errorData = {};
        try {
            errorData = await apiResponse.json();
        } catch (e) {
            // Agar JSON formatida bo'lmasa, statusni ko'rsatish
            throw new Error(`Server API so'rovi muvaffaqiyatsiz: ${apiResponse.status} - Serverdan noto'g'ri javob formati.`);
        }
        
        throw new Error(`Server API so'rovi muvaffaqiyatsiz: ${apiResponse.status} - ${errorData.error || errorData.message || 'Noma\'lum xato'}`);
    }
    
    const apiData = await apiResponse.json();
    
    if (apiData.response) {
        return apiData.response; // Serverdan kelgan AI javobi
    } else {
        throw new Error(apiData.error || 'Serverdan kutilgan javob olinmadi');
    }
};


// --------------------------------------------------------
// Qolgan Yordamchi Funksiyalar
// --------------------------------------------------------

// DOMContentLoaded is triggered when the initial HTML document has been completely loaded and parsed
document.addEventListener('DOMContentLoaded', () => {
    // Skills animation setup
    animateSkillBars(); 
    
    // Loading screen logic
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                mainContent.style.display = 'block';
                // Trigger skill bar animation again just in case the observer missed it on fast load
                animateSkillBars();
            }, 500); // Must match CSS transition time
        }, 500); // Minimum time the loading screen is visible
    });
    
    // Project image error handling setup
    handleProjectImageErrors();
});


// Add CSS for typing indicator dynamically (Keeping existing logic)
const addTypingIndicatorStyles = () => {
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

// Handle project image errors (Keeping existing logic)
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
// handleProjectImageErrors() endi DOMContentLoaded ichida chaqiriladi