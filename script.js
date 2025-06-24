// Строку "import { TonConnectUI }..." мы УДАЛИЛИ. Библиотека теперь доступна глобально.

// --- ВАЖНЫЕ НАСТРОЙКИ ---
// ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ НА СВОИ!
const RECIPIENT_WALLET = 'UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6'; 
const MANIFEST_URL = 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json'; 

// --- ИНИЦИАЛИЗАЦИЯ ---
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Получаем user_id из URL, который передал бот (?user_id=12345)
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');

// Если ID пользователя не передан, показываем ошибку.
if (!userId) {
    tg.showAlert('Ошибка: ID пользователя не найден. Пожалуйста, запустите приложение снова из Telegram-бота.');
    tg.close();
    throw new Error("User ID is not provided in URL");
}

// ИНИЦИАЛИЗАЦИЯ TON CONNECT UI (используем глобальный объект TON_CONNECT_UI)
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: MANIFEST_URL,
    buttonRootId: 'ton-connect-button' // ID элемента, куда вставится кнопка "Connect Wallet"
});

// --- ЭЛЕМЕНТЫ DOM ---
const amountInput = document.getElementById('ton-amount-input');
const sendButton = document.getElementById('send-button');
const walletInfoEl = document.getElementById('wallet-info');
const walletAddressEl = document.getElementById('wallet-address');
const paymentSection = document.getElementById('payment-section');

// --- ЛОГИКА ---

// Отслеживаем статус подключения кошелька
tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        // Кошелек подключен
        const address = wallet.account.address;
        walletAddressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        
        // Показываем информацию о кошельке и секцию для оплаты
        walletInfoEl.classList.remove('hidden');
        paymentSection.classList.remove('hidden');
    } else {
        // Кошелек отключен
        walletInfoEl.classList.add('hidden');
        paymentSection.classList.add('hidden');
    }
});

// Обработчик нажатия на кнопку "Отправить"
sendButton.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0.01) {
        tg.showAlert('Пожалуйста, введите корректную сумму (минимум 0.01 TON).');
        return;
    }

    const amountInNanoTON = Math.round(amount * 1_000_000_000).toString();
    const comment = `dep_${userId}`;

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 минут
        messages: [{
            address: RECIPIENT_WALLET,
            amount: amountInNanoTON,
            payload: btoa(comment) // btoa() кодирует строку в base64
        }]
    };

    try {
        tg.MainButton.setText('Ожидаем подтверждения в кошельке...').show().showProgress();
        const result = await tonConnectUI.sendTransaction(transaction);
        tg.sendData(JSON.stringify({ boc: result.boc }));
        tg.MainButton.setText('Готово!').hideProgress();
        tg.showAlert('Транзакция отправлена! Бот пришлет уведомление о зачислении.');
        setTimeout(() => tg.close(), 3000);
    } catch (error) {
        tg.MainButton.hideProgress();
        console.error('Ошибка отправки транзакции:', error);
        tg.showAlert(`Произошла ошибка: ${error.message || 'Транзакция была отклонена.'}`);
    }
});
