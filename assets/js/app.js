// app.js
import { MESSAGES } from './config.js'; // 导入配置文件中的消息常量
import * as Utils from './utils.js'; // 导入工具函数
import { DownloadManager } from './downloadManager.js'; // 导入下载管理器

class GitHubDownloaderApp {
    constructor() {
        // 初始化页面元素
        this.elements = {
            downloadForm: document.getElementById('downloadForm'), // 下载表单
            urlInput: document.getElementById('urlInput'), // URL 输入框
            loader: document.getElementById('loader'), // 加载器
            errorMessage: document.getElementById('errorMessage'), // 错误信息显示区域
            downloadButton: document.getElementById('submitButton'), // 下载按钮
            progressBar: document.getElementById('progressBar'), // 进度条
            downloadCountDisplay: document.getElementById('downloadCountDisplay') // 下载次数显示区域
        };

        // 确保所有元素都存在后再初始化 downloadManager
        if (this.elements.downloadForm && this.elements.urlInput && this.elements.loader && this.elements.errorMessage && this.elements.downloadButton && this.elements.progressBar && this.elements.downloadCountDisplay) {
            this.downloadManager = new DownloadManager(this.elements); // 初始化下载管理器
            this.initializeEventListeners(); // 初始化事件监听器
            this.initializeDownloadCount(); // 初始化下载次数显示
            Utils.addAccessibility(this.elements); // 添加无障碍功能
        } else {
            console.error('Some elements are missing. Unable to initialize GitHubDownloaderApp.'); // 元素缺失，无法初始化
        }
    }

    initializeEventListeners() {
        // 确保 handleSubmit 方法在类实例化时正确绑定
        this.handleSubmit = this.handleSubmit.bind(this);

        if (this.elements.downloadForm) {
            this.elements.downloadForm.addEventListener('submit', this.handleSubmit); // 监听表单提交事件
        }

        if (this.elements.downloadButton) {
            this.elements.downloadButton.addEventListener('click', this.handleSubmit); // 监听下载按钮点击事件
        }

        window.addEventListener('error', this.handleGlobalError); // 监听全局错误事件
    }

    handleSubmit = async (event) => {
        event.preventDefault(); // 阻止表单默认提交行为
        const url = this.elements.urlInput.value.trim(); // 获取输入框中的 URL 并去除前后空格

        if (!url) {
            // 如果 URL 为空，显示错误信息
            this.downloadManager.showError(MESSAGES.ERROR_EMPTY_URL);
            return;
        }

        if (!Utils.isValidUrl(url)) {
            // 如果 URL 无效，显示错误信息
            this.downloadManager.showError(MESSAGES.ERROR_INVALID_URL);
            return;
        }

        try {
            // 尝试处理下载请求
            await this.downloadManager.handleDownloadRequest(url);
        } catch (error) {
            // 捕获并处理错误
            if (error.name === 'AbortError') {
                console.warn('Download aborted'); // 下载被中止
            } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                console.error('Fetch failed:', error); // 捕获并记录 fetch 失败错误
                this.downloadManager.showError(MESSAGES.ERROR_FETCH_FAILED); // 显示 fetch 失败错误信息
                // 重试机制示例
                try {
                    await this.downloadManager.handleDownloadRequest(url); // 尝试重试下载请求
                } catch (retryError) {
                    console.error('Retry failed:', retryError); // 捕获并记录重试失败错误
                    this.downloadManager.showError(MESSAGES.ERROR_RETRY_FAILED); // 显示重试失败错误信息
                }
            } else {
                console.error('Download error:', error); // 捕获并记录其他下载错误
                this.downloadManager.showError(MESSAGES.ERROR_UNKNOWN); // 显示未知错误信息
            }
        }
    }

    handleGlobalError = (event) => {
        const error = event.error || new Error('Unknown error'); // 获取全局错误
        console.error('Global error:', error); // 记录全局错误
        this.downloadManager.showError(MESSAGES.ERROR_UNKNOWN); // 显示未知错误信息
    }

    initializeDownloadCount() {
        if (this.elements.downloadCountDisplay) {
            // 初始化下载次数显示
            Utils.setElementText(this.elements.downloadCountDisplay, `${MESSAGES.INFO_TOTAL_DOWNLOADS}${this.downloadManager.downloadCount}`);
        }
    }
}

// 页面加载完成后初始化 GitHubDownloaderApp
document.addEventListener('DOMContentLoaded', () => {
    new GitHubDownloaderApp();
});
