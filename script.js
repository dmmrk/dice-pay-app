// --- ФИНАЛЬНАЯ ПУЛЕНЕПРОБИВАЕМАЯ ВЕРСИЯ ---

// --- НАСТРОЙКИ ---
// !!! ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ НА СВОИ !!!
const RECIPIENT_WALLET = 'UQD8UPzW61QlhcyWGq7GFI1u5mp-VNCLh4mgMq0cPY1Cn0c6'; // ВАШ MAINNET КОШЕЛЕК
const MANIFEST_URL = 'https://dmmrk.github.io/dice-pay-app/tonconnect-manifest.json'; // ВАША ССЫЛКА НА МАНИФЕСТ

// --- ИНИЦИАЛИЗАЦИЯ ---
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('user_id');

if (!userId) {
    tg.showAlert('Ошибка: ID пользователя не найден. Пожалуйста, запустите приложение снова из Telegram-бота.');
    tg.close();
    throw new Error("User ID is not provided in URL");
}

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: MANIFEST_URL,
    buttonRootId: 'ton-connect-button'
});

// --- ЭЛЕМЕНТЫ DOM ---
const amountInput = document.getElementById('ton-amount-input');
const sendButton = document.getElementById('send-button');
const walletInfoEl = document.getElementById('wallet-info');
const walletAddressEl = document.getElementById('wallet-address');
const paymentSection = document.getElementById('payment-section');

// --- ЛОГИКА ---
tonConnectUI.onStatusChange(wallet => {
    if (wallet) {
        const address = wallet.account.address;
        walletAddressEl.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
        walletInfoEl.classList.remove('hidden');
        paymentSection.classList.remove('hidden');
    } else {
        walletInfoEl.classList.add('hidden');
        paymentSection.classList.add('hidden');
    }
});

sendButton.addEventListener('click', async () => {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0.01) {
        tg.showAlert('Пожалуйста, введите корректную сумму (минимум 0.01 TON).');
        return;
    }

    const amountInNanoTON = Math.round(amount * 1_000_000_000).toString();
    const comment = `dep_${userId}`;

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [{
            address: RECIPIENT_WALLET,
            amount: amountInNanoTON,
            payload: btoa('\x00\x00\x00\x00' + comment)
        }]
    };

    try {
        tg.MainButton.setText('Ожидаем подтверждения...').show().showProgress();
        const result = await tonConnectUI.sendTransaction(transaction);

        // --- УЛУЧШЕНИЕ: Проверяем, что пользователь не отменил транзакцию ---
        if (!result || !result.boc) {
            tg.showAlert('Транзакция не была подтверждена или была отменена.');
            tg.MainButton.hideProgress();
            return;
        }

        const dataToSend = { 
            boc: result.boc,
            amount: amount 
        };
        tg.sendData(JSON.stringify(dataToSend));
        
        tg.showAlert('Транзакция отправлена! Бот пришлет уведомление о зачислении.');
        
        tg.MainButton.hideProgress();
        setTimeout(() => tg.close(), 3000);
    } catch (error) {
        tg.MainButton.hideProgress();
        console.error('Ошибка отправки транзакции:', error);
        tg.showAlert(`Произошла ошибка: ${error.message || 'Транзакция была отклонена.'}`);
    }
});
