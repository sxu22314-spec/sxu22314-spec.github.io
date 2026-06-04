$(document).ready(function(){
	"use strict";
    
        /*==================================
* Author        : "ThemeSine"
* Template Name : Khanas HTML Template
* Version       : 1.0
==================================== */



/*=========== TABLE OF CONTENTS ===========
1. Scroll To Top 
2. Smooth Scroll spy
3. Progress-bar
4. owl carousel
5. welcome animation support
======================================*/

    // 1. Scroll To Top + Navbar glassmorphism
		$(window).on('scroll',function () {
			var st = $(this).scrollTop();

			/* return-to-top */
			if (st > 600) {
				$('.return-to-top').fadeIn();
			} else {
				$('.return-to-top').fadeOut();
			}

			/* navbar pill + glassmorphism */
			if (st > 50) {
				$('nav.navbar.bootsnav').addClass('navbar-scrolled');
			} else {
				$('nav.navbar.bootsnav').removeClass('navbar-scrolled');
			}
		});
		$('.return-to-top').on('click',function(){
				$('html, body').animate({
				scrollTop: 0
			}, 1500);
			return false;
		});
	
	
	
	// 2. Smooth Scroll spy
		
		$('.header-area').sticky({
           topSpacing:0
        });
		
		//=============

		$('li.smooth-menu a').bind("click", function(event) {
			event.preventDefault();
			var anchor = $(this);
			$('html, body').stop().animate({
				scrollTop: $(anchor.attr('href')).offset().top - 0
			}, 1200,'easeInOutExpo');
		});
		
		$('body').scrollspy({
			target:'.navbar-collapse',
			offset:0
		});

	// 3. Progress-bar
	
		var dataToggleTooTip = $('[data-toggle="tooltip"]');
		var progressBar = $(".progress-bar");
		if (progressBar.length) {
			progressBar.appear(function () {
				dataToggleTooTip.tooltip({
					trigger: 'manual'
				}).tooltip('show');
				progressBar.each(function () {
					var each_bar_width = $(this).attr('aria-valuenow');
					$(this).width(each_bar_width + '%');
				});
			});
		}
	
	// 4. owl carousel
	
		// i. client (carousel)
		
			$('#client').owlCarousel({
				items:7,
				loop:true,
				smartSpeed: 1000,
				autoplay:true,
				dots:false,
				autoplayHoverPause:true,
				responsive:{
						0:{
							items:2
						},
						415:{
							items:2
						},
						600:{
							items:4

						},
						1199:{
							items:4
						},
						1200:{
							items:7
						}
					}
				});
				
				
				$('.play').on('click',function(){
					owl.trigger('play.owl.autoplay',[1000])
				})
				$('.stop').on('click',function(){
					owl.trigger('stop.owl.autoplay')
				})


    // 5. welcome animation support

        $(window).load(function(){
        	$(".header-text h2,.header-text p").removeClass("animated fadeInUp").css({'opacity':'0'});
            $(".header-text a").removeClass("animated fadeInDown").css({'opacity':'0'});
        });

        $(window).load(function(){
        	$(".header-text h2,.header-text p").addClass("animated fadeInUp").css({'opacity':'0'});
            $(".header-text a").addClass("animated fadeInDown").css({'opacity':'0'});
        });

	// 6. Meteor Shower Engine (Layer 1 — Canvas)
	(function initMeteorShower() {
		var canvas = document.querySelector('.hero-canvas');
		if (!canvas) return;

		var ctx = canvas.getContext('2d');
		var stars = [];
		var meteors = [];
		var animId;
		var lastTs = 0;
		var meteorTimer = 0;
		var nextMeteorDelay = randBetween(600, 1800);

		/* ---------- helpers ---------- */
		function randBetween(min, max) {
			return Math.random() * (max - min) + min;
		}

		function resize() {
			var rect = canvas.parentNode.getBoundingClientRect();
			canvas.width  = rect.width;
			canvas.height = rect.height;
		}

		/* ---------- static star field ---------- */
		function createStars() {
			if (canvas.width === 0 || canvas.height === 0) return;
			stars = [];
			for (var i = 0; i < 60; i++) {
				stars.push({
					x: Math.random() * canvas.width,
					y: Math.random() * canvas.height,
					r: Math.random() * 0.8 + 0.7,
					base: randBetween(0.50, 0.80),
					twinkleSpeed: randBetween(0.002, 0.008),
					phase: Math.random() * Math.PI * 2
				});
			}
		}

		/* ---------- meteor spawn ---------- */
		function spawnMeteor() {
			if (meteors.length >= 8) return;

			/* angle 45°–60° from horizontal → π×0.25 ~ π×0.333 */
			var angle = randBetween(Math.PI * 0.25, Math.PI * 0.333);
			var speed = randBetween(3, 7);
			var len   = randBetween(100, 240);

			meteors.push({
				x: randBetween(canvas.width * 0.5, canvas.width),
				y: randBetween(0, canvas.height * 0.25),
				vx: -Math.cos(angle) * speed,
				vy:  Math.sin(angle) * speed,
				spd: speed,
				length: len,
				headOpacity: randBetween(0.25, 0.55),
				life: 1,
				decay: randBetween(0.004, 0.010)
			});
		}

		/* ---------- draw calls ---------- */
		function drawStars(ts) {
			for (var i = 0; i < stars.length; i++) {
				var s = stars[i];
				var twinkle = 0.7 + 0.3 * Math.sin(ts * s.twinkleSpeed + s.phase);
				var alpha = s.base * twinkle;
				ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
				ctx.beginPath();
				ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		function drawMeteors() {
			for (var i = meteors.length - 1; i >= 0; i--) {
				var m = meteors[i];

				m.x += m.vx;
				m.y += m.vy;
				m.life -= m.decay;

				if (m.life <= 0) {
					meteors.splice(i, 1);
					continue;
				}

				/* tail: normalize direction, then scale to m.length pixels */
				var tailX = m.x - (m.vx / m.spd) * m.length;
				var tailY = m.y - (m.vy / m.spd) * m.length;

				var grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
				grad.addColorStop(0, 'rgba(255,255,255,' + (m.headOpacity * m.life).toFixed(3) + ')');
				grad.addColorStop(1, 'rgba(255,255,255,0)');

				ctx.strokeStyle = grad;
				ctx.lineWidth = 1.5;
				ctx.beginPath();
				ctx.moveTo(m.x, m.y);
				ctx.lineTo(tailX, tailY);
				ctx.stroke();

				/* bright head pixel */
				ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, m.headOpacity * m.life + 0.15).toFixed(3) + ')';
				ctx.beginPath();
				ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		/* ---------- animation loop ---------- */
		function animate(ts) {
			/* use real delta, guard first frame */
			var dt = lastTs ? ts - lastTs : 16.67;
			lastTs = ts;

			if (canvas.width === 0 || canvas.height === 0) {
				resize();
			}

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			if (stars.length === 0) createStars();
			/* retry next frame if dimensions still missing */
			if (stars.length === 0) {
				animId = requestAnimationFrame(animate);
				return;
			}

			drawStars(ts);
			drawMeteors();

			meteorTimer += dt;
			if (meteorTimer >= nextMeteorDelay) {
				meteorTimer = 0;
				nextMeteorDelay = randBetween(400, 1200);
				spawnMeteor();
			}

			animId = requestAnimationFrame(animate);
		}

		/* ---------- boot ---------- */
		resize();
		window.addEventListener('resize', function () {
			resize();
			createStars();
		});
		lastTs = 0;
		animId = requestAnimationFrame(animate);
	})();

});
	