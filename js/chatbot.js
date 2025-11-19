document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const floatingBtn = document.querySelector('.floating-chat');
    const closeBtn = document.getElementById('closeChat');
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatBody = document.getElementById('chatBody');

    if (!chatWindow || !floatingBtn || !closeBtn || !sendBtn || !userInput || !chatBody) return;

    // =================================================================
    // 🧠 CEREBRO DEL BOT
    // =================================================================
    const LINK_INSCRIPCION = "https://www.instagram.com/medioambientestgo/"; 

    const CONOCIMIENTO_BOT = {
        "📅 Próximos Eventos": { 
            keywords: ["taller", "curso", "charla", "caminata", "evento", "actividad", "calendario", "agenda", "feria"],
            tipo: "dinamico_eventos"
        },
        "🕒 Horarios": {
            keywords: ["horario", "hora", "abre", "cierra", "atencion", "dias", "cuando"],
            respuesta: "<p>🕒 <strong>Horario de Atención CEA:</strong></p><p>🟢 <strong>Lunes a Viernes:</strong> 09:00 - 18:00 hrs.<br>🔴 <strong>Sábados y Domingos:</strong> Cerrado (salvo actividades especiales).</p><p>¡Te esperamos!</p>"
        },
        "♻️ Reciclaje": {
            keywords: ["recicla", "basura", "plastico", "vidrio", "carton", "punto"],
            respuesta: "<p>♻️ <strong>Puntos Limpios:</strong></p><p>En CEA recibimos:<br>- 🟦 Papeles y cartones<br>- 🟨 Plásticos PET 1 y latas<br>- 🟩 Vidrio (botellas y frascos)</p><p>Recuerda traerlos limpios.</p>"
        },
        "📍 Ubicación": {
            keywords: ["donde", "ubicaci", "direccion", "llegar", "mapa", "metro"],
            respuesta: "<p>📍 <strong>Nuestra Sede Principal:</strong></p><p>Av. Beauchef 1327, Santiago Centro (Interior Parque O'Higgins).<br>🚇 <strong>Metro cercano:</strong> Estación Parque O'Higgins (Línea 2).</p>"
        }
    };

    const RESPUESTA_DEFAULT = "<p>😅 Disculpa, no entendí bien. Prueba con las opciones del menú.</p>";
    const MENU_AUTOMATICO = Object.keys(CONOCIMIENTO_BOT);
    let contextoBot = null;

    // =================================================================
    // ⚙️ FUNCIONES INTERNAS
    // =================================================================
    floatingBtn.addEventListener('click', () => toggleChat(true));
    closeBtn.addEventListener('click', () => toggleChat(false));

    function toggleChat(show) {
        chatWindow.classList.toggle('active', show);
    }

    function addMessage(text, sender, showMenu = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'bot' ? 'bot-message' : 'user-message');
        
        if (sender === 'user') {
            messageDiv.innerHTML = `<p>${text}</p>`;
        } else {
            // Para los mensajes del bot, el texto ya viene con formato HTML
            // pero aún necesitamos procesar el markdown-like para ** y _
            let processedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                .replace(/_(.*?)_/g, '<em>$1</em>');
            messageDiv.innerHTML = processedText;
        }

        chatBody.appendChild(messageDiv);

        if (showMenu && sender === 'bot') {
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'chat-options';
            
            const existingMenu = chatBody.querySelector('.chat-options');
            if (existingMenu) existingMenu.remove();
            
            MENU_AUTOMATICO.forEach(option => {
                const button = document.createElement('button');
                button.className = 'chat-option-btn';
                button.textContent = option;
                button.onclick = () => handleSend(option); 
                optionsDiv.appendChild(button);
            });
            chatBody.appendChild(optionsDiv);
        }
        // Solo auto-scroll si el mensaje es del usuario, para que el usuario pueda leer la respuesta del bot sin saltos.
        if (sender === 'user') {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    // =================================================================
    // 🕵️‍♀️ LÓGICA DE BÚSQUEDA
    // =================================================================
    function encontrarRespuesta(input) {
        const text = input.toLowerCase().trim();
        contextoBot = null; 
        let keyEncontrada = null;

        if (CONOCIMIENTO_BOT[input]) {
            keyEncontrada = input;
        } else {
            for (let key in CONOCIMIENTO_BOT) {
                if (CONOCIMIENTO_BOT[key].keywords.some(k => text.includes(k))) {
                    keyEncontrada = key;
                    break;
                }
            }
        }

        if (keyEncontrada) {
            const info = CONOCIMIENTO_BOT[keyEncontrada];

            if (info.tipo === "dinamico_eventos") {
                if (typeof window.obtenerTodosLosEventos === 'function') {
                    const eventos = window.obtenerTodosLosEventos();

                    if (eventos.length > 0) {
                        let respuestaHTML = '<p>📅 <strong>¡Estos son los próximos eventos!</strong></p>';
                        const eventosFiltrados = eventos.slice(0, 3);
                        
                        const eventosDiv = eventosFiltrados.map(ev => {
                            let eventBlock = `<div>`;
                            eventBlock += `🔹 <strong>${ev.fechaLegible}:</strong> ${ev.titulo}<br>`;
                            eventBlock += `   <em>${ev.descripcion}</em>`;
                            if (ev.link) {
                                eventBlock += `<br>   📝 <strong>Inscripciones:</strong> <a href="${ev.link}" target="_blank" class="chat-link">🔗 Ver más y registrarse</a>`;
                            }
                            eventBlock += '</div>';
                            return eventBlock;
                        }).join('<hr style="border: none; border-top: 1px solid #eee; margin: 10px 0;">');

                        respuestaHTML += eventosDiv;
                        respuestaHTML += '<p style="margin-top: 10px;">ℹ️ <em>Recuerda que los cupos son limitados.</em></p>';
                        return respuestaHTML;

                    } else {
                        return "<p>📅 Actualmente no veo eventos programados. ¡Atento a nuestras redes!</p>";
                    }
                } else {
                    return "<p>⚠️ Error técnico: No pude leer el calendario.</p>";
                }
            }
            return info.respuesta;
        }

        return RESPUESTA_DEFAULT;
    }

    function handleSend(text = null) {
        const msg = text || userInput.value.trim();
        if (!msg) return;

        addMessage(msg, 'user');
        userInput.value = '';
        
        setTimeout(() => {
            addMessage(encontrarRespuesta(msg), 'bot', true); 
        }, 500);
    }

    sendBtn.addEventListener('click', () => handleSend());
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    setTimeout(() => {
        if (chatBody.childElementCount > 0) {
            chatBody.innerHTML = '';
        }
        addMessage('<p>¡Hola! 👋 Soy el asistente virtual de CEA. ¿En qué puedo ayudarte hoy?</p>', 'bot', true);
    }, 100);
});