const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const YEAR = 2026;
const OUTPUT_FILE = 'Roadmap_2026_Pro_Jira_Style.csv';

// ✨ UPGRADE: Added 'Sprint', 'Priority', 'Type', 'EstDuration' for Jira-like views
const CSV_HEADER = "Name,Date,Category,Sprint,Status,Priority,Type,EstDuration\n";

// --- STRATEGY (JUNIOR -> MIDDLE) ---
const MONTHLY_PLAN = [
    {
        month: 1,
        theme: "M01: The Alex Xu Start",
        techFocus: "System Design: Load Balancer & Caching",
        engFocus: "Shadowing: Tech Intonation",
        prepFocus: "DSA: Array/String Warmup"
    },
    {
        month: 2,
        theme: "M02: Database Deep Dive",
        techFocus: "DB Internals: B-Tree vs LSM-Tree",
        engFocus: "Read Aloud: Tech Articles",
        prepFocus: "DSA: Hash Map & Two Pointers"
    },
    {
        month: 3,
        theme: "M03: Communication & API",
        techFocus: "API Design: REST vs gRPC",
        engFocus: "Gemini Voice: Explain HTTPS",
        prepFocus: "DSA: Recursion & Stack"
    },
    {
        month: 4,
        theme: "M04: K8s & Containers",
        techFocus: "K8s Architecture: Pods/Services",
        engFocus: "Think Aloud Coding",
        prepFocus: "SysDesign: Rate Limiter"
    },
    {
        month: 5,
        theme: "M05: Distributed Patterns",
        techFocus: "Saga Pattern & Circuit Breaker",
        engFocus: "Writing RFC/Tech Specs",
        prepFocus: "SysDesign: Unique ID Gen"
    },
    {
        month: 6,
        theme: "M06: Observability",
        techFocus: "ELK Stack & OpenTelemetry",
        engFocus: "Roleplay: Incident Debugging",
        prepFocus: "SysDesign: URL Shortener"
    },
    {
        month: 7,
        theme: "M07: High Concurrency",
        techFocus: "Kafka/RabbitMQ Internals",
        engFocus: "Summarize Eng Blogs",
        prepFocus: "SysDesign: Chat System"
    },
    {
        month: 8,
        theme: "M08: Data Heavy",
        techFocus: "Sharding & Replication",
        engFocus: "Mock Interview: Behavioral",
        prepFocus: "SysDesign: YouTube/Netflix"
    },
    {
        month: 9,
        theme: "M09: Security",
        techFocus: "OAuth2/OIDC & OWASP",
        engFocus: "Debate: SQL vs NoSQL",
        prepFocus: "SysDesign: Google Drive"
    },
    {
        month: 10,
        theme: "M10: The Polish",
        techFocus: "Code Review & Clean Arch",
        engFocus: "Mock Interview: Full System Design",
        prepFocus: "Apply: Top 50 Companies"
    },
    {
        month: 11,
        theme: "M11: Negotiation",
        techFocus: "System Optimization Cases",
        engFocus: "Salary Negotiation Prep",
        prepFocus: "Live Coding Rounds"
    },
    {
        month: 12,
        theme: "M12: New Beginning",
        techFocus: "Onboarding Strategy",
        engFocus: "Networking & Coffee Chats",
        prepFocus: "Offer Evaluation"
    }
];

function generateRoadmap() {
    let csvContent = CSV_HEADER;
    let currentDate = new Date(`${YEAR}-01-01`);
    const endDate = new Date(`${YEAR}-12-31`);

    console.log(`🚀 Generating Professional Jira-style Roadmap for ${YEAR}...`);

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const monthIndex = currentDate.getMonth();
        const dayOfWeek = currentDate.getDay();
        const plan = MONTHLY_PLAN[monthIndex];
        
        // Define SPRINT based on the Month Theme
        const sprintName = plan.theme; 

        // --- WEEKDAY ROUTINE (Mon-Fri) ---
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { 
            // 1. Morning Input (Routine)
            csvContent += escapeCsvRow(
                `🎧 ${plan.engFocus}`,      // Name
                dateStr,                    // Date
                "English",                  // Category
                sprintName,                 // Sprint
                "To Do",                    // Status
                "Medium",                   // Priority
                "Routine",                  // Type
                "30m"                       // Estimate
            );
            
            // 2. Deep Work (The "Meat")
            csvContent += escapeCsvRow(
                `🛠️ ${plan.techFocus}`,      // Name
                dateStr,
                "Tech",
                sprintName,
                "To Do",
                "High",                     // Priority High for Tech
                "Deep Work",                // Type
                "90m"
            );
            
            // 3. Evening Output (Practice)
            csvContent += escapeCsvRow(
                `🧠 ${plan.prepFocus}`,      // Name
                dateStr,
                "Study",
                sprintName,
                "To Do",
                "Medium",
                "Practice",                 // Type
                "45m"
            );

        } 
        // --- SATURDAY (The Challenge Day) ---
        else if (dayOfWeek === 6) { 
            csvContent += escapeCsvRow(
                "🗣️ Mock Interview / Speaking Session", 
                dateStr, "English", sprintName, "To Do", "High", "Milestone", "60m"
            );
            csvContent += escapeCsvRow(
                "📐 Draw Architecture Diagram (Whiteboard)", 
                dateStr, "Tech", sprintName, "To Do", "High", "Milestone", "60m"
            );
        } 
        // --- SUNDAY (Review) ---
        else { 
            csvContent += escapeCsvRow(
                "📅 Weekly Retrospective & Plan", 
                dateStr, "Planning", sprintName, "To Do", "Low", "Admin", "30m"
            );
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
    console.log(`✅ Success! File created: ${OUTPUT_FILE}`);
    console.log(`👉 IMPORT TRICK: In Notion, make sure to change 'Status' to a Select property and 'Sprint' to a Select property!`);
}

function escapeCsvRow(name, date, category, sprint, status, priority, type, estimate) {
    // Escape quotes in Name to prevent CSV errors
    const safeName = name.replace(/"/g, '""');
    return `"${safeName}","${date}","${category}","${sprint}","${status}","${priority}","${type}","${estimate}"\n`;
}

generateRoadmap();