document.getElementById('downloadForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const urlInput = document.getElementById('urlInput');
    const submitButton = document.getElementById('submitButton');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('errorMessage');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');

    const userInputUrl = urlInput.value.trim();

    if (!isValidUrl(userInputUrl)) {
        errorMessage.textContent = '请输入有效的GitHub文件链接';
        errorMessage.classList.remove('hidden');
        return;
    }

    errorMessage.classList.add('hidden');
    loader.classList.remove('hidden');
    progressBarContainer.classList.remove('hidden');
    submitButton.disabled = true;

    const baseUrl = location.href.substr(0, location.href.lastIndexOf('/') + 1);
    const targetUrl = baseUrl + userInputUrl;

    downloadFile(targetUrl, loader, errorMessage, progressBarContainer, progressBar, submitButton);
});

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

function downloadFile(url, loader, errorMessage, progressBarContainer, progressBar, submitButton) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';

    xhr.addEventListener('loadstart', () => {
        progressBar.style.width = '0%';
    });

    xhr.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.style.width = percentComplete + '%';
            progressBar.textContent = percentComplete.toFixed(2) + '%';
        }
    });

    xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
            loader.classList.add('hidden');
            progressBarContainer.classList.add('hidden');
            submitButton.disabled = false;

            const blob = new Blob([xhr.response], { type: 'application/octet-stream' });
            const downloadUrl = URL.createObjectURL(blob);
            window.open(downloadUrl, '_blank');
        } else {
            handleError(`下载失败，状态码: ${xhr.status}`, loader, errorMessage, progressBarContainer, submitButton);
        }
    });

    xhr.addEventListener('error', () => {
        handleError('下载失败，网络错误', loader, errorMessage, progressBarContainer, submitButton);
    });

    xhr.addEventListener('abort', () => {
        handleError('下载已取消', loader, errorMessage, progressBarContainer, submitButton);
    });

    xhr.send();
}

function handleError(message, loader, errorMessage, progressBarContainer, submitButton) {
    loader.classList.add('hidden');
    progressBarContainer.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    submitButton.disabled = false;
}
