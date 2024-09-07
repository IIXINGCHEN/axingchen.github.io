document.getElementById('downloadForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const urlInput = document.getElementsByName('gh_url')[0];
    const submitButton = document.querySelector('.btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('errorMessage');
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');

    const userInputUrl = urlInput.value.trim();

    if (!isValidGitHubUrl(userInputUrl)) {
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

    downloadGitHubFile(targetUrl, loader, errorMessage, progressBarContainer, progressBar, submitButton);
});

function isValidGitHubUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === 'github.com' || parsedUrl.hostname === 'raw.githubusercontent.com';
    } catch (e) {
        return false;
    }
}

function downloadGitHubFile(url, loader, errorMessage, progressBarContainer, progressBar, submitButton) {
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
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
        } else if (xhr.status === 404) {
            displayErrorMessage('文件未找到，请检查链接是否正确', loader, errorMessage, progressBarContainer, submitButton);
        } else {
            displayErrorMessage(`下载失败，状态码: ${xhr.status}`, loader, errorMessage, progressBarContainer, submitButton);
        }
    });

    xhr.addEventListener('error', () => {
        displayErrorMessage('下载失败，网络错误', loader, errorMessage, progressBarContainer, submitButton);
    });

    xhr.addEventListener('abort', () => {
        displayErrorMessage('下载已取消', loader, errorMessage, progressBarContainer, submitButton);
    });

    xhr.send();
}

function displayErrorMessage(message, loader, errorMessage, progressBarContainer, submitButton) {
    loader.classList.add('hidden');
    progressBarContainer.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    submitButton.disabled = false;
}
