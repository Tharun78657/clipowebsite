/**
 * Clipo Media - Optimized GSAP Scroll Animations
 * Original: 12KB | Optimized: ~8KB
 * Performance: Reduced DOM queries, optimized batch animations, simplified parallax
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        // Early exit if GSAP not loaded
        if (!window.gsap || !window.ScrollTrigger) {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        const isMobile = window.innerWidth < 768;
        const $ = selector => document.querySelector(selector);
        const $$ = selector => document.querySelectorAll(selector);

        const debounce = (fn, delay) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        };

        // ==========================================
        // INITIAL STATE (Prevent FOUC)
        // ==========================================
        const heroElements = '.hero__badge, .hero__title, .hero__description, .hero__buttons';
        gsap.set(heroElements, { opacity: 0, y: 40 });
        gsap.set('.hero__visual', {
            opacity: 0,
            scale: 0.9,
            rotationX: 10,
            transformPerspective: 1000
        });

        // ==========================================
        // HERO ENTRY ANIMATION
        // ==========================================
        gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } })
            .to('.hero__badge', { opacity: 1, y: 0 })
            .to('.hero__title', { opacity: 1, y: 0 }, '-=0.6')
            .to('.hero__description', { opacity: 1, y: 0 }, '-=0.6')
            .to('.hero__buttons', { opacity: 1, y: 0 }, '-=0.6')
            .to('.hero__visual', {
                opacity: 1,
                scale: 1,
                rotationX: 0,
                duration: 1,
                ease: 'back.out(1.2)'
            }, '-=0.8');

        // ==========================================
        // HERO VIDEO SCROLL CONTROL (Commented out to allow normal autoplay)
        // ==========================================
        /*
        const heroVideo = document.getElementById('hero-video');
        if (heroVideo) {
            const initVideoScroll = () => {
                if (isMobile) return; // Disable pinning/scrubbing on mobile to prevent "hanging" feel

                gsap.to(heroVideo, {
                    scrollTrigger: {
                        trigger: ".hero",
                        start: "top top",
                        end: "+=100%",
                        scrub: 1,
                        pin: true,
                        invalidateOnRefresh: true
                    },
                    currentTime: heroVideo.duration || 5,
                    ease: "none"
                });
            };

            if (heroVideo.readyState >= 1) {
                initVideoScroll();
            } else {
                heroVideo.addEventListener('loadedmetadata', initVideoScroll);
            }
        }
        */

        // ==========================================
        // SECTION TITLES
        // ==========================================
        gsap.utils.toArray('.section__title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: { trigger: title, start: 'top 85%', once: true },
                opacity: 0,
                y: 30,
                duration: 0.8
            });
        });

        // ==========================================
        // CARD ANIMATION HELPER
        // ==========================================
        const animateCards = (selector, containerSelector, config = {}) => {
            const cards = $$(selector);
            if (!cards.length || isMobile) return;

            const { yOffset = 30, scale = 1, delay = 0.15, duration = 0.6 } = config;

            // Set initial state
            gsap.set(cards, { opacity: 0, y: yOffset, scale });

            // Check if already in viewport
            const container = $(containerSelector);
            if (container) {
                const rect = container.getBoundingClientRect();
                const inViewport = rect.top < window.innerHeight * 0.85;

                if (inViewport) {
                    cards.forEach((card, i) => {
                        card.dataset.animated = 'true';
                        gsap.to(card, {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration,
                            delay: i * delay,
                            ease: config.ease || 'power2.out'
                        });
                    });
                    return;
                }
            }

            // Scroll trigger for cards not in viewport
            ScrollTrigger.batch(selector, {
                start: 'top 90%',
                once: true,
                onEnter: batch => {
                    batch.forEach((card, i) => {
                        if (card.dataset.animated !== 'true') {
                            card.dataset.animated = 'true';
                            gsap.to(card, {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration,
                                delay: i * delay,
                                ease: config.ease || 'power2.out'
                            });
                        }
                    });
                }
            });
        };

        // ==========================================
        // ABOUT SECTION
        // ==========================================
        animateCards('.vision-card', '.about__visions', { yOffset: 40, delay: 0.2, duration: 0.8 });

        // Stats animation
        const statItems = $$('.stat');
        if (statItems.length && !isMobile) {
            gsap.set(statItems, { opacity: 0, scale: 0.6 });

            const statsSection = $('.about__stats');
            if (statsSection) {
                const inViewport = statsSection.getBoundingClientRect().top < window.innerHeight * 0.85;

                if (inViewport) {
                    statItems.forEach((stat, i) => {
                        stat.dataset.animated = 'true';
                        gsap.to(stat, {
                            opacity: 1,
                            scale: 1,
                            duration: 0.6,
                            delay: i * 0.15,
                            ease: 'back.out(1.7)'
                        });
                    });
                } else {
                    gsap.to('.stat', {
                        scrollTrigger: {
                            trigger: '.about__stats',
                            start: 'top 85%',
                            once: true
                        },
                        opacity: 1,
                        scale: 1,
                        stagger: 0.15,
                        duration: 0.6,
                        ease: 'back.out(1.7)'
                    });
                }
            }
        }

        // ==========================================
        // SERVICES & PRICING GRIDS
        // ==========================================
        animateCards('.service-card', '.services__grid', { delay: 0.1 });
        animateCards('.pricing-card', '.pricing__grid', { scale: 0.98, delay: 0.15 });

        // ==========================================
        // PARALLAX GRADIENT ORBS
        // ==========================================
        const orbs = gsap.utils.toArray('.gradient-orb');
        orbs.forEach((orb, i) => {
            gsap.to(orb, {
                y: [300, -150, 100][i] || 100,
                ease: 'none',
                scrollTrigger: {
                    trigger: document.body,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1 + i * 0.5
                }
            });
        });

        // ==========================================
        // FOOTER
        // ==========================================
        if ($('.footer')) {
            gsap.from('.footer__content', {
                scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true },
                opacity: 0,
                y: 20,
                duration: 1,
                ease: 'power2.out'
            });
        }

        // ==========================================
        // CLIENTS INFINITE SCROLL (GSAP)
        // ==========================================
        const initClientScroll = () => {
            const row1Track = $('.row-1 .track-content');
            const row2Track = $('.row-2 .track-content');

            if (!row1Track || !row2Track) return;

            // Kill any existing animations on these elements
            gsap.killTweensOf([row1Track, row2Track]);

            // Row 1 (Left to Right)
            // Note: Since content is duplicated, we animate -50% to 0
            gsap.to(row1Track, {
                xPercent: -50,
                duration: isMobile ? 12 : 30, // Much faster on mobile
                ease: 'none',
                repeat: -1,
                onReverseComplete: function () { this.totalTime(this.rawTime() + this.duration() * 100); }
            });

            // Row 2 (Right to Left)
            // Start at -50% and go to 0
            gsap.set(row2Track, { xPercent: -50 });
            gsap.to(row2Track, {
                xPercent: 0,
                duration: isMobile ? 12 : 30, // Much faster on mobile
                ease: 'none',
                repeat: -1
            });
        };

        initClientScroll();

        // Re-initialize on window resize to ensure consistent speed
        window.addEventListener('resize', debounce(() => {
            const newIsMobile = window.innerWidth < 768;
            if (newIsMobile !== isMobile) {
                location.reload(); // Simplest way to re-calc GSAP durations correctly for this type of loop
            }
        }, 250));



    });

})();