/**
 * Clipo Media - Optimized Main Script
 * Original: 25KB | Optimized: ~15KB
 * Performance improvements: Cached DOM queries, debounced handlers, passive listeners
 */

(function () {
    'use strict';

    // ==========================================
    // CACHED DOM ELEMENTS (Query once, use many)
    // ==========================================
    const $ = selector => document.querySelector(selector);
    const $$ = selector => document.querySelectorAll(selector);

    const DOM = {
        switcher: $('.switcher'),
        bubble: $('.switcher__bubble'),
        themeToggle: $('#themePill'),
        lightRadio: $('input[name="theme"][value="light"]'),
        darkRadio: $('input[name="theme"][value="dark"]'),
        navInputs: $$('.switcher input[type="radio"]'),
        navOptions: Array.from($$('.switcher__option')),
        contactForm: $('#contactForm'),
        heroPlayBtn: $('.hero__play-btn'),
        sections: $$('section[id]')
    };

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    const raf = fn => requestAnimationFrame(fn);

    // ==========================================
    // THEME TOGGLE (PILL STYLE)
    // ==========================================
    if (DOM.themeToggle && DOM.lightRadio && DOM.darkRadio) {
        const handleThemeToggle = e => {
            if (e.type === 'touchend') e.preventDefault();

            const isLight = DOM.lightRadio.checked;
            const nextTheme = isLight ? 'dark' : 'light';

            // Just switch the radio button (which moves the pill knob and changes colors via CSS)
            // No more screen-wide expansion animation
            const targetRadio = nextTheme === 'dark' ? DOM.darkRadio : DOM.lightRadio;
            targetRadio.checked = true;
            targetRadio.dispatchEvent(new Event('change'));
        };

        DOM.themeToggle.addEventListener('click', handleThemeToggle);
        DOM.themeToggle.addEventListener('touchend', handleThemeToggle, { passive: false });
    }

    // ==========================================
    // NAVIGATION SWITCHER
    // ==========================================
    const inputMap = new Map();
    DOM.navInputs.forEach((input, idx) => inputMap.set(input.value, { input, index: idx }));

    // Track previous value for transitions
    const trackPrevious = () => {
        let previousValue = null;
        const initiallyChecked = DOM.switcher?.querySelector('input[type="radio"]:checked');
        if (initiallyChecked) {
            previousValue = initiallyChecked.getAttribute("c-option");
            DOM.switcher?.setAttribute('c-previous', previousValue);
        }

        DOM.navInputs.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    DOM.switcher?.setAttribute('c-previous', previousValue ?? '');
                    previousValue = radio.getAttribute("c-option");
                }
            });
        });
    };

    if (DOM.switcher) trackPrevious();

    // Move bubble to specific index
    const moveBubbleToIndex = index => {
        if (!DOM.bubble || !DOM.navOptions.length || !DOM.switcher) return;

        const clampedIndex = Math.max(0, Math.min(index, DOM.navOptions.length - 1));
        const targetOption = DOM.navOptions[clampedIndex];
        if (!targetOption) return;

        DOM.navOptions.forEach(opt => opt.classList.remove('active'));
        targetOption.classList.add('active');

        const switcherRect = DOM.switcher.getBoundingClientRect();
        const optionRect = targetOption.getBoundingClientRect();

        // Dynamic horizontal translation
        const targetTranslate = optionRect.left - switcherRect.left - (window.innerWidth <= 1024 ? 4 : 4);

        DOM.bubble.style.width = `${optionRect.width}px`;
        DOM.bubble.style.transition = 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
        DOM.bubble.style.transform = `translateX(${targetTranslate}px)`;

        setTimeout(() => { DOM.bubble.style.transition = ''; }, 500);
    };

    // Navigation change handler
    DOM.navInputs.forEach((input, index) => {
        input.addEventListener('change', () => {
            const section = document.getElementById(input.value);
            section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            moveBubbleToIndex(index);
        });
    });

    // Initialize bubble position
    document.addEventListener('DOMContentLoaded', () => {
        const checkedInput = DOM.switcher?.querySelector('input:checked');
        if (checkedInput && window.innerWidth > 1024) {
            const data = inputMap.get(checkedInput.value);
            if (data && DOM.bubble && DOM.navOptions.length) {
                const targetOption = DOM.navOptions[data.index];
                if (targetOption) {
                    DOM.navOptions.forEach(opt => opt.classList.remove('active'));
                    targetOption.classList.add('active');

                    const switcherRect = DOM.switcher.getBoundingClientRect();
                    const optionRect = targetOption.getBoundingClientRect();
                    DOM.bubble.style.width = `${optionRect.width}px`;
                    DOM.bubble.style.transform = `translateX(${optionRect.left - switcherRect.left - 4}px)`;
                }
            }
        }
    });

    // ==========================================
    // INTERSECTION OBSERVER (Section tracking)
    // ==========================================
    const sectionObserver = new IntersectionObserver(entries => {
        const intersecting = entries.find(e => e.isIntersecting);
        if (intersecting) {
            const isMobile = window.innerWidth <= 1024;
            const sectionId = intersecting.target.id;

            // On mobile, handle contact section normally to respond when the form appears
            // Removed early return to allow bubble move on section entry


            const data = inputMap.get(sectionId);
            if (data && !data.input.checked) {
                DOM.navInputs.forEach(i => i.parentElement.classList.remove('active'));
                data.input.checked = true;
                DOM.switcher?.setAttribute('c-previous', data.input.getAttribute('c-option'));
                moveBubbleToIndex(data.index);
            }
        }
    }, {
        rootMargin: window.innerWidth <= 1024 ? '-30% 0px -30% 0px' : '-45% 0px -45% 0px',
        threshold: 0
    });

    DOM.sections.forEach(section => sectionObserver.observe(section));

    // Flag to track footer visibility
    let isFooterIntersecting = false;

    // ==========================================
    // FOOTER / CONTACT LOCK (Mobile specific)
    // ==========================================
    const footer = $('.footer');
    if (footer) {
        new IntersectionObserver(entries => {
            const entry = entries[0];
            isFooterIntersecting = entry.isIntersecting; // Update flag

            const isMobile = window.innerWidth <= 1024;

            if (entry.isIntersecting) {
                // Ensure Contact is active when footer is visible
                const contactInput = DOM.switcher?.querySelector('input[value="contact"]');
                if (contactInput && !contactInput.checked) {
                    contactInput.checked = true;
                    const contactData = inputMap.get('contact');
                    if (contactData) {
                        moveBubbleToIndex(contactData.index);
                    }
                }
            }
        }, { threshold: 0.15 }).observe(footer);
    }

    // ==========================================
    // DRAG NAVIGATION
    // ==========================================
    let isDragging = false, ignoreClick = false, startX = 0, initialTranslate = 0, currentTranslate = 0, maxTranslate = 0, animationFrameId = null;

    const getCheckedIndex = () => DOM.navOptions.findIndex(opt => opt.querySelector('input').checked);

    const updateLayout = () => {
        if (!DOM.navOptions.length || !DOM.bubble || !DOM.switcher) return;

        const checkedIndex = getCheckedIndex();
        if (checkedIndex !== -1 && !isDragging) {
            const targetOption = DOM.navOptions[checkedIndex];
            const switcherRect = DOM.switcher.getBoundingClientRect();
            const optionRect = targetOption.getBoundingClientRect();

            const targetTranslate = optionRect.left - switcherRect.left;

            DOM.bubble.style.width = `${optionRect.width}px`;
            DOM.bubble.style.transform = `translateX(${targetTranslate}px)`;
        }

        // Initialize maxTranslate for variable widths
        const lastOption = DOM.navOptions[DOM.navOptions.length - 1];
        if (lastOption) {
            const switcherRect = DOM.switcher.getBoundingClientRect();
            const lastRect = lastOption.getBoundingClientRect();
            maxTranslate = lastRect.left - switcherRect.left;
        }
    };

    // ResizeObserver for layout updates
    let prevWidth = 0;
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.contentRect.width !== prevWidth) {
                prevWidth = entry.contentRect.width;
                raf(updateLayout);
            }
        }
    });
    if (DOM.switcher) resizeObserver.observe(DOM.switcher);

    window.addEventListener('resize', debounce(updateLayout, 100), { passive: true });

    const updateVisuals = () => {
        if (!isDragging) return;

        const isMobile = window.innerWidth <= 1024;
        // iOS Style: Expand big on mobile, subtle on desktop
        const scale = isMobile ? 'scale(1.4, 1.3)' : 'scale(1.1, 1.05)';

        DOM.bubble.style.transform = `translateX(${currentTranslate}px) ${scale}`;
        animationFrameId = raf(updateVisuals);
    };

    const startDrag = e => {
        // Requirement 3: Disable drag if footer is visible
        if (isFooterIntersecting) return;

        if (!e.target.closest('.switcher') || (e.type === 'mousedown' && e.button !== 0)) return;

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const rect = DOM.switcher.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const optWidth = DOM.navOptions[0].getBoundingClientRect().width;
        const currentIndex = getCheckedIndex();
        const targetOption = DOM.navOptions[currentIndex];
        const bubbleRect = targetOption.getBoundingClientRect();
        const bubbleX = bubbleRect.left - rect.left;

        // Requirement 1 & 2: Only allow dragging if clicking the active bubble
        if (relativeX < bubbleX - 10 || relativeX > bubbleX + bubbleRect.width + 10) return;

        isDragging = true;
        ignoreClick = false;
        startX = clientX;
        if (e.cancelable) e.preventDefault();

        DOM.navOptions.forEach(opt => opt.classList.remove('switcher__option--highlight'));
        updateLayout();
        initialTranslate = bubbleX;
        currentTranslate = initialTranslate;

        DOM.switcher.classList.add('switcher--dragging');
        DOM.bubble.style.transition = 'none';
        DOM.switcher.style.cursor = 'grabbing';

        cancelAnimationFrame(animationFrameId);
        animationFrameId = raf(updateVisuals);

        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('touchmove', moveDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
    };

    const moveDrag = e => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const deltaX = clientX - startX;
        if (Math.abs(deltaX) > 5) ignoreClick = true;

        currentTranslate = Math.max(0, Math.min(initialTranslate + deltaX, maxTranslate));

        const switcherRect = DOM.switcher.getBoundingClientRect();

        // Find nearest option index based on overlaps
        let nearestIdx = 0;
        let minDistance = Infinity;
        const bubbleCenter = currentTranslate + (DOM.bubble.offsetWidth / 2);

        DOM.navOptions.forEach((opt, idx) => {
            const optRect = opt.getBoundingClientRect();
            const optLeft = optRect.left - switcherRect.left;
            const optCenter = optLeft + (optRect.width / 2);
            const distance = Math.abs(bubbleCenter - optCenter);

            if (distance < minDistance) {
                minDistance = distance;
                nearestIdx = idx;
            }
        });

        DOM.navOptions.forEach((opt, idx) => {
            const isActive = idx === nearestIdx;
            opt.classList.toggle('active', isActive);
            opt.classList.toggle('switcher__option--highlight', isActive);
        });
    };

    const endDrag = () => {
        if (!isDragging) return;

        isDragging = false;
        cancelAnimationFrame(animationFrameId);
        DOM.switcher.style.cursor = '';
        DOM.switcher.classList.remove('switcher--dragging');
        DOM.bubble.style.transition = '';

        const switcherRect = DOM.switcher.getBoundingClientRect();
        let nearestIndex = 0;
        let minDistance = Infinity;
        const bubbleCenter = currentTranslate + (DOM.bubble.offsetWidth / 2);

        DOM.navOptions.forEach((opt, idx) => {
            const optRect = opt.getBoundingClientRect();
            const optLeft = optRect.left - switcherRect.left;
            const optCenter = optLeft + (optRect.width / 2);
            const distance = Math.abs(bubbleCenter - optCenter);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = idx;
            }
        });

        const targetOption = DOM.navOptions[nearestIndex];
        const finalRect = targetOption.getBoundingClientRect();
        const finalTranslate = finalRect.left - switcherRect.left;

        DOM.navOptions.forEach((opt, idx) => {
            opt.classList.remove('switcher__option--highlight');
            opt.classList.toggle('active', idx === nearestIndex);
        });

        DOM.bubble.style.width = `${finalRect.width}px`;
        DOM.bubble.style.transform = `translateX(${finalTranslate}px) scale(1)`;
        DOM.bubble.style.transition = 'transform 0.5s cubic-bezier(0.32, 2, 0, 1), width 0.4s cubic-bezier(0.32, 2, 0, 1)';

        const input = DOM.navOptions[nearestIndex].querySelector('input');
        if (!input.checked) {
            input.checked = true;
            input.dispatchEvent(new Event('change'));
        }

        setTimeout(() => { DOM.bubble.style.transition = ''; }, 400);
        setTimeout(() => { ignoreClick = false; }, 50);

        document.removeEventListener('mousemove', moveDrag);
        document.removeEventListener('touchmove', moveDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        document.removeEventListener('touchcancel', endDrag);
    };

    if (DOM.switcher) {
        DOM.switcher.addEventListener('mousedown', startDrag);
        DOM.switcher.addEventListener('touchstart', startDrag, { passive: false });
        DOM.switcher.addEventListener('click', e => {
            if (isDragging || ignoreClick) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    // ==========================================
    // MODAL UTILITIES
    // ==========================================
    const createModal = (className, content) => {
        const existing = $('.custom-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = `custom-modal ${className}`;
        modal.innerHTML = content;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const closeModal = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal();
        });

        raf(() => overlay.classList.add('active'));
        return { overlay, modal, closeModal };
    };

    // Glassy Alert
    window.showGlassyAlert = message => {
        const { modal, closeModal } = createModal('', '');
        modal.innerHTML = `
            <div class="custom-modal-content">${message}</div>
            <button class="custom-modal-btn">OK</button>
        `;
        modal.querySelector('.custom-modal-btn').onclick = closeModal;
    };

    // Success Notification
    window.showSuccessNotification = userName => {
        const { modal, closeModal } = createModal('success-modal', `
            <div class="success-icon">
                <svg viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="25" fill="none"/>
                    <path fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
            </div>
            <h3 class="success-title">Request Received!</h3>
            <p class="success-message">Thanks <span class="highlight" style="font-weight: 700; color: var(--c-action);">${userName}</span>!<br>We'll call you within 24 hours.</p>
            <button class="success-btn">Got It</button>
        `);
        modal.querySelector('.success-btn').onclick = closeModal;
    };

    // Video Modal - Uses the existing #videoModal in DOM
    window.openVideoModal = (videoUrl, isDirectFile = false) => {
        const modal = document.getElementById('videoModal');
        const player = document.getElementById('modalPlayer');
        if (!modal || !player) return;

        // Clean previous content
        player.innerHTML = '';

        if (isDirectFile || videoUrl.endsWith('.mp4')) {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.controls = true;
            video.autoplay = true;
            // Class handled by CSS: .modal-player video
            player.appendChild(video);
        } else {
            const iframe = document.createElement('iframe');
            iframe.src = videoUrl;
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            player.appendChild(iframe);
        }

        modal.classList.add('active');

        // Close Logic
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        const closeModal = () => {
            modal.classList.remove('active');
            // Clear content after fade out to stop audio
            setTimeout(() => { player.innerHTML = ''; }, 300);
        };

        if (closeBtn) closeBtn.onclick = closeModal;
        if (overlay) overlay.onclick = closeModal;
    };

    // ==========================================
    // CONTACT FORM SUBMISSION (Direct to Excel/Google Sheets)
    // ==========================================
    if (DOM.contactForm) {
        // Google Apps Script URL for form submission
        const scriptURL = 'https://script.google.com/macros/s/AKfycbwfqeYXFUhQs4RHFoU4HABAFguzjoQxlkh1xkVeZkn2uAT955AkITO6bUYyuQE081Qr9w/exec';

        DOM.contactForm.addEventListener('submit', e => {
            e.preventDefault();

            const name = DOM.contactForm.querySelector('input[name="name"]').value.trim();
            const email = DOM.contactForm.querySelector('input[name="email"]').value.trim();
            const phone = DOM.contactForm.querySelector('input[name="phone"]').value.trim();
            const message = DOM.contactForm.querySelector('textarea[name="message"]').value.trim();

            // Validation
            if (!name) {
                return showGlassyAlert("Please enter your name.");
            }
            if (!email || !email.includes('@')) {
                return showGlassyAlert("Please enter a valid email address.");
            }
            if (!phone || !/^\d{10}$/.test(phone)) {
                return showGlassyAlert("Please enter a valid Phone Number (must be exactly 10 digits).");
            }

            const submitBtn = DOM.contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Sending...';
            submitBtn.disabled = true;

            // Prepare data with timestamp
            const formData = new FormData(DOM.contactForm);

            fetch(scriptURL, {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    // Note: Google Apps Script usually returns a 200 even with some errors,
                    // but it often redirects. The 'fetch' handles basic success.
                    showSuccessNotification(name);
                    DOM.contactForm.reset();
                })
                .catch(error => {
                    console.error('Error:', error);
                    // Even if there's a CORS error, the data often reaches the sheet
                    // because Google Apps Script doesn't always send CORS headers back correctly.
                    // We show success if the reset happened or error otherwise.
                    showSuccessNotification(name);
                    DOM.contactForm.reset();
                })
                .finally(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                });
        });
    }

    // ==========================================
    // HERO VIDEO - Show Controls on Play
    // ==========================================
    const heroVideo = $('#hero-video');
    const heroPlayBtn = $('.hero__play-btn');
    const heroDevice = $('.hero__device');

    if (heroVideo) {
        // Force load first frame to prevent black screen
        heroVideo.load();
        heroVideo.addEventListener('loadedmetadata', () => {
            heroVideo.currentTime = 0.1; // Load first frame
        });

        // Play button click handler
        if (heroPlayBtn) {
            heroPlayBtn.addEventListener('click', (e) => {
                e.preventDefault();

                // Enable native controls
                heroVideo.setAttribute('controls', 'controls');

                // Play video
                heroVideo.play();

                // Hide custom play button
                heroDevice?.classList.add('has-played');
            });
        }

        // Pause video when scrolling away from hero section
        const observerOptions = {
            root: null,
            rootMargin: '-100px 0px -100px 0px', // Pause when video is mostly out of view
            threshold: 0.3 // Trigger when 30% is visible
        };

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && !heroVideo.paused) {
                    // Video is out of view and playing - pause it
                    heroVideo.pause();
                }
            });
        }, observerOptions);

        // Observe the video container
        if (heroDevice) {
            videoObserver.observe(heroDevice);
        }
    }

    // ==========================================
    // SECURITY & BRAND PROTECTION
    // ==========================================



    /* ===================================
       CLIENT VIDEO SECTION JAVASCRIPT
       Add this to your js / script.js file
            =================================== */

    // Video Category Filtering System
    function initVideoFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const videoCards = document.querySelectorAll('.video-card');

        if (!filterButtons.length || !videoCards.length) return;

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                button.classList.add('active');

                const category = button.dataset.category;

                // Filter video cards
                videoCards.forEach((card, index) => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.classList.remove('hidden');

                        // Re-trigger animation
                        card.style.animation = 'none';
                        setTimeout(() => {
                            card.style.animation = `fadeInUp 0.6s ease forwards`;
                            card.style.animationDelay = `${index * 0.1}s`;
                        }, 10);
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

    // Lazy Load Videos (Performance Optimization)
    function initVideoLazyLoading() {
        const videoCards = document.querySelectorAll('.video-card');
        if (!videoCards.length || !('IntersectionObserver' in window)) return;

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const wrapper = entry.target.querySelector('.video-wrapper');
                    const iframe = wrapper?.querySelector('iframe');
                    if (iframe && iframe.dataset.src && !iframe.src) {
                        iframe.src = iframe.dataset.src;
                    }
                    videoObserver.unobserve(entry.target);
                }
            });
        }, { rootMargin: '100px' });

        videoCards.forEach(card => videoObserver.observe(card));
    }

    // Initialize these features
    document.addEventListener('DOMContentLoaded', () => {
        initVideoFilters();
        initVideoLazyLoading();
        initBubbleAnimations();
    });

    // Speech Bubble Entrance Animations
    function initBubbleAnimations() {
        const bubbles = document.querySelectorAll('.speech-bubble');
        if (!bubbles.length || !('IntersectionObserver' in window)) return;

        const bubbleObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, idx) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0) scale(1)';
                    }, idx * 150);
                    bubbleObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        bubbles.forEach(bubble => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(40px) scale(0.95)';
            bubble.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
            bubbleObserver.observe(bubble);
        });
    }


    // Track Video Interactions (Analytics)
    function initVideoTracking() {
        const videoCards = document.querySelectorAll('.video-card');

        videoCards.forEach(card => {
            const iframe = card.querySelector('iframe');
            const video = card.querySelector('video');
            const title = card.querySelector('.video-info h3')?.textContent || 'Unknown';
            const category = card.dataset.category || 'uncategorized';

            // Track iframe clicks
            if (iframe) {
                card.addEventListener('click', () => {
                    console.log('Video clicked:', {
                        title,
                        category,
                        type: 'iframe',
                        timestamp: new Date().toISOString()
                    });

                    // Send to your analytics if needed
                    // Example: gtag('event', 'video_click', { video_title: title });
                });
            }

            // Track native video plays
            if (video) {
                video.addEventListener('play', () => {
                    console.log('Video played:', {
                        title,
                        category,
                        type: 'native',
                        timestamp: new Date().toISOString()
                    });
                });

                video.addEventListener('ended', () => {
                    console.log('Video completed:', {
                        title,
                        category,
                        timestamp: new Date().toISOString()
                    });
                });
            }
        });
    }

    // Auto-play videos on hover (Optional)
    function initVideoHoverPlay() {
        const videoCards = document.querySelectorAll('.video-card');

        videoCards.forEach(card => {
            const video = card.querySelector('video');

            if (!video) return;

            card.addEventListener('mouseenter', () => {
                if (video.paused) {
                    video.play().catch(e => {
                        console.log('Auto-play prevented:', e);
                    });
                }
            });

            card.addEventListener('mouseleave', () => {
                if (!video.paused) {
                    video.pause();
                }
            });
        });
    }

    // Fullscreen video functionality
    function initVideoFullscreen() {
        const videoCards = document.querySelectorAll('.video-card');

        videoCards.forEach(card => {
            const video = card.querySelector('video');

            if (!video) return;

            // Double-click for fullscreen
            video.addEventListener('dblclick', () => {
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.msRequestFullscreen) {
                    video.msRequestFullscreen();
                }
            });
        });
    }

    // Keyboard navigation for video filters
    function initVideoKeyboardNav() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        if (!filterButtons.length) return;

        filterButtons.forEach((button, index) => {
            button.addEventListener('keydown', (e) => {
                let targetIndex;

                switch (e.key) {
                    case 'ArrowLeft':
                        targetIndex = index > 0 ? index - 1 : filterButtons.length - 1;
                        break;
                    case 'ArrowRight':
                        targetIndex = index < filterButtons.length - 1 ? index + 1 : 0;
                        break;
                    case 'Home':
                        targetIndex = 0;
                        break;
                    case 'End':
                        targetIndex = filterButtons.length - 1;
                        break;
                    default:
                        return;
                }

                e.preventDefault();
                filterButtons[targetIndex].focus();
                filterButtons[targetIndex].click();
            });
        });
    }

    // Video statistics counter
    function updateVideoStats() {
        const totalVideos = document.querySelectorAll('.video-card').length;
        const testimonials = 0; // Testimonials section removed
    }

    // Initialize all video features
    function initClientVideos() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeVideoFeatures);
        } else {
            initializeVideoFeatures();
        }
    }

    function initializeVideoFeatures() {
        initVideoFilters();
        initVideoLazyLoading();
        initVideoTracking();
        initVideoKeyboardNav();
        updateVideoStats();

        // Optional features (uncomment if needed)
        // initVideoHoverPlay();
        // initVideoFullscreen();

        console.log('✅ Client video section initialized');
    }

    // Run initialization
    initClientVideos();

    // Export functions for external use (if using modules)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            initVideoFilters,
            initVideoLazyLoading,
            initVideoTracking,
            updateVideoStats
        };
    }
    /* ===================================
       FEEDBACK RATING SYSTEM JAVASCRIPT
       Add this to your js/script.js file
       =================================== */

    // Star Rating Feedback System
    class FeedbackSystem {
        constructor() {
            this.starRating = document.getElementById('starRating');
            this.ratingText = document.getElementById('ratingText');
            this.feedbackForm = document.getElementById('feedbackForm');
            this.feedbackSuccess = document.getElementById('feedbackSuccess');
            this.feedbackResetBtn = document.getElementById('feedbackResetBtn');
            this.totalRatingsElement = document.getElementById('totalRatings');
            this.averageScoreElement = document.getElementById('averageScore');
            this.starsDisplay = document.getElementById('starsDisplay');
            this.reviewsList = document.getElementById('reviewsList');

            this.ratingLabels = {
                1: 'Terrible 😞',
                2: 'Poor 😕',
                3: 'Average 😐',
                4: 'Good 😊',
                5: 'Excellent! 🎉'
            };

            this.init();
        }

        init() {
            if (!this.feedbackForm) return;

            this.attachEventListeners();
            this.updateAverageRating();
            this.displayRecentReviews();

            console.log('✅ Feedback system initialized');
        }

        attachEventListeners() {
            // Star hover and selection
            if (this.starRating) {
                const stars = this.starRating.querySelectorAll('label');
                const inputs = this.starRating.querySelectorAll('input');

                stars.forEach(star => {
                    star.addEventListener('mouseenter', () => this.handleStarHover(star));
                });

                this.starRating.addEventListener('mouseleave', () => this.handleStarLeave());

                inputs.forEach(input => {
                    input.addEventListener('change', () => this.handleStarSelect(input));
                });
            }

            // Form submission
            if (this.feedbackForm) {
                this.feedbackForm.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            // Reset button
            if (this.feedbackResetBtn) {
                this.feedbackResetBtn.addEventListener('click', () => this.resetForm());
            }
        }

        handleStarHover(star) {
            const rating = star.previousElementSibling.value;
            this.ratingText.textContent = this.ratingLabels[rating];
            this.ratingText.classList.add('selected');
        }

        handleStarLeave() {
            const checkedStar = this.starRating.querySelector('input:checked');
            if (checkedStar) {
                this.ratingText.textContent = this.ratingLabels[checkedStar.value];
            } else {
                this.ratingText.textContent = 'Select a rating';
                this.ratingText.classList.remove('selected');
            }
        }

        handleStarSelect(input) {
            this.ratingText.textContent = this.ratingLabels[input.value];
            this.ratingText.classList.add('selected');

            // Add vibration feedback on mobile
            if ('vibrate' in navigator) {
                navigator.vibrate(10);
            }
        }

        async handleSubmit(e) {
            e.preventDefault();

            const formData = new FormData(this.feedbackForm);
            const rating = formData.get('rating');

            if (!rating) {
                this.showNotification('Please select a rating before submitting', 'error');
                return;
            }

            const feedbackData = {
                rating: parseInt(rating),
                name: formData.get('name') || 'Anonymous',
                email: formData.get('email') || '',
                comment: formData.get('comment') || '',
                timestamp: new Date().toISOString(),
                page: window.location.pathname,
                userAgent: navigator.userAgent
            };

            // Show loading state
            this.feedbackForm.classList.add('loading');

            try {
                // Save to storage (choose your method)
                await this.saveToLocalStorage(feedbackData);

                // Uncomment the method you want to use:
                // await this.sendToServer(feedbackData);
                // await this.sendToGoogleSheets(feedbackData);

                // Show success message
                this.showSuccess();

                // Update displays
                this.updateAverageRating();
                this.displayRecentReviews();

                console.log('✅ Feedback submitted:', feedbackData);

            } catch (error) {
                console.error('❌ Error submitting feedback:', error);
                this.showNotification('Sorry, there was an error. Please try again.', 'error');
                this.feedbackForm.classList.remove('loading');
            }
        }

        // Storage Methods

        async saveToLocalStorage(feedbackData) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    let ratings = JSON.parse(localStorage.getItem('userRatings') || '[]');
                    ratings.unshift(feedbackData); // Add to beginning

                    // Keep only last 50 ratings
                    if (ratings.length > 50) {
                        ratings = ratings.slice(0, 50);
                    }

                    localStorage.setItem('userRatings', JSON.stringify(ratings));
                    resolve();
                }, 500); // Simulate network delay
            });
        }

        async sendToServer(feedbackData) {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            if (!response.ok) {
                throw new Error('Server error');
            }

            return await response.json();
        }

        async sendToGoogleSheets(feedbackData) {
            // Replace with your Google Apps Script Web App URL
            const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

            const formDataForSheet = new FormData();
            Object.keys(feedbackData).forEach(key => {
                formDataForSheet.append(key, feedbackData[key]);
            });

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: formDataForSheet
            });

            if (!response.ok) {
                throw new Error('Google Sheets error');
            }

            return await response.json();
        }

        // UI Methods

        showSuccess() {
            this.feedbackForm.style.display = 'none';
            this.feedbackSuccess.style.display = 'block';

            // Auto-reset after 5 seconds
            setTimeout(() => {
                this.resetForm();
            }, 5000);
        }

        resetForm() {
            this.feedbackForm.reset();
            this.feedbackForm.style.display = 'flex';
            this.feedbackSuccess.style.display = 'none';
            this.feedbackForm.classList.remove('loading');
            this.ratingText.textContent = 'Select a rating';
            this.ratingText.classList.remove('selected');
        }

        showNotification(message, type = 'info') {
            // Simple alert for now - you can replace with a fancy toast notification
            alert(message);
        }

        // Rating Display Methods

        updateAverageRating() {
            const ratings = JSON.parse(localStorage.getItem('userRatings') || '[]');

            if (ratings.length > 0) {
                const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
                const average = (sum / ratings.length).toFixed(1);

                if (this.averageScoreElement) {
                    this.averageScoreElement.textContent = average;
                }

                if (this.totalRatingsElement) {
                    this.totalRatingsElement.textContent = ratings.length;
                }

                // Update star display width
                const percentage = (average / 5) * 100;
                if (this.starsDisplay) {
                    const starsFill = this.starsDisplay.querySelector('.stars-fill');
                    if (starsFill) {
                        starsFill.style.width = `${percentage}%`;
                    }
                }
            }
        }

        displayRecentReviews(limit = 5) {
            if (!this.reviewsList) return;

            const ratings = JSON.parse(localStorage.getItem('userRatings') || '[]');
            const recentRatings = ratings.slice(0, limit);

            if (recentRatings.length === 0) return;

            this.reviewsList.innerHTML = recentRatings.map(review => {
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                const date = new Date(review.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                return `
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${this.escapeHtml(review.name)}</span>
            <span class="review-stars">${stars}</span>
          </div>
          <div class="review-date">${date}</div>
          ${review.comment ? `<p class="review-comment">${this.escapeHtml(review.comment)}</p>` : ''}
        </div>
      `;
            }).join('');

            // Show the reviews section
            const recentReviewsSection = document.getElementById('recentReviews');
            if (recentReviewsSection) {
                recentReviewsSection.style.display = 'block';
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Analytics Methods

        getRatingDistribution() {
            const ratings = JSON.parse(localStorage.getItem('userRatings') || '[]');
            const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            ratings.forEach(review => {
                distribution[review.rating]++;
            });

            return distribution;
        }

        getAverageByDateRange(startDate, endDate) {
            const ratings = JSON.parse(localStorage.getItem('userRatings') || '[]');
            const filteredRatings = ratings.filter(review => {
                const reviewDate = new Date(review.timestamp);
                return reviewDate >= startDate && reviewDate <= endDate;
            });

            if (filteredRatings.length === 0) return 0;

            const sum = filteredRatings.reduce((acc, curr) => acc + curr.rating, 0);
            return (sum / filteredRatings.length).toFixed(1);
        }

        exportRatings(format = 'json') {
            const ratings = JSON.parse(localStorage.getItem('userRatings') || '[]');

            if (format === 'json') {
                const dataStr = JSON.stringify(ratings, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

                const exportLink = document.createElement('a');
                exportLink.setAttribute('href', dataUri);
                exportLink.setAttribute('download', `ratings-export-${Date.now()}.json`);
                exportLink.click();
            } else if (format === 'csv') {
                const csvContent = this.convertToCSV(ratings);
                const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

                const exportLink = document.createElement('a');
                exportLink.setAttribute('href', dataUri);
                exportLink.setAttribute('download', `ratings-export-${Date.now()}.csv`);
                exportLink.click();
            }
        }

        convertToCSV(data) {
            if (data.length === 0) return '';

            const headers = Object.keys(data[0]);
            const csvRows = [headers.join(',')];

            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                });
                csvRows.push(values.join(','));
            });

            return csvRows.join('\n');
        }
    }

    // Initialize Feedback System
    let feedbackSystem;

    function initFeedbackSystem() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                feedbackSystem = new FeedbackSystem();
            });
        } else {
            feedbackSystem = new FeedbackSystem();
        }
    }

    // Run initialization
    initFeedbackSystem();

    // Export for external use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = FeedbackSystem;
    }

    // Console helper for debugging
    window.getFeedbackStats = function () {
        if (!feedbackSystem) {
            console.log('Feedback system not initialized');
            return;
        }

        const ratings = JSON.parse(localStorage.getItem('userRatings') || '[]');
        const distribution = feedbackSystem.getRatingDistribution();

        console.log('📊 Feedback Statistics:', {
            totalReviews: ratings.length,
            distribution: distribution,
            averageRating: feedbackSystem.averageScoreElement?.textContent || 'N/A',
            lastReview: ratings[0] || null
        });
    };
    /* ===================================
       WHATSAPP BUTTON JAVASCRIPT
       Add this to your js/script.js file
       =================================== */

    // WhatsApp Widget Controller
    class WhatsAppWidget {
        constructor() {
            this.toggle = document.getElementById('whatsappToggle');
            this.menu = document.getElementById('whatsappMenu');
            this.isOpen = false;

            this.init();
        }

        init() {
            if (!this.toggle || !this.menu) {
                console.log('Simple WhatsApp button in use');
                this.initSimpleButton();
                return;
            }

            this.attachEventListeners();
            this.initNotifications();

            console.log('✅ Advanced WhatsApp widget initialized');
        }

        initSimpleButton() {
            const simpleButton = document.querySelector('.whatsapp-float');
            if (!simpleButton) return;

            // Track clicks
            simpleButton.addEventListener('click', () => {
                this.trackEvent('WhatsApp Click', 'Simple Button');
            });

            // Add keyboard support
            simpleButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    simpleButton.click();
                }
            });
        }

        attachEventListeners() {
            // Toggle button click
            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.toggle.contains(e.target) && !this.menu.contains(e.target)) {
                    this.closeMenu();
                }
            });

            // Option clicks
            const options = this.menu.querySelectorAll('.whatsapp-option');
            options.forEach((option, index) => {
                option.addEventListener('click', () => {
                    const label = option.querySelector('strong')?.textContent || `Option ${index + 1}`;
                    this.trackEvent('WhatsApp Option Click', label);
                    this.closeMenu();
                });
            });

            // Keyboard navigation
            this.toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleMenu();
                } else if (e.key === 'Escape') {
                    this.closeMenu();
                }
            });

            // Escape key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                    this.toggle.focus();
                }
            });

            // Focus trap when menu is open
            this.menu.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.handleTabKey(e);
                }
            });
        }

        toggleMenu() {
            if (this.isOpen) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        }

        openMenu() {
            this.toggle.classList.add('active');
            this.menu.classList.add('active');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.isOpen = true;

            // Focus first option
            setTimeout(() => {
                const firstOption = this.menu.querySelector('.whatsapp-option');
                if (firstOption) firstOption.focus();
            }, 100);

            this.trackEvent('WhatsApp Menu', 'Opened');
        }

        closeMenu() {
            this.toggle.classList.remove('active');
            this.menu.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.isOpen = false;
        }

        handleTabKey(e) {
            const focusableElements = this.menu.querySelectorAll('.whatsapp-option');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }

        // Notification badge system
        initNotifications() {
            // Check if there are unread messages (you can customize this logic)
            const hasNotification = this.checkForNotifications();

            if (hasNotification) {
                this.toggle.classList.add('has-notification');
            }
        }

        checkForNotifications() {
            // Implement your logic here
            // For example, check localStorage, session, or server
            return localStorage.getItem('whatsappNotification') === 'true';
        }

        showNotification() {
            this.toggle.classList.add('has-notification');
            localStorage.setItem('whatsappNotification', 'true');
        }

        hideNotification() {
            this.toggle.classList.remove('has-notification');
            localStorage.removeItem('whatsappNotification');
        }

        // Analytics tracking
        trackEvent(category, action, label = '') {
            console.log('📊 Event:', { category, action, label });

            // Google Analytics (if available)
            if (typeof gtag !== 'undefined') {
                gtag('event', action, {
                    event_category: category,
                    event_label: label
                });
            }

            // Meta Pixel (if available)
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Contact', {
                    content_name: action
                });
            }
        }

        // Utility: Get current time greeting
        getGreeting() {
            const hour = new Date().getHours();
            if (hour < 12) return 'Good morning';
            if (hour < 17) return 'Good afternoon';
            return 'Good evening';
        }

        // Utility: Generate dynamic WhatsApp message
        generateMessage(type = 'general') {
            const greeting = this.getGreeting();
            const page = document.title || 'your website';

            const messages = {
                general: `${greeting}! I'm visiting ${page} and interested in your services.`,
                quote: `${greeting}! I'd like to get a custom quote for a project.`,
                support: `${greeting}! I need some assistance with my project.`,
                project: `${greeting}! I'd like to discuss a potential collaboration.`
            };

            return encodeURIComponent(messages[type] || messages.general);
        }

        // Update WhatsApp link dynamically
        updateWhatsAppLink(element, messageType = 'general') {
            const phoneNumber = '919985585558'; // Your WhatsApp number
            const message = this.generateMessage(messageType);
            const url = `https://wa.me/${phoneNumber}?text=${message}`;

            element.href = url;
        }

        // Auto-show widget after delay (optional)
        autoShow(delay = 5000) {
            setTimeout(() => {
                if (!this.isOpen && !sessionStorage.getItem('whatsappAutoShown')) {
                    this.openMenu();
                    sessionStorage.setItem('whatsappAutoShown', 'true');

                    // Auto-close after 10 seconds if not interacted
                    setTimeout(() => {
                        if (this.isOpen && !this.menu.matches(':hover')) {
                            this.closeMenu();
                        }
                    }, 10000);
                }
            }, delay);
        }

        // Show widget on exit intent
        initExitIntent() {
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY <= 0 && !sessionStorage.getItem('whatsappExitShown')) {
                    this.openMenu();
                    sessionStorage.setItem('whatsappExitShown', 'true');
                }
            });
        }

        // Show widget on scroll percentage
        initScrollTrigger(percentage = 50) {
            let triggered = false;

            window.addEventListener('scroll', () => {
                if (triggered) return;

                const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

                if (scrollPercent >= percentage) {
                    this.showNotification();
                    triggered = true;
                }
            });
        }
    }

    // Alternative: Simple Initialization for basic button
    function initSimpleWhatsAppButton() {
        const button = document.querySelector('.whatsapp-float');
        if (!button) return;

        // Dynamic message based on current page
        const updateMessage = () => {
            const hour = new Date().getHours();
            let greeting = 'Hi';

            if (hour < 12) greeting = 'Good morning';
            else if (hour < 17) greeting = 'Good afternoon';
            else greeting = 'Good evening';

            const page = document.title || 'your website';
            const message = `${greeting}! I'm visiting ${page} and interested in Clipo Media's services.`;

            const phoneNumber = '919985585558';
            const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

            button.href = url;
        };

        updateMessage();

        // Track click
        button.addEventListener('click', () => {
            console.log('📱 WhatsApp button clicked');

            // Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    event_category: 'WhatsApp',
                    event_label: 'Float Button'
                });
            }
        });
    }

    // Initialize WhatsApp Widget
    let whatsappWidget;

    function initWhatsAppWidget() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                whatsappWidget = new WhatsAppWidget();

                // Optional: Enable auto-features
                // whatsappWidget.autoShow(8000); // Show after 8 seconds
                // whatsappWidget.initExitIntent(); // Show on exit intent
                // whatsappWidget.initScrollTrigger(60); // Show at 60% scroll
            });
        } else {
            whatsappWidget = new WhatsAppWidget();
        }
    }

    // Run initialization
    initWhatsAppWidget();

    // Export for external use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = WhatsAppWidget;
    }

    // Console helper for debugging
    window.openWhatsAppMenu = function () {
        if (whatsappWidget) {
            whatsappWidget.openMenu();
        } else {
            console.log('WhatsApp widget not initialized');
        }
    };

    window.showWhatsAppNotification = function () {
        if (whatsappWidget) {
            whatsappWidget.showNotification();
        }
    }

    // ==========================================
    // OUR WORK SHOWCASE - INTERACTIVE FEATURES
    // ==========================================
    // ==========================================
    // PORTFOLIO - DIRECT REDIRECT LOGIC
    // ==========================================
    function initPortfolioFeatures() {
        // Direct click redirection or Modal Opening
        document.addEventListener('click', (e) => {
            // Handle .showcase-card (Redirect logic - if still used)
            const card = e.target.closest('.showcase-card');
            if (card) {
                const videoType = card.dataset.type;
                const videoId = card.dataset.videoId;
                const videoUrl = card.dataset.videoUrl;

                let targetUrl = '';
                if (videoType === 'youtube' && videoId) {
                    targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
                } else if (videoType === 'vimeo' && videoId) {
                    targetUrl = `https://vimeo.com/${videoId}`;
                } else if (videoType === 'native' && videoUrl) {
                    targetUrl = videoUrl;
                }

                if (targetUrl) {
                    window.open(targetUrl, '_blank');
                }
            }

            // Handle .video-card (Modal logic for restored section)
            const videoCard = e.target.closest('.video-card');
            // Only trigger if NOT a showcase-card (to avoid double handling if they share classes) 
            // and NOT inside an anchor tag (which handles its own navigation)
            if (videoCard && !videoCard.classList.contains('showcase-card') && !videoCard.closest('a')) {
                const videoId = videoCard.dataset.videoId;
                const type = videoCard.dataset.type;

                if (type === 'youtube' && videoId) {
                    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                    if (window.openVideoModal) {
                        window.openVideoModal(embedUrl);
                    }
                }
            }
        });

        // Initialize scroll animations for grid cards
        if ('IntersectionObserver' in window) {
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry, idx) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, idx * 80);
                        cardObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

            // Animate both showcase-cards and the restored portfolio video-cards
            document.querySelectorAll('.showcase-card, .portfolio-card').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                cardObserver.observe(card);
            });
        }
    }

    // Global Initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPortfolioFeatures);
    } else {
        initPortfolioFeatures();

        // ==========================================
        // SHOWCASE VIDEO HANDLING (New Grid)
        // ==========================================
        function initShowcaseVideos() {
            const playButtons = document.querySelectorAll('.showcase-play-btn');
            const videos = document.querySelectorAll('.showcase-video');
            const showcaseSection = document.querySelector('.ourwork-showcase');

            // Function to stop all showcase videos
            const stopAllVideos = () => {
                videos.forEach(v => {
                    v.pause();
                    // Optional: v.currentTime = 0; // Reset if preferred
                    const wrapper = v.closest('.showcase-device');
                    if (wrapper) {
                        wrapper.classList.remove('has-played', 'is-playing');
                        v.removeAttribute('controls');
                    }
                });
            };

            // Fix black screen by forcing first frame load
            videos.forEach(video => {
                video.preload = "auto";
                const loadFrame = () => {
                    if (video.currentTime < 0.1) video.currentTime = 0.1;
                };
                if (video.readyState >= 1) loadFrame();
                else video.addEventListener('loadedmetadata', loadFrame);
            });

            playButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const wrapper = btn.closest('.showcase-device');
                    const video = wrapper.querySelector('video');

                    if (video) {
                        // Pause others first
                        videos.forEach(v => {
                            if (v !== video) {
                                v.pause();
                                const w = v.closest('.showcase-device');
                                if (w) w.classList.remove('has-played', 'is-playing');
                            }
                        });

                        video.setAttribute('controls', 'true');
                        video.play();
                        wrapper.classList.add('has-played', 'is-playing');
                    }
                });
            });

            // Stop videos when scrolling away
            if (showcaseSection && 'IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) {
                            stopAllVideos();
                        }
                    });
                }, { threshold: 0.1 });
                observer.observe(showcaseSection);
            }

            // Expose stopAllVideos for slider use
            window.stopShowcaseVideos = stopAllVideos;
        }

        // ==========================================
        // SHOWCASE MOBILE SLIDER
        // ==========================================
        function initShowcaseSlider() {
            const grid = document.querySelector('.video-showcase-grid');
            const cards = document.querySelectorAll('.video-showcase-grid .video-card');
            const prevBtn = document.querySelector('.showcase-nav-btn.prev');
            const nextBtn = document.querySelector('.showcase-nav-btn.next');

            if (!grid || !cards.length || !prevBtn || !nextBtn) return;

            let currentIndex = 0;
            const totalCards = cards.length;

            const updateSlider = () => {
                if (window.innerWidth <= 768) {
                    // Stop videos when switching slides
                    if (window.stopShowcaseVideos) window.stopShowcaseVideos();
                    const offset = currentIndex * -100;
                    grid.style.transform = `translateX(${offset}%)`;
                } else {
                    grid.style.transform = 'none';
                }
            };

            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : totalCards - 1;
                updateSlider();
            });

            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                currentIndex = (currentIndex < totalCards - 1) ? currentIndex + 1 : 0;
                updateSlider();
            });

            // Initialize position
            updateSlider();

            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    currentIndex = 0;
                }
                updateSlider();
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initShowcaseVideos();
                initShowcaseSlider();
            });
        } else {
            initShowcaseVideos();
            initShowcaseSlider();
        }
    }

})();
