// js/script.js

document.addEventListener("DOMContentLoaded", () => {
    // =========================================
    // 0. CONTROL DE SCROLL Y MENÚ HAMBURGUESA
    // =========================================
    window.scrollTo(0, 0); 

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // =========================================
    // 1. SEGURIDAD Y GESTIÓN DE DATOS
    // =========================================

    const STORAGE_KEY = "cea_event_list";
    let eventList = [];

    // HASH SEGURO DE LA CONTRASEÑA "clavefacil" (SHA-256)
    // RECUERDA: Si cambias la contraseña, debes generar y actualizar este hash.
    const EXPECTED_HASH = "f73972ce28bc736505c5ce264d75bf583085128045e6ed0ffd851658f8afa518"; 

    // Array de respaldo para cuando falla la carga del JSON
    const FALLBACK_EVENTS = [
        { id: 1, day: 28, month: 10, title: "Taller de Reciclaje", info: "10:00 am - 13:00 pm Sede Principal" },
        { id: 2, day: 5, month: 11, title: "Caminata Ecológica", info: "08:00 am - 11:00 am Parque Norte" },
        { id: 3, day: 12, month: 11, title: "Charla: Cambio Climático", info: "18:00 pm - 20:00 pm Virtual (Zoom)" }
    ];

    async function hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async function fetchDefaultEvents() {
        try {
            const response = await fetch("./data/events.json"); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            eventList = data.map((event) => ({ ...event, id: parseInt(event.id) }));
        } catch (error) {
            console.error("⚠️ ERROR: No se pudo cargar events.json. Usando datos de respaldo.", error);
            eventList = FALLBACK_EVENTS;
        }
    }

    async function loadEvents() {
        const savedEvents = localStorage.getItem(STORAGE_KEY);
        if (savedEvents) {
            try {
                 eventList = JSON.parse(savedEvents);
                 console.warn("ADMINISTRACIÓN: Eventos cargados desde localStorage. ¡Recuerda subir tus cambios a GitHub!");
            } catch (e) {
                console.error("Error al parsear eventos. Cargando desde JSON...", e);
                await fetchDefaultEvents();
            }
        } else {
            await fetchDefaultEvents();
        }
    }

    function saveEvents() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventList));
    }

    function getEventsForCalendar() {
        const eventsData = {};
        const currentYear = new Date().getFullYear();
        eventList.forEach((event) => {
            const key = `${event.day}-${event.month}-${currentYear}`;
            if (!eventsData[key]) eventsData[key] = [];
            eventsData[key].push({ title: event.title, info: event.info, id: event.id });
        });
        return eventsData;
    }

    // =========================================
    // 2. RENDERIZADO RÁPIDO (LISTA Y CALENDARIO)
    // =========================================

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const calendarWidget = document.querySelector(".calendar-widget");
    const eventsListContainer = document.querySelector(".events-list");
    const monthNamesShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    function renderEventsAndCalendar(isAdminMode = false) {
        if (!eventsListContainer) return;

        const sortedList = [...eventList].sort((a, b) => {
            if (a.month !== b.month) return a.month - b.month;
            return a.day - b.day;
        });

        // 1. Redibuja la LISTA pública
        let publicListHTML = '';
        sortedList.forEach((event) => {
            publicListHTML += `
                <div class="event-item">
                    <div class="event-date">
                        <div class="day">${event.day < 10 ? "0" + event.day : event.day}</div>
                        <div class="month">${monthNamesShort[event.month]}</div>
                    </div>
                    <div class="event-info">
                        <h4>${event.title}</h4>
                        <p>${event.info}</p>
                    </div>
                </div>`;
        });
        eventsListContainer.innerHTML = publicListHTML;
        
        // 2. Si está en modo Admin, actualiza también la lista del panel
        if (isAdminMode) {
             renderAdminList(sortedList);
        }

        // 3. Redibuja el CALENDARIO
        updateCalendar(currentMonth, currentYear);
    }
    
    function updateCalendar(month, year) {
        if (!calendarWidget) return;

        const events = getEventsForCalendar();
        const now = new Date();
        const today = now.getDate();
        const currentActualMonth = now.getMonth();
        const currentActualYear = now.getFullYear();

        let firstDayIndex = new Date(year, month, 1).getDay();
        const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button id="prevMonth" title="Mes anterior" style="background:none; border:none; cursor:pointer; font-size:1.5rem; color:var(--primary-green);"><i class="fas fa-chevron-left"></i></button>
                <h4 style="margin: 0; color: var(--primary-green);">${monthNames[month]} ${year}</h4>
                <button id="nextMonth" title="Mes siguiente" style="background:none; border:none; cursor:pointer; font-size:1.5rem; color:var(--primary-green);"><i class="fas fa-chevron-right"></i></button>
            </div>
            <table class="calendar-table">
                <thead>
                    <tr><th>L</th><th>M</th><th>X</th><th>J</th><th>V</th><th>S</th><th>D</th></tr>
                </thead>
                <tbody><tr>`;

        for (let i = 0; i < adjustedFirstDay; i++) html += "<td></td>";

        let currentDayOfWeek = adjustedFirstDay;

        for (let day = 1; day <= daysInMonth; day++) {
            if (currentDayOfWeek > 6) {
                html += "</tr><tr>";
                currentDayOfWeek = 0;
            }

            const eventKey = `${day}-${month}-${year}`;
            const eventArray = events[eventKey];

            let classList = [];
            if (day === today && month === currentActualMonth && year === currentActualYear) classList.push("active-date");
            if (eventArray) classList.push("has-event");

            const dataAttributes = eventArray
                ? `data-event-title="${eventArray[0].title}" data-event-info="${eventArray[0].info}"`
                : "";

            html += `<td class="${classList.join(" ")}" ${dataAttributes}>${day}</td>`;
            currentDayOfWeek++;
        }

        html += "</tr></tbody></table>";
        html += '<div id="calendar-info-box" class="calendar-info-box" style="display:none;"></div>';

        calendarWidget.innerHTML = html;
        attachCalendarListeners();
    }
    
    function attachCalendarListeners() {
        document.getElementById("prevMonth")?.addEventListener("click", () => changeMonth(-1));
        document.getElementById("nextMonth")?.addEventListener("click", () => changeMonth(1));

        const infoBox = document.getElementById("calendar-info-box");

        document.querySelectorAll(".calendar-table td.has-event").forEach((td) => {
            td.addEventListener("click", function (e) {
                const rect = e.target.getBoundingClientRect();
                infoBox.innerHTML = `<p><strong>${e.target.getAttribute("data-event-title")}</strong></p><p style="margin-top:5px; font-size:0.9em; color:#ddd;">${e.target.getAttribute("data-event-info")}</p>`;
                const widgetRect = calendarWidget.getBoundingClientRect();

                infoBox.style.left = `${rect.left - widgetRect.left + rect.width / 2}px`;
                infoBox.style.top = `${rect.bottom - widgetRect.top + 10}px`;
                infoBox.style.transform = `translateX(-50%)`;
                infoBox.style.display = "block";

                setTimeout(() => { infoBox.style.display = "none"; }, 4000);
            });
        });

        document.addEventListener("click", (e) => {
            const adminSection = document.getElementById("admin-section");
            if (!calendarWidget?.contains(e.target) && infoBox && !infoBox.contains(e.target) && !adminSection?.contains(e.target)) {
                infoBox.style.display = "none";
            }
        });
    }

    function changeMonth(step) {
        currentMonth += step;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        } else if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar(currentMonth, currentYear);
    }


 
    let adminSection = null; 
    let eventForm, inputId, inputTitle, inputDay, inputMonth, inputInfo, adminEventListContainer, logoutBtn;

    // --- Funciones de construcción y manipulación de DOM ---

    function buildAdminPanel() {
        const monthOptions = monthNames.map((name, index) => `<option value="${index}">${name}</option>`).join('');

        const panelHTML = `
            <section id="admin-section" class="events-section" style="margin-top: 50px;">
                <h2 class="section-title" style="color: #c0392b;"><i class="fas fa-lock"></i> Panel de Administración de Actividades</h2>
                <p style="color: #c0392b; font-weight: bold; margin-bottom: 15px;">
                    ⚠️ Recordatorio: Los cambios se guardan solo en tu navegador. Para hacerlos permanentes en la web, DEBES copiar el contenido del localStorage y subirlo al archivo data/events.json en GitHub.
                </p>

                <div class="admin-form-container">
                    <h3>Agregar / Modificar Actividad</h3>
                    <form id="event-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <input type="hidden" id="event-id">
                        
                        <input type="text" id="event-title" placeholder="Nombre de la Actividad (Ej: Taller de Compostaje)" required style="grid-column: 1 / 3; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                        
                        <input type="number" id="event-day" placeholder="Día (1-31)" min="1" max="31" required style="padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                        
                        <select id="event-month" required style="padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                            <option value="" disabled selected>Seleccione Mes</option>
                            ${monthOptions}
                        </select>

                        <input type="text" id="event-info" placeholder="Horario y Lugar (Ej: 15:00 - 17:00 Sede Principal)" required style="grid-column: 1 / 3; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                        
                        <button type="submit" class="btn-small" style="background-color: var(--primary-green); padding: 10px; font-size: 1rem; border-radius: 5px; grid-column: 1 / 3;">Guardar Actividad</button>
                    </form>
                </div>

                <h3 style="margin-top: 30px;">Eventos Existentes (Clic en Editar/Eliminar)</h3>
                <div id="admin-event-list" class="events-list" style="border-top: 2px solid #eee; padding-top: 15px;">
                    </div>

                <button id="logout-admin" class="btn-small" style="background-color: #f44336; margin-top: 20px;">Salir del Panel</button>
            </section>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = panelHTML.trim();
        adminSection = tempDiv.firstChild;
        // Insertar el panel dinámico antes del footer
        document.querySelector('footer').parentNode.insertBefore(adminSection, document.querySelector('footer'));
        
        // ASIGNACIÓN DE VARIABLES DOM (NECESARIO AQUÍ)
        eventForm = document.getElementById("event-form");
        inputId = document.getElementById("event-id");
        inputTitle = document.getElementById("event-title");
        inputDay = document.getElementById("event-day");
        inputMonth = document.getElementById("event-month");
        inputInfo = document.getElementById("event-info");
        adminEventListContainer = document.getElementById("admin-event-list");
        logoutBtn = document.getElementById("logout-admin");
        
        initAdminListeners();
        return adminSection;
    }

    function initAdminListeners() {
        // Adjuntar listeners de botón
        logoutBtn?.addEventListener("click", () => {
            toggleAdminPanel(false);
            // Ya no hay botón de login que mostrar
        });
        eventForm?.addEventListener("submit", handleEventSubmit);
    }

    function renderAdminList(sortedList) {
        // [Contenido de renderAdminList] (Sin cambios funcionales)
        if (!adminEventListContainer) return;
        
        let adminListHTML = sortedList
            .map(
                (event) => `
                <div class="event-item admin-event-item" data-event-id="${event.id}">
                    <div class="event-date">
                        <div class="day">${event.day < 10 ? "0" + event.day : event.day}</div>
                        <div class="month">${monthNamesShort[event.month]}</div>
                    </div>
                    <div class="event-info">
                        <h4>${event.title} <span style="font-weight: normal; color: #999;">(ID: ${event.id})</span></h4>
                        <p>${event.info}</p>
                        <div style="margin-top: 10px;">
                            <button class="btn-small edit-event-btn" data-id="${event.id}" style="background-color: #ff9800; margin-right: 5px;">Editar</button>
                            <button class="btn-small delete-event-btn" data-id="${event.id}" style="background-color: #f44336;">Eliminar</button>
                        </div>
                    </div>
                </div>
            `
            ).join("");
        adminEventListContainer.innerHTML = adminListHTML;
        attachAdminListListeners();
    }
    
    function handleEventSubmit(e) {
        e.preventDefault();
        const id = inputId.value ? parseInt(inputId.value) : null;
        
        if (inputDay.value < 1 || inputDay.value > 31 || inputMonth.value === "") {
            alert("Por favor, introduce un día y un mes válidos.");
            return;
        }
        
        const newEvent = {
            id: id || Date.now(), 
            day: parseInt(inputDay.value),
            month: parseInt(inputMonth.value),
            title: inputTitle.value.trim(),
            info: inputInfo.value.trim(),
        };

        if (id) {
            const index = eventList.findIndex((ev) => ev.id === id);
            if (index !== -1) {
                eventList[index] = newEvent;
                alert(`✅ Actividad ${newEvent.title} actualizada. (¡Ahora súbelo a GitHub!)`);
            }
        } else {
            eventList.push(newEvent);
            alert(`✅ Actividad ${newEvent.title} agregada. (¡Ahora súbelo a GitHub!)`);
        }

        saveEvents();
        renderEventsAndCalendar(true);
        eventForm.reset();
        inputId.value = "";
        console.log(JSON.stringify(eventList, null, 2));
    }
    
    function attachAdminListListeners() {
        adminEventListContainer.querySelectorAll(".delete-event-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const id = parseInt(this.dataset.id);
                if (confirm("⚠️ ¿Seguro que quieres eliminar esta actividad? (Recuerda que debes subir el cambio a GitHub)")) {
                    eventList = eventList.filter((ev) => ev.id !== id);
                    saveEvents();
                    renderEventsAndCalendar(true); 
                    alert("🗑️ Actividad eliminada. (¡Ahora súbelo a GitHub!)");
                    console.log(JSON.stringify(eventList, null, 2));
                }
            });
        });

        adminEventListContainer.querySelectorAll(".edit-event-btn").forEach((button) => {
            button.addEventListener("click", function () {
                const id = parseInt(this.dataset.id);
                const eventToEdit = eventList.find((ev) => ev.id === id);
                if (eventToEdit) {
                    inputId.value = eventToEdit.id;
                    inputTitle.value = eventToEdit.title;
                    inputDay.value = eventToEdit.day;
                    inputMonth.value = eventToEdit.month;
                    inputInfo.value = eventToEdit.info;
                    eventForm.scrollIntoView({ behavior: "smooth" });
                }
            });
        });
    }


    let keyBuffer = "";
    document.addEventListener("keydown", async (e) => {
        // Bloquear si el foco está en un campo de texto
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA" || document.activeElement.isContentEditable) return;
        
        keyBuffer += e.key.toLowerCase();
        
        if (keyBuffer.includes("admin") && (!adminSection || adminSection.style.display !== "block")) {
            keyBuffer = "";
            const inputPassword = prompt("Ingrese la contraseña de administrador:");
            if (inputPassword === null || inputPassword.trim() === '') return;

            const hashedInput = await hashString(inputPassword.trim());
            
            if (hashedInput === EXPECTED_HASH) {
                 if (!adminSection) buildAdminPanel();
                 toggleAdminPanel(true);
            } else {
                 alert("Contraseña incorrecta.");
            }
        }
        setTimeout(() => { keyBuffer = ""; }, 1000);
    });

    function toggleAdminPanel(show) {
        if (adminSection) {
            adminSection.style.display = show ? "block" : "none";
            if (show) {
                renderEventsAndCalendar(true); 
                adminSection.scrollIntoView({ behavior: "smooth" });
                console.log(JSON.stringify(eventList, null, 2));
            } else {
                renderEventsAndCalendar(); 
                if (eventForm) eventForm.reset();
                if (inputId) inputId.value = "";
            }
        }
    }


    // =========================================
    // 4. INICIALIZACIÓN Y ANIMACIONES
    // =========================================

    loadEvents().then(() => {
        renderEventsAndCalendar();
    });

    // [Código de las funciones de animación, omitido]
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px",
    };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('fade-up') || entry.target.classList.contains('fade-in')) {
                    entry.target.classList.add('element-visible');
                }
                if (entry.target.classList.contains('events-section') || entry.target.classList.contains('location-section')) {
                    const container = entry.target.querySelector('.leaf-animation-container');
                    if (container && !container.dataset.generated) {
                        generateSideLeaves(container);
                        container.dataset.generated = 'true';
                    }
                }
                observer.unobserve(entry.target);
            }
        });
    });
    document
        .querySelectorAll(".fade-up, .fade-in, .events-section, .location-section")
        .forEach((el) => {
            if (el.id !== "admin-section") observer.observe(el);
        });

    const heroSection = document.querySelector(".hero");
    if (heroSection) {
        for (let i = 0; i < 5; i++) {
            let leaf = document.createElement("div");
            leaf.className = "leaf";
            heroSection.appendChild(leaf);
        }
    }

    function generateSideLeaves(container) {
        for (let i = 0; i < 6; i++) {
            let leaf = document.createElement("div");
            leaf.className = "side-leaf";
            leaf.style.top = 10 + Math.random() * 80 + "%";
            if (Math.random() > 0.5) {
                leaf.style.left = "-30px";
                leaf.classList.add("animate-leaf-left");
            } else {
                leaf.style.right = "-30px";
                leaf.classList.add("animate-leaf-right");
            }
            const size = 20 + Math.random() * 15;
            leaf.style.width = `${size}px`;
            leaf.style.height = `${size}px`;
            leaf.style.animationDelay = Math.random() * 2 + "s";
            container.appendChild(leaf);
        }
    }
});