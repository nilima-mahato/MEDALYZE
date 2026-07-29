// Global variables
let symptoms = [];

// DOM elements
const navbar = document.getElementById('navbar');
const navMenu = document.getElementById('nav-menu');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const scrollTopBtn = document.getElementById('scrollTop');
const symptomModal = document.getElementById('symptomModal');
const symptomInput = document.getElementById('symptomInput');
const symptomTags = document.getElementById('symptomTags');
const analyzeBtn = document.getElementById('analyzeBtn');
const analysisResults = document.getElementById('analysisResults');
const conditionsList = document.getElementById('conditionsList');

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeScrollEffects();
    initializeModal();
    initializeFAQ();
    initializeNewsletter();
     if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeSymptoms);
    }
});

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

        // Mobile dropdown toggle for Services
    document.querySelectorAll('.nav-item.dropdown').forEach(item => {
        item.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                this.classList.toggle('active');

                // Optional: close other dropdowns
                document.querySelectorAll('.nav-item.dropdown').forEach(other => {
                    if (other !== this) other.classList.remove('active');
                });
            }
        });
    });


    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navMenu && !event.target.closest('.navbar')) {
            navMenu.classList.remove('active');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active navigation link highlighting
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            if (sectionTop <= 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Scroll effects
function initializeScrollEffects() {
    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        }

        // Show/hide scroll to top button
        if (scrollTopBtn) {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        }
    });

    // Scroll to top functionality
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// FAQ functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFAQ(this);
        });
    });
}

function toggleFAQ(element) {
    const faqItem = element.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Newsletter functionality
function initializeNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('.newsletter-input').value;
            
            if (validateEmail(email)) {
                // Simulate newsletter subscription
                alert('Thank you for subscribing to our newsletter!');
                this.querySelector('.newsletter-input').value = '';
            } else {
                alert('Please enter a valid email address.');
            }
        });
    }
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Modal functionality
function initializeModal() {
    if (symptomInput) {
        symptomInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addSymptom();
            }
        });
    }
}

// Symptom checker functions
function openSymptomChecker() {
    if (symptomModal) {
        symptomModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeSymptomChecker() {
    if (symptomModal) {
        symptomModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset modal state
        symptoms = [];
        if (symptomTags) symptomTags.innerHTML = '';
        if (symptomInput) symptomInput.value = '';
        if (analyzeBtn) analyzeBtn.disabled = true;
        if (analysisResults) analysisResults.style.display = 'none';
    }
}

function addSymptom() {
    const input = symptomInput.value.trim();
    
    if (input && !symptoms.includes(input.toLowerCase())) {
        symptoms.push(input.toLowerCase());
        updateSymptomTags();
        symptomInput.value = '';
        updateAnalyzeButton();
    }
}

function removeSymptom(symptom) {
    symptoms = symptoms.filter(s => s !== symptom);
    updateSymptomTags();
    updateAnalyzeButton();
}

function updateSymptomTags() {
    if (!symptomTags) return;
    
    symptomTags.innerHTML = '';
    symptoms.forEach(symptom => {
        const tag = document.createElement('div');
        tag.className = 'symptom-tag';
        tag.innerHTML = `
            <span>${symptom}</span>
            <button class="tag-remove" onclick="removeSymptom('${symptom}')">×</button>
        `;
        symptomTags.appendChild(tag);
    });
}

function updateAnalyzeButton() {
    if (analyzeBtn) {
        analyzeBtn.disabled = symptoms.length === 0;
    }
}

async function analyzeSymptoms() {
    if (symptoms.length === 0) return;

    analyzeBtn.textContent = 'Analyzing...';
    analyzeBtn.disabled = true;

    const joinedSymptoms = symptoms.join(', ');

    try {
        const response = await fetch("/predict_disease", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ symptom: joinedSymptoms })
        });

        const data = await response.json();

        if (data.success) {
            const aiInfo = document.getElementById("aiDiseaseInfo");
            aiInfo.style.display = "block";
            aiInfo.innerHTML = `
                <h3 style="color: var(--primary); margin-bottom: 16px; border-bottom: 2px solid var(--border); padding-bottom: 8px;">AI-Predicted Condition</h3>
                <p><strong>Primary Disease:</strong> ${data.prediction?.primary_disease || "Unknown"}</p>
                <p><strong>Confidence:</strong> ${data.prediction?.confidence_level} (${Math.round((data.prediction?.confidence || 0) * 100)}%)</p>
                <p><strong>Corrected Input:</strong> ${data.input?.cleaned || "N/A"}</p>
                <p><strong>Treatment:</strong> ${data.medical_info?.treatment || "N/A"}</p>
                <p><strong>Medicinal Composition:</strong> ${data.medical_info?.medicinal_composition || "N/A"}</p>
                <p><strong>Precautions:</strong> ${data.medical_info?.precautionary_measures || "N/A"}</p>
                <p><strong>Ingredients to Avoid:</strong> ${data.medical_info?.ingredients_to_avoid || "N/A"}</p>
                <p><strong>Recommended Diet:</strong> ${data.recommended_diet || data.medical_info?.recommended_diet || "N/A"}</p>
            `;
            
            displayAnalysisResults(data.prediction?.alternative_predictions || []);
        } else {
            alert(data.error || "Failed to analyze symptoms.");
        }

    } catch (err) {
        console.error("Failed to fetch AI prediction", err);
        alert("Something went wrong. Please try again.");
    }

    analyzeBtn.textContent = 'Analyze Symptoms';
    analyzeBtn.disabled = false;
}


function displayAnalysisResults(alternatives) {
    if (conditionsList) {
        conditionsList.innerHTML = '';
        if (alternatives.length === 0) {
            conditionsList.innerHTML = '<div class="no-results">No alternative conditions found.</div>';
        } else {
            alternatives.forEach(alt => {
                const conditionItem = document.createElement('div');
                conditionItem.className = 'condition-item';
                conditionItem.innerHTML = `
                    <div class="condition-name">${alt.disease}</div>
                    <div class="condition-match">${Math.round(alt.confidence * 100)}% match</div>
                    <div class="condition-description">Alternative match predicted by the multi-label classification model.</div>
                `;
                conditionsList.appendChild(conditionItem);
            });
        }
    }
    
    if (analysisResults) {
        analysisResults.style.display = 'block';
    }
}


// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);


// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.feature-card, .step, .faq-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Smooth reveal animation for hero section
window.addEventListener('load', function() {
    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateX(-50px)';
        heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateX(0)';
        }, 200);
    }
    
    if (heroImage) {
        heroImage.style.opacity = '0';
        heroImage.style.transform = 'translateX(50px)';
        heroImage.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            heroImage.style.opacity = '1';
            heroImage.style.transform = 'translateX(0)';
        }, 400);
    }
});

// Performance optimization - Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handlers
const debouncedScrollHandler = debounce(function() {
    // Navbar background on scroll
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    }

    // Show/hide scroll to top button
    if (scrollTopBtn) {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('show');
        } else {
            scrollTopBtn.classList.remove('show');
        }
    }
}, 10);

// Replace the scroll event listener with debounced version
window.removeEventListener('scroll', initializeScrollEffects);
window.addEventListener('scroll', debouncedScrollHandler);





/* ===== doctor part script =====*/

if (document.getElementById('symptomInput')) {
    // Your existing doctor data and logic goes here
    
    
    document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    toggleButton.addEventListener('click', () => {
        navMenu.classList.toggle('show'); // This adds/removes the 'show' class
    });
    // Auto-close mobile nav when link is clicked (except dropdown toggle)
    document.querySelectorAll('.nav-link:not(.dropdown-toggle)').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navMenu.classList.remove('show');
            }
        });
    });

    // Dropdown toggle on mobile
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    dropdownToggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault(); // Prevent the jump
            dropdownMenu.classList.toggle('show');
        }
    });
});
   

    window.quickSearch = function(symptom) {
        document.getElementById('symptomInput').value = symptom;

    };

//     window.searchDoctors = function(event) {
//         event.preventDefault();

//         const symptom = document.getElementById('symptomInput').value.toLowerCase().trim();
//         if (!symptom) {
//             alert('Please enter a symptom');
//             return;
//         }

//         document.getElementById('loading').classList.add('show');
//         document.getElementById('results').classList.remove('show');

//         setTimeout(() => {
//             document.getElementById('loading').classList.remove('show');

//             const diseaseToSpecialty = {
//                 "chest pain": "Cardiologist",
//                 "skin rash": "Dermatologist",
//                 "fever": "General Physician",
//                 "migraine": "Neurologist",
//                 "headache": "Neurologist",
//                 "back pain": "Orthopedic Surgeon",
//                 "joint pain": "Orthopedic Surgeon",
//                 "eye pain": "Ophthalmologist",
//                 "child cough": "Pediatrician",
//                 "cough": "Pediatrician",
//                 "pregnancy": "Gynecologist",
//                 "diabetes": "Endocrinologist",
//                 "asthma": "Pulmonologist",
//                 "depression": "Psychiatrist"
//             };

//             const doctorsData = [ /* your 20 doctors copied from doctor.html */ ];

//             let specialty = null;
//             for (const key in diseaseToSpecialty) {
//                 if (symptom.includes(key)) {
//                     specialty = diseaseToSpecialty[key];
//                     break;
//                 }
//             }

//             const matchingDoctors = specialty ? doctorsData.filter(d => d.Specialty === specialty) : [];
//             const list = document.getElementById('doctorsList');
//             const noResults = document.getElementById('noResults');

//             list.innerHTML = '';
//             if (matchingDoctors.length === 0) {
//                 noResults.style.display = 'block';
//             } else {
//                 noResults.style.display = 'none';
//                 matchingDoctors.forEach(doctor => {
//                     const card = document.createElement('div');
//                     card.className = 'doctor-card';
//                     card.innerHTML = `
//                         <div class=\"doctor-header\">
//                             <div class=\"doctor-info\">
//                                 <h3>${doctor.Doctor_Name}</h3>
//                                 <span class=\"specialty-badge\">${doctor.Specialty}</span>
//                             </div>
//                             <div class=\"rating\"><i class=\"fas fa-star\"></i> ${doctor.Rating}</div>
//                         </div>
//                         <div class=\"doctor-details\">
//                             <div class=\"detail-item\"><i class=\"fas fa-map-marker-alt\"></i> ${doctor.Address}</div>
//                             <div class=\"detail-item\"><i class=\"fas fa-phone\"></i> ${doctor.Contact_No}</div>
//                             <div class=\"detail-item\"><i class=\"fas fa-hospital\"></i> ${doctor.Clinic_Hospital}</div>
//                             <div class=\"detail-item\"><i class=\"fas fa-calendar-alt\"></i> ${doctor.Days_Available} - ${doctor.Time_Slot}</div>
//                         </div>
//                         <div class=\"availability\">
//                             <h4>Availability</h4>
//                             <p>${doctor.Area}, Kolkata</p>
//                         </div>
//                         <div class=\"action-buttons\">
//                             <a href=\"#\" class=\"btn-primary\"><i class=\"fas fa-calendar-check\"></i> Book Appointment</a>
//                             <a href=\"#\" class=\"btn-secondary\"><i class=\"fas fa-info-circle\"></i> View Profile</a>
//                         </div>
//                     `;
//                     list.appendChild(card);
//                 });
//             }

//             document.getElementById('results').classList.add('show');
//         }, 1500);
//     };
// }
window.searchDoctors = async function(event) {
    event.preventDefault();

    const symptom = document.getElementById('symptomInput').value.toLowerCase().trim();
    if (!symptom) {
        alert('Please enter a symptom');
        return;
    }

    document.getElementById('loading').classList.add('show');
    document.getElementById('results').classList.remove('show');

    try {
        const response = await fetch("/api/doctors", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ symptom })
        });

        const data = await response.json();
        const list = document.getElementById('doctorsList');
        const noResults = document.getElementById('noResults');
        list.innerHTML = '';

        if (data.length === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
            data.forEach(doctor => {
                const card = document.createElement('div');
                card.className = 'doctor-card';
                card.innerHTML = `
                    <div class="doctor-header">
                        <div class="doctor-info">
                            <h3>${doctor.Doctor_Name}</h3>
                            <span class="specialty-badge">${doctor.Specialty}</span>
                        </div>
                        <div class="rating"><i class="fas fa-star"></i> ${doctor.Rating}</div>
                    </div>
                    <div class="doctor-details">
                        <div class="detail-item"><i class="fas fa-map-marker-alt"></i> ${doctor.Address}</div>
                        <div class="detail-item"><i class="fas fa-phone"></i> ${doctor.Contact_No}</div>
                        <div class="detail-item"><i class="fas fa-hospital"></i> ${doctor.Clinic_Hospital}</div>
                        <div class="detail-item"><i class="fas fa-calendar-alt"></i> ${doctor.Days_Available} - ${doctor.Time_Slot}</div>
                    </div>
                    <div class="availability">
                        <h4>Availability</h4>
                        <p>${doctor.Area}, Kolkata</p>
                    </div>
                    <div class="action-buttons">
                        <a href="#" class="btn-primary"><i class="fas fa-calendar-check"></i> Book Appointment</a>
                        <a href="#" class="btn-secondary"><i class="fas fa-info-circle"></i> View Profile</a>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        document.getElementById('results').classList.add('show');
        document.getElementById('loading').classList.remove('show');

    } catch (error) {
        console.error("Error fetching doctors:", error);
        alert("Something went wrong. Please try again.");
        document.getElementById('loading').classList.remove('show');
    }
};
}
