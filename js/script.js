// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // 0. FUNCIÓN DE MENÚ HAMBURGUESA
    // =========================================
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            // Alternar la clase 'active' para mostrar/ocultar el menú
            navLinks.classList.toggle('active');
        });
    }

    // =========================================
    // 1. FUNCIÓN DE CALENDARIO AUTOMÁTICO MEJORADA Y CON NAVEGACIÓN
    // =========================================
    
    const calendarWidget = document.querySelector('.calendar-widget');
    if (calendarWidget) {
        // Inicializa el mes y año actual
        // El mes actual es Noviembre (10), 2025.
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        
        // Función para extraer y estructurar los eventos del HTML
        function getEventsFromHTML() {
            const eventsData = {};
            const eventItems = document.querySelectorAll('.events-list .event-item');
            
            eventItems.forEach(item => {
                const dayElement = item.querySelector('.event-date .day');
                const monthElement = item.querySelector('.event-date .month');
                const titleElement = item.querySelector('.event-info h4');
                const timeLocationElement = item.querySelector('.event-info p');

                if (dayElement && monthElement && titleElement && timeLocationElement) {
                    const day = parseInt(dayElement.textContent.trim());
                    const monthName = monthElement.textContent.trim();
                    const title = titleElement.textContent.trim();
                    const info = timeLocationElement.textContent.trim();
                    
                    // Mapeo de nombres de meses a números (0 = Enero, 11 = Diciembre)
                    const monthMap = {
                        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 
                        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11 
                    };
                    const month = monthMap[monthName.toLowerCase()];
                    
                    // Asume que todos los eventos están en el año actual (2025)
                    const year = new Date().getFullYear();
                    const key = `${day}-${month}-${year}`;

                    // Almacenamos el evento, creando un array si ya hay uno (soporte para múltiples eventos por día)
                    if (!eventsData[key]) {
                        eventsData[key] = [];
                    }
                    eventsData[key].push({ title, info });
                }
            });
            return eventsData;
        }

        // Modificamos la función principal del calendario
        function updateCalendar(month, year) {
            const events = getEventsFromHTML(); 
            const now = new Date();
            const today = now.getDate();
            const currentActualMonth = now.getMonth();
            const currentActualYear = now.getFullYear();

            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            let firstDayIndex = new Date(year, month, 1).getDay();
            // Ajuste para que la semana empiece en Lunes (0=Domingo -> 6, 1=Lunes -> 0, etc.)
            const adjustedFirstDay = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
            
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

            // Rellenar celdas vacías al inicio
            for (let i = 0; i < adjustedFirstDay; i++) html += '<td></td>';

            let currentDayOfWeek = adjustedFirstDay;
            
            // Dibujar días del mes
            for (let day = 1; day <= daysInMonth; day++) {
                if (currentDayOfWeek > 6) {
                    html += '</tr><tr>';
                    currentDayOfWeek = 0;
                }
                
                const eventKey = `${day}-${month}-${year}`;
                const hasEvent = events[eventKey];
                
                let classList = [];
                // Marcar 'active-date' solo si es el día de hoy
                if (day === today && month === currentActualMonth && year === currentActualYear) classList.push('active-date');
                if (hasEvent) classList.push('has-event');

                // Añadir data-attributes si hay evento
                const dataAttributes = hasEvent 
                    ? `data-event-title="${events[eventKey][0].title}" data-event-info="${events[eventKey][0].info}"`
                    : '';

                html += `<td class="${classList.join(' ')}" ${dataAttributes}>${day}</td>`;
                currentDayOfWeek++;
            }
            
            html += '</tr></tbody></table>';
            
            // Agregar espacio para el pop-up de información (tooltip)
            html += '<div id="calendar-info-box" class="calendar-info-box" style="display:none;"></div>';

            calendarWidget.innerHTML = html;
            
            // LISTENERS DE NAVEGACIÓN
            document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
            document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

            // LISTENERS DE CLIC EN DÍA DE EVENTO
            const infoBox = document.getElementById('calendar-info-box');
            
            document.querySelectorAll('.calendar-table td.has-event').forEach(td => {
                td.addEventListener('click', function(e) {
                    const rect = e.target.getBoundingClientRect();
                    
                    infoBox.innerHTML = `
                        <p><strong>${e.target.getAttribute('data-event-title')}</strong></p>
                        <p style="margin-top:5px; font-size:0.9em; color:#ddd;">${e.target.getAttribute('data-event-info')}</p>
                    `;
                    
                    const widgetRect = calendarWidget.getBoundingClientRect();

                    // Ajuste de posición: Centrado horizontalmente y debajo de la celda
                    infoBox.style.left = `${rect.left - widgetRect.left + (rect.width / 2)}px`; 
                    infoBox.style.top = `${rect.bottom - widgetRect.top + 10}px`; 
                    infoBox.style.transform = `translateX(-50%)`; 
                    infoBox.style.display = 'block';

                    // Ocultar el pop-up después de 4 segundos
                    setTimeout(() => {
                        infoBox.style.display = 'none';
                    }, 4000);
                });
            });
            
            // Ocultar infoBox al hacer clic en cualquier lugar fuera del calendario
            document.addEventListener('click', (e) => {
                // Si el clic no está dentro del widget ni en el infoBox, lo oculta
                if (!calendarWidget.contains(e.target) && infoBox && !infoBox.contains(e.target)) {
                    infoBox.style.display = 'none';
                }
            });
        }

        // Función para cambiar de mes y actualizar el calendario
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

        // Llamada inicial para mostrar el mes actual (Noviembre, 2025)
        updateCalendar(currentMonth, currentYear);
    } // Fin del if(calendarWidget)

    // =========================================
    // 2. ANIMACIONES AL HACER SCROLL (FADE Y HOJAS LATERALES)
    // =========================================
    const observerOptions = {
        root: null,
        threshold: 0.15, // Se activa al ver el 15% del elemento
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // --- A) Activa animaciones de FADE (aparecer/subir) ---
                if (entry.target.classList.contains('fade-up') || entry.target.classList.contains('fade-in')) {
                    entry.target.classList.add('element-visible');
                }

                // --- B) Activa animaciones de HOJAS LATERALES ---
                // Solo si estamos en las secciones específicas que tienen el contenedor
                if (entry.target.classList.contains('events-section') || entry.target.classList.contains('location-section')) {
                    const container = entry.target.querySelector('.leaf-animation-container');
                    // Generamos las hojas solo si no se han generado antes
                    if (container && !container.dataset.generated) {
                        generateSideLeaves(container);
                        container.dataset.generated = 'true'; // Marcamos como generadas
                    }
                }
                
                // Dejamos de observar el elemento una vez activado
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observamos tanto los elementos con fade como las secciones enteras para las hojas
    document.querySelectorAll('.fade-up, .fade-in, .events-section, .location-section').forEach(el => {
        observer.observe(el);
    });

    // =========================================
    // 3. GENERADOR DE HOJITAS QUE CAEN (HERO - INTACTO)
    // =========================================
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        for (let i = 0; i < 5; i++) {
            let leaf = document.createElement('div');
            leaf.className = 'leaf';
            heroSection.appendChild(leaf);
        }
    }

    // =========================================
    // 4. NUEVA FUNCIÓN: GENERAR HOJAS LATERALES
    // =========================================
    function generateSideLeaves(container) {
        // Generar 6 hojas por sección
        for (let i = 0; i < 6; i++) {
            let leaf = document.createElement('div');
            leaf.className = 'side-leaf';

            // Posición vertical aleatoria (entre 10% y 90% de la altura de la sección)
            leaf.style.top = (10 + Math.random() * 80) + '%';

            // Decidir aleatoriamente si sale de la izquierda o derecha
            if (Math.random() > 0.5) {
                leaf.style.left = '-30px'; // Empieza fuera por la izquierda
                leaf.classList.add('animate-leaf-left');
            } else {
                leaf.style.right = '-30px'; // Empieza fuera por la derecha
                leaf.classList.add('animate-leaf-right');
            }

            // Tamaño aleatorio para que no sean todas iguales
            const size = 20 + Math.random() * 15; // Entre 20px y 35px
            leaf.style.width = `${size}px`;
            leaf.style.height = `${size}px`;

            // Retraso aleatorio para que no salgan todas a la vez
            leaf.style.animationDelay = (Math.random() * 2) + 's';

            container.appendChild(leaf);
        }
    }
});