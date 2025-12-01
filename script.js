function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}

function initProjectSliders() {
  const sliders = document.querySelectorAll('.project-slider');
  
  sliders.forEach(slider => {
    const slides = slider.querySelector('.project-slides');
    const slideCount = slides ? slides.children.length : 0;
    if (!slides || slideCount === 0) return;

    let current = 0;
    const prevBtn = slider.querySelector('.proj-btn.prev');
    const nextBtn = slider.querySelector('.proj-btn.next');

    function update() {
      slides.style.transform = `translateX(-${current * 100}%)`;
    }

    // Click handlers
    if (prevBtn) prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      current = (current - 1 + slideCount) % slideCount;
      update();
    });

    if (nextBtn) nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      current = (current + 1) % slideCount;
      update();
    });

    // Touch swipe support
    let touchStartX = 0;
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, {passive: true});

    slider.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) current = Math.min(current + 1, slideCount - 1);
        else current = Math.max(current - 1, 0);
        update();
      }
    });

    // Mouse drag support
    let isDragging = false;
    let dragStartX = 0;
    let dragDelta = 0;

    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartX = e.clientX;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      dragDelta = e.clientX - dragStartX;
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      if (Math.abs(dragDelta) > 50) {
        if (dragDelta < 0) current = Math.min(current + 1, slideCount - 1);
        else current = Math.max(current - 1, 0);
        update();
      }
      dragDelta = 0;
    });

    // Keyboard navigation
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        current = (current + 1) % slideCount;
        update();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        current = (current - 1 + slideCount) % slideCount;
        update();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProjectSliders();
});
