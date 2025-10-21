// api/chat.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Faqat POST so'rovlariga ruxsat beriladi" });
    }

    // 1. Muhit o'zgaruvchisidan API kalitini olish
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY Vercel sozlamalarida topilmadi. Uni Environment Variables'ga qo'shing.");
        return res.status(500).json({ error: "Server konfiguratsiya xatosi: API kaliti yo'q" });
    }

    // 2. Mijozdan kelgan ma'lumotlarni qabul qilish
    const { userMessage, dataJson } = req.body;

    if (!userMessage || !dataJson) {
        return res.status(400).json({ error: "So'rovda userMessage va dataJson ma'lumotlari bo'lishi shart." });
    }

    // JSON ma'lumotni parse qilish
    let profileData;
    try {
        profileData = JSON.parse(dataJson);
    } catch (e) {
        console.error("Mijozdan kelgan dataJson noto'g'ri formatda:", e);
        return res.status(400).json({ error: "Ma'lumotlar formatida xatolik yuz berdi." });
    }

    // Prompt yaratish
    const prompt = `
    Siz Dilshod Sayfiddinov haqida ma'lumot beruvchi AI yordamchisisiz.
    Sizning vazifangiz faqat quyidagi ma'lumotlar asosida javob berishdir.
    
    Dilshod Sayfiddinovning asosiy ma'lumotlari:
    - Ism: ${profileData.ISM || 'Dilshod Sayfiddinov'}
    - Lavozim: ${profileData.LAVOZIM || 'Frontend Developer'}
    - Tajriba: ${profileData.TAJRIBA || '8 oy frontend sohasida 2 yil VIBE CODING sohasida'}
    - VIBE CODING Darajasi: ${profileData.VIBE_CODING || '2-yil'}
    
    Asosiy ko'nikmalar:
    ${profileData.KO_NIKMALAR ? '- ' + profileData.KO_NIKMALAR.replace(/, /g, '\n- ') : '- HTML, CSS, JavaScript, React, Git, GitHub , Tailwind CSS, Bootstrap, Figma , VIBE CODING'}
    
    Loyihalari:
    ${profileData.LOYIHALAR || '30+ loyihalar yaratilgan'}
    
    Bog'lanish:
    ${profileData.BOG_LANISH || 'Telegram: @Dilshod_Sayfiddinov'}
    
    **Xulosa Qoida:** Savolga faqat yuqoridagi ma'lumotlar doirasida javob bering. 
    Agar savol ushbu ma'lumotlar doirasida bo'lmasa, 
    "Kechirasiz, men faqat Dilshod haqidagi ma'lumotlar bilan chegaralanganman" deb javob bering.
    
    Foydalanuvchi Savoli: ${userMessage}
    `;

    try {
        // 3. Gemini API ga so'rov yuborish
        const apiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.2 // aniqroq javoblar uchun
                    }
                })
            }
        );

        // 4. Javobni tekshirish
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("Gemini API xato javobi:", errorText);
            throw new Error(`Gemini API so'rovi muvaffaqiyatsiz: ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        const resultText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (resultText) {
            res.status(200).json({ response: resultText });
        } else {
            const errorReason = apiData.candidates?.[0]?.finishReason || "Noma'lum sabab";
            res.status(500).json({ error: `Gemini API dan kutilgan javob olinmadi. Sababi: ${errorReason}` });
        }

    } catch (error) {
        console.error("Gemini API bilan bog'liq xato:", error);
        res.status(500).json({ error: `Serverda xatolik yuz berdi: ${error.message}` });
    }
}
