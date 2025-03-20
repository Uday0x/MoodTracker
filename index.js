document.addEventListener("DOMContentLoaded", () => {
    const moodButtons = document.querySelectorAll(".mood-btn");
    const moodList = document.getElementById("mood-list");
    const calendarView = document.getElementById("calendar-view");
    const timelineView = document.getElementById("timeline-view");
    const calendar = document.getElementById("calendar");

    document.getElementById("show-timeline").addEventListener("click", () => {
        timelineView.classList.remove("hidden");
        calendarView.classList.add("hidden");
    });

    document.getElementById("show-calendar").addEventListener("click", () => {
        calendarView.classList.remove("hidden");
        timelineView.classList.add("hidden");
        renderCalendar();
    });

    moodButtons.forEach(button => {
        button.addEventListener("click", () => {
            const mood = button.dataset.mood;
            const date = new Date().toISOString().split("T")[0];

            let moodLogs = JSON.parse(localStorage.getItem("moodLogs")) || {};
            moodLogs[date] = mood;
            localStorage.setItem("moodLogs", JSON.stringify(moodLogs));

            renderMoodList();
            renderCalendar();
        });
    });

    function renderMoodList() {
        moodList.innerHTML = "";
        let moodLogs = JSON.parse(localStorage.getItem("moodLogs")) || {};

        Object.keys(moodLogs).sort().reverse().forEach(date => {
            const li = document.createElement("li");
            li.textContent = `${date}: ${moodLogs[date]}`;
            moodList.appendChild(li);
        });
    }

    function renderCalendar() {
        calendar.innerHTML = "";
        let moodLogs = JSON.parse(localStorage.getItem("moodLogs")) || {};
        
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement("div");
            calendar.appendChild(emptyDiv);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            const div = document.createElement("div");
            div.classList.add("calendar-day");
            div.textContent = day;
            
            if (moodLogs[date]) {
                div.innerHTML += `<br>${moodLogs[date]}`;
            }

            calendar.appendChild(div);
        }
    }

    renderMoodList();
});


function renderTimeline() {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = ""; // Clear previous timeline

    let moodLogs = JSON.parse(localStorage.getItem("moodLogs")) || {};

    Object.keys(moodLogs).sort().reverse().forEach(date => {
        const div = document.createElement("div");
        div.classList.add("timeline-item");

        div.innerHTML = `
            <span class="timeline-date">${date}</span>
            <span class="timeline-mood">${moodLogs[date]}</span>
            <span class="timeline-emoji">${getMoodEmoji(moodLogs[date])}</span>
        `;

        timeline.appendChild(div);
    });
}

function getMoodEmoji(mood) {
    const emojiMap = {
        "happy": "😊",
        "sad": "😢",
        "neutral": "😐",
        "excited": "🤩",
        "angry": "😠"
    };
    return emojiMap[mood] || "❓"; // Default if mood not found
}

// Call this function on page load
renderTimeline();

