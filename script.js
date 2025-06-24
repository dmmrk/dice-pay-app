// --- ТЕСТОВЫЙ СКРИПТ С РАСШИРЕННЫМ ЛОГИРОВАНИЕМ ---

// --- НАСТРОЙКИ ---
const RECIPIENT_WALLET_FOR_TEST = 'UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6';
const MANIFEST_URL = 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json'; 

// --- ИНИЦИАЛИЗАЦИЯ ---
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
console.log("WebApp инициализировано. UserID:", urlParams.get('user_id'));

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');

if (!userId) {
    tg.showAlert('Ошибка: ID пользователя не найден.');
    throw new Error("User ID is not provided in URL");
}

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: MANIFEST_URL,
    buttonRootId: 'ton-connect-button'
});

// --- ЭЛЕМЕНТЫ DOM И ЛОГИКА ---
const paymentSection = document.getElementById('payment-section');
const sendButton = document.getElementById('send-button');

tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        console.log("Кошелек подключен:", wallet.account.address);
        paymentSection.classList.remove('hidden');
    } else {
        console.log("Кошелек отключен.");
        paymentSection.classList.add('hidden');
    }
});

sendButton.addEventListener('click', async () => {
    const testTransaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [{
            address: RECIPIENT_WALLET_FOR_TEST,
            amount: '50000000' // 0.05 TON
        }]
    };

    console.log("1. Нажата кнопка 'Отправить'. Начинаем транзакцию с объектом:", testTransaction);

    try {
        tg.MainButton.setText('Ожидаем подтверждения...').show().showProgress();

        // ШАГ А: Отправка транзакции в сеть
        const result = await tonConnectUI.sendTransaction(testTransaction);
        
        // Если мы дошли сюда, значит транзакция была подписана и отправлена УСПЕШНО
        console.log("2. Транзакция УСПЕШНО отправлена в сеть. Получен результат (BOC):", result.boc);

        const dataToSend = { boc: result.boc };
        console.log("3. Подготовлены данные для отправки боту:", dataToSend);
        
        // ШАГ Б: Отправка данных боту
        try {
            tg.sendData(JSON.stringify(dataToSend));
            // Если мы дошли сюда, вызов sendData прошел без JS-ошибок
            console.log("4. Вызвана функция tg.sendData(). Ошибок на стороне WebApp нет.");
            tg.showAlert('Данные отправлены боту для проверки.');

        } catch (e) {
            console.error("5. КРИТИЧЕСКАЯ ОШИБКА! tg.sendData() вызвал исключение:", e);
            tg.showAlert('Произошла ошибка при отправке данных боту.');
        }
        
        tg.MainButton.hideProgress();
        setTimeout(() => tg.close(), 4000);

    } catch (error) {
        console.error('Ошибка на шаге отправки транзакции (sendTransaction):', error);
        tg.MainButton.hideProgress();
        tg.showAlert(`Произошла ошибка при подписании транзакции: ${error.message || 'Транзакция была отклонена.'}`);
    }
});
