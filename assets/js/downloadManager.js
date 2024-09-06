// downloadManager.js
import { CONFIG, MESSAGES } from './config.js'; // 导入配置和消息常量
import * as Utils from './utils.js'; // 导入工具函数

export class DownloadManager {
    constructor(elements) {
        this.elements = elements; // 初始化DOM元素
        this.downloadCount = parseInt(localStorage.getItem('downloadCount')) || 0; // 从localStorage获取下载次数，默认为0
        this.downloadTimeout = null; // 初始化下载超时计时器
    }

    // 处理下载请求的方法
    async handleDownloadRequest(url) {
        this.showLoader(); // 显示加载器
        this.hideError(); // 隐藏错误信息
        this.resetProgressBar(); // 重置进度条

        let retryCount = 0; // 初始化重试次数
        const attemptDownload = async () => {
            if (this.downloadTimeout) {
                clearTimeout(this.downloadTimeout); // 清除之前的超时计时器
            }

            // 设置新的超时计时器
            this.downloadTimeout = setTimeout(() => {
                this.hideLoader(); // 隐藏加载器
                if (retryCount < CONFIG.MAX_RETRIES) { // 如果重试次数小于最大重试次数
                    retryCount++; // 增加重试次数
                    attemptDownload(); // 重新尝试下载
                } else {
                    this.showError(MESSAGES.ERROR_DOWNLOAD_TIMEOUT); // 显示下载超时错误
                }
            }, CONFIG.DOWNLOAD_TIMEOUT_MS); // 超时时间

            try {
                const response = await fetch(url, { method: 'GET' }); // 发起GET请求

                if (!response.ok) { // 如果响应状态不是2xx
                    console.error(`Download failed with status: ${response.status}`); // 记录错误状态
                    throw new Error(`${MESSAGES.ERROR_NETWORK} (${response.status})`); // 抛出网络错误
                }

                const contentLength = parseInt(response.headers.get('Content-Length'), 10) || 0; // 获取文件大小

                if (contentLength > CONFIG.MAX_FILE_SIZE_BYTES) { // 如果文件大小超过最大限制
                    throw new Error(MESSAGES.ERROR_FILE_TOO_LARGE); // 抛出文件过大的错误
                }

                const blob = await this.streamResponse(response, contentLength); // 流式处理响应
                clearTimeout(this.downloadTimeout); // 清除超时计时器
                const fileName = Utils.getFilenameFromUrl(url); // 从URL获取文件名
                this.handleDownload({ blob, fileName }); // 处理下载
                this.updateDownloadCount(); // 更新下载次数
            } catch (error) {
                clearTimeout(this.downloadTimeout); // 清除超时计时器
                this.showError(error.message || MESSAGES.ERROR_DOWNLOAD_FAILED); // 显示错误信息
                console.error('Download error:', error); // 记录错误日志

                // 记录详细的错误信息
                this.logError(error, url, retryCount);
            } finally {
                this.hideLoader(); // 隐藏加载器
                this.resetProgressBar(); // 重置进度条
            }
        };

        await attemptDownload(); // 开始下载尝试
    }

    // 流式处理响应的方法
    async streamResponse(response, contentLength) {
        const reader = response.body.getReader(); // 获取响应体的读取器
        let receivedLength = 0; // 初始化已接收的长度
        const chunks = []; // 初始化数据块数组

        while (true) {
            const { done, value } = await reader.read(); // 读取数据块
            if (done) break; // 如果读取完成，退出循环
            chunks.push(value); // 将数据块添加到数组
            receivedLength += value.length; // 更新已接收的长度
            if (contentLength) {
                this.updateProgressBar(receivedLength, contentLength); // 更新进度条
            }
        }

        return new Blob(chunks); // 返回合并后的Blob对象
    }

    // 处理下载的方法
    handleDownload({ blob, fileName }) {
        const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/zip', 'application/x-tar', 'application/gzip', 'application/x-debian-package', 'application/x-apple-diskimage', 'application/x-rpm', 'application/x-msdos-program', 'text/x-shellscript']; // 有效的MIME类型
        if (!validMimeTypes.includes(blob.type)) { // 如果MIME类型无效
            Utils.showNotification(MESSAGES.ERROR_INVALID_FILE_TYPE, 'error'); // 显示文件类型错误通知
            return;
        }

        if (blob.size > CONFIG.MAX_FILE_SIZE_BYTES) { // 如果文件大小超过最大限制
            Utils.showNotification(MESSAGES.ERROR_FILE_TOO_LARGE, 'error'); // 显示文件过大错误通知
            return;
        }

        const { element, url } = Utils.createDownloadLink(blob, fileName); // 创建下载链接
        document.body.appendChild(element); // 将下载链接添加到文档
        element.click(); // 触发下载

        (async () => {
            await new Promise(resolve => setTimeout(resolve, 100)); // 等待100毫秒
            document.body.removeChild(element); // 移除下载链接
            Utils.revokeObjectUrl(url); // 撤销对象URL
            Utils.showNotification(MESSAGES.SUCCESS_DOWNLOAD_COMPLETE, 'success'); // 显示下载成功通知
        })();
    }

    // 显示加载器的方法
    showLoader() {
        Utils.showElement(this.elements.loader); // 显示加载器
        this.elements.downloadButton?.setAttribute('disabled', 'true'); // 禁用下载按钮
    }

    // 隐藏加载器的方法
    hideLoader() {
        Utils.hideElement(this.elements.loader); // 隐藏加载器
        this.elements.downloadButton?.removeAttribute('disabled'); // 启用下载按钮
    }

    // 显示错误信息的方法
    showError(message) {
        if (this.elements.errorMessage) {
            Utils.setElementText(this.elements.errorMessage, message || MESSAGES.ERROR_UNKNOWN); // 设置错误信息
            Utils.showElement(this.elements.errorMessage); // 显示错误信息
        }
    }

    // 隐藏错误信息的方法
    hideError() {
        Utils.hideElement(this.elements.errorMessage); // 隐藏错误信息
    }

    // 更新进度条的方法
    updateProgressBar(loaded, total) {
        if (this.elements.progressBar) {
            const progress = total ? (loaded / total) * 100 : 0; // 计算进度百分比
            this.elements.progressBar.style.width = `${progress}%`; // 设置进度条宽度
            Utils.setElementText(this.elements.progressBar, total ? `${Math.round(progress)}%` : MESSAGES.INFO_PREPARING_DOWNLOAD); // 设置进度条文本
            Utils.showElement(this.elements.progressBar); // 显示进度条
        }
    }

    // 重置进度条的方法
    resetProgressBar() {
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = '0%'; // 重置进度条宽度
            Utils.setElementText(this.elements.progressBar, ''); // 清除进度条文本
            Utils.hideElement(this.elements.progressBar); // 隐藏进度条
        }
    }

    // 更新下载次数的方法
    updateDownloadCount() {
        try {
            this.downloadCount++; // 增加下载次数
            localStorage.setItem('downloadCount', this.downloadCount.toString()); // 保存下载次数到localStorage
            if (this.elements.downloadCountDisplay) {
                Utils.setElementText(this.elements.downloadCountDisplay, `${MESSAGES.INFO_TOTAL_DOWNLOADS}${this.downloadCount}`); // 更新下载次数显示
            }
        } catch (e) {
            console.error('Failed to update download count:', e); // 记录更新失败日志
        }
    }

    // 记录错误信息的方法
    logError(error, url, retryCount) {
        // 记录详细的错误信息
        console.error(`Download error for URL: ${url}`); // 记录错误URL
        console.error(`Error message: ${error.message}`); // 记录错误消息
        console.error(`Retry count: ${retryCount}`); // 记录重试次数
        // 可以根据需要将错误信息发送到服务器或日志系统
    }
}
