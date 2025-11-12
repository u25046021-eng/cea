// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // 1. FUNCIÓN DE CALENDARIO AUTOMÁTICO
    // =========================================
    function updateCalendar() {
        const calendarWidget = document.querySelector('.calendar-widget');
        if (!calendarWidget) return;

        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const today = now.getDate();

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        let firstDayIndex = new Date(year, month, 1).getDay();
        const adjustedFirstDay = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = `<h4 style="text-align:center; margin-bottom:15px;">${monthNames[month]} ${year}</h4>
                    <table class="calendar-table">
                        <thead>
                            <tr><th>L</th><th>M</th><th>X</th><th>J</th><th>V</th><th>S</th><th>D</th></tr>
                        </thead>
                        <tbody><tr>`;

        for (let i = 0; i < adjustedFirstDay; i++) html += '<td></td>';

        let currentDayOfWeek = adjustedFirstDay;
        for (let day = 1; day <= daysInMonth; day++) {
            if (currentDayOfWeek > 6) {
                html += '</tr><tr>';
                currentDayOfWeek = 0;
            }
            html += (day === today) ? `<td><span class="active-date">${day}</span></td>` : `<td>${day}</td>`;
            currentDayOfWeek++;
        }
        html += '</tr></tbody></table>';
        calendarWidget.innerHTML = html;
    }

    updateCalendar();

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