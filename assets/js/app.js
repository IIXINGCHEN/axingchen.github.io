// app.js
import { MESSAGES } from './config.js';
import * as Utils from './utils.js';
import { DownloadManager } from './downloadManager.js';

class GitHubDownloaderApp {
    constructor() {
        this.elements = {
            downloadForm: document.getElementById('downloadForm'),
            urlInput: document.getElementById('urlInput'),
            loader: document.getElementById('loader'),
            errorMessage: document.getElementById('errorMessage'),
            downloadButton: document.getElementById('submitButton'),
            progressBar: document.getElementById('progressBar'),
            downloadCountDisplay: document.getElementById('downloadCountDisplay')
        };

        this.downloadManager = new DownloadManager(this.elements);
        this.initializeEventListeners();
        this.initializeDownloadCount();
        Utils.addAccessibility(this.elements);
    }

    initializeEventListeners() {
        if (this.elements.downloadForm) {
            this.elements.downloadForm.addEventListener('submit', this.handleSubmit.bind(this));
        }

        if (this.elements.downloadButton) {
            this.elements.downloadButton.addEventListener('click', this.handleSubmit.bind(this));
        }

        window.addEventListener('error', this.handleGlobalError.bind(this));
    }

    handleSubmit(event) {
        event.preventDefault();
        const url = this.elements.urlInput.value.trim();

        if (!url) {
            this.downloadManager.showError(MESSAGES.ERROR_EMPTY_URL);
            return;
        }

        if (!Utils.isValidUrl(url)) {
            this.downloadManager.showError(MESSAGES.ERROR_INVALID_URL);
            return;
        }

        this.downloadManager.handleDownloadRequest(url);
    }

    handleGlobalError(event) {
        console.error('Global error:', event.error);
        this.downloadManager.showError(MESSAGES.ERROR_UNKNOWN);
    }

    initializeDownloadCount() {
        if (this.elements.downloadCountDisplay) {
            Utils.setElementText(this.elements.downloadCountDisplay, `${MESSAGES.INFO_TOTAL_DOWNLOADS}${this.downloadManager.downloadCount}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GitHubDownloaderApp();
});