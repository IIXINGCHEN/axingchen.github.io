// utils.js
import { CONFIG, MESSAGES } from './config.js'; // 导入配置和消息常量

// 防抖函数
export function debounce(func, delayMs) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId); // 清除之前的计时器
        timeoutId = setTimeout(() => func.apply(this, args), delayMs); // 设置新的计时器
    };
}

// 验证URL是否有效
export function isValidUrl(url) {
    if (!CONFIG || !CONFIG.VALID_URL_REGEX) {
        throw new Error('CONFIG or CONFIG.VALID_URL_REGEX is not defined'); // 抛出错误，如果配置未定义
    }
    return CONFIG.VALID_URL_REGEX.test(url); // 使用正则表达式验证URL
}

// 从URL中提取文件名
export function getFilenameFromUrl(url) {
    const parts = url.split('/'); // 分割URL
    const lastPart = parts[parts.length - 1]; // 获取最后一个部分
    return decodeURIComponent(lastPart); // 解码并返回文件名
}

// 显示元素
export function showElement(element) {
    if (element && element.classList) {
        element.classList.remove('hidden'); // 移除隐藏类
    }
}

// 隐藏元素
export function hideElement(element) {
    if (element && element.classList) {
        element.classList.add('hidden'); // 添加隐藏类
    }
}

// 设置元素文本内容
export function setElementText(element, text) {
    if (element) {
        element.textContent = text; // 设置文本内容
    }
}

// 创建下载链接
export function createDownloadLink(blob, fileName) {
    const url = URL.createObjectURL(blob); // 创建对象URL
    const a = document.createElement('a'); // 创建a元素
    a.href = url; // 设置href属性
    a.download = fileName; // 设置下载文件名
    a.style.display = 'none'; // 隐藏a元素
    document.body.appendChild(a); // 将a元素添加到DOM中
    a.click(); // 触发点击事件
    document.body.removeChild(a); // 下载完成后移除a元素
    return { element: a, url }; // 返回a元素和URL
}

// 撤销对象URL
export function revokeObjectUrl(url) {
    URL.revokeObjectURL(url); // 撤销对象URL
}

// 添加无障碍属性
export function addAccessibility(elements) {
    const interactiveElements = document.querySelectorAll('button, a, input, select'); // 获取所有交互元素
    interactiveElements.forEach(element => {
        if (!element.getAttribute('aria-label')) {
            element.setAttribute('aria-label', element.textContent || element.value); // 设置aria-label属性
        }
    });

    if (elements.progressBar && elements.progressBar instanceof HTMLElement) {
        elements.progressBar.setAttribute('role', 'progressbar'); // 设置role属性
        elements.progressBar.setAttribute('aria-valuemin', '0'); // 设置最小值
        elements.progressBar.setAttribute('aria-valuemax', '100'); // 设置最大值
    }
}

// 显示通知
export function showNotification(message, type) {
    const notification = document.createElement('div'); // 创建通知元素
    notification.textContent = message; // 设置通知内容
    notification.classList.add('notification', type); // 添加样式类
    document.body.appendChild(notification); // 将通知元素添加到DOM中
    setTimeout(() => {
        document.body.removeChild(notification); // 移除通知元素
    }, 3000); // 3秒后移除通知
}

// 记录错误信息
export function logError(error, url, retryCount) {
    console.error(`Download error for URL: ${url}`); // 记录错误URL
    console.error(`Error message: ${error.message}`); // 记录错误消息
    console.error(`Retry count: ${retryCount}`); // 记录重试次数
    // 可以根据需要将错误信息发送到服务器或日志系统
}