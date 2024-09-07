document.getElementById('downloadForm').addEventListener('submit', async function (event) {
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

    try {
        const response = await fetch(`/proxy?gh_url=${encodeURIComponent(userInputUrl)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        });

        if (!response.ok) {
            throw new Error(`下载失败，状态码: ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        loader.classList.add('hidden');
        progressBarContainer.classList.add('hidden');
        submitButton.disabled = false;
    } catch (error) {
        displayErrorMessage(error.message, loader, errorMessage, progressBarContainer, submitButton);
    }
});

function isValidGitHubUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === 'github.com' || parsedUrl.hostname === 'raw.githubusercontent.com';
    } catch (e) {
        return false;
    }
}

function displayErrorMessage(message, loader, errorMessage, progressBarContainer, submitButton) {
    loader.classList.add('hidden');
    progressBarContainer.classList.add('hidden');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    submitButton.disabled = false;
}
