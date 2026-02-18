import '../../style.css';
import { initMain } from '../main.js';
import { initReviewsCarousel } from '../reviews.js';
import { initScrollProgress, initParallaxHero } from '../shared-effects.js';

function initReviewForm() {
    const stars = document.querySelectorAll('.review-form__star');
    const ratingInput = document.getElementById('reviewRating');
    const form = document.getElementById('reviewForm');
    const successMsg = document.getElementById('reviewSuccess');

    if (!stars.length || !form) return;

    // Star rating interaction
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            if (ratingInput) ratingInput.value = rating;

            stars.forEach(s => {
                const r = parseInt(s.dataset.rating);
                s.classList.toggle('active', r <= rating);
            });
        });

        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            stars.forEach(s => {
                const r = parseInt(s.dataset.rating);
                s.classList.toggle('active', r <= rating);
            });
        });
    });

    // Restore rating on mouse leave
    const starsContainer = document.getElementById('ratingStars');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', () => {
            const currentRating = parseInt(ratingInput?.value || '5');
            stars.forEach(s => {
                const r = parseInt(s.dataset.rating);
                s.classList.toggle('active', r <= currentRating);
            });
        });
    }

    // Photo upload
    const dropzone = document.getElementById('photoDropzone');
    const fileInput = document.getElementById('reviewPhotos');
    const previewsContainer = document.getElementById('photoPreviews');
    let selectedFiles = [];

    if (dropzone && fileInput && previewsContainer) {
        // Drag-and-drop visual
        ['dragenter', 'dragover'].forEach(evt => {
            dropzone.addEventListener(evt, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            dropzone.addEventListener(evt, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            });
        });

        // Handle dropped files
        dropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            addFiles(files);
        });

        // Handle file input change
        fileInput.addEventListener('change', () => {
            const files = Array.from(fileInput.files);
            addFiles(files);
            fileInput.value = ''; // Reset so same file can be selected again
        });

        function addFiles(files) {
            const remaining = 5 - selectedFiles.length;
            const toAdd = files.slice(0, remaining);

            toAdd.forEach(file => {
                selectedFiles.push(file);
                createPreview(file, selectedFiles.length - 1);
            });
        }

        function createPreview(file, index) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'review-form__preview';
                div.dataset.index = index;
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" />
                    <button type="button" class="review-form__preview-remove" title="Удалить">×</button>
                `;

                div.querySelector('.review-form__preview-remove').addEventListener('click', () => {
                    selectedFiles[index] = null;
                    div.remove();
                });

                previewsContainer.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Show success message
        if (successMsg) {
            successMsg.style.display = 'flex';
            // Re-init lucide icons for the success checkmark
            if (window.lucide) lucide.createIcons();
        }

        // Reset form
        form.reset();
        if (ratingInput) ratingInput.value = '5';
        stars.forEach(s => s.classList.add('active'));
        selectedFiles = [];
        if (previewsContainer) previewsContainer.innerHTML = '';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMain();
    initScrollProgress();
    initParallaxHero();
    initReviewsCarousel();
    initReviewForm();
});
